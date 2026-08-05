require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { PLANS } = require('./plans');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Not authorized' });
    next();
  };
}

// ---------- Auth ----------

app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, plan } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const hash = bcrypt.hashSync(password, 8);
  const visitsRemaining = PLANS[plan].included_visits;
  const info = db.prepare(
    'INSERT INTO users (email, password_hash, name, role, plan, visits_remaining) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(email, hash, name, 'patient', plan, visitsRemaining);

  const user = getUserSafe(info.lastInsertRowid);
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  const token = jwt.sign({ id: row.id, role: row.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: getUserSafe(row.id) });
});

function getUserSafe(id) {
  const row = db.prepare('SELECT id, email, name, role, plan, visits_remaining FROM users WHERE id = ?').get(id);
  return row;
}

app.get('/api/me', auth, (req, res) => {
  res.json({ user: getUserSafe(req.user.id) });
});

// ---------- Plans ----------

app.get('/api/plans', (req, res) => {
  res.json({ plans: PLANS });
});

app.post('/api/plan/change', auth, (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
  const user = getUserSafe(req.user.id);
  // Upgrading/switching tops up included visits to the new plan's allotment;
  // downgrading takes effect immediately in this simplified demo model.
  db.prepare('UPDATE users SET plan = ?, visits_remaining = ? WHERE id = ?')
    .run(plan, PLANS[plan].included_visits, req.user.id);
  res.json({ user: getUserSafe(req.user.id) });
});

// ---------- Providers & slots ----------

app.get('/api/providers', (req, res) => {
  const providers = db.prepare('SELECT * FROM providers').all();
  res.json({ providers });
});

app.get('/api/slots', auth, (req, res) => {
  const user = getUserSafe(req.user.id);
  const plan = PLANS[user.plan];
  const rows = db.prepare(`
    SELECT s.*, p.name as provider_name, p.specialty
    FROM slots s JOIN providers p ON p.id = s.provider_id
    WHERE s.is_booked = 0
    ORDER BY s.start_time ASC
  `).all();

  const visible = rows.filter(s => plan.priority_scheduling || !s.is_priority);
  res.json({ slots: visible });
});

// ---------- Intake ----------

app.post('/api/intake', auth, (req, res) => {
  const { reason, history } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason for visit is required' });
  const info = db.prepare('INSERT INTO intakes (patient_id, reason, history) VALUES (?, ?, ?)')
    .run(req.user.id, reason, history || '');
  res.json({ intake_id: info.lastInsertRowid });
});

// ---------- Booking ----------

app.post('/api/appointments', auth, (req, res) => {
  const { slot_id, intake_id } = req.body;
  const slot = db.prepare('SELECT * FROM slots WHERE id = ? AND is_booked = 0').get(slot_id);
  if (!slot) return res.status(409).json({ error: 'That slot is no longer available' });

  const intake = db.prepare('SELECT * FROM intakes WHERE id = ? AND patient_id = ?').get(intake_id, req.user.id);
  if (!intake) return res.status(400).json({ error: 'Complete intake before booking' });

  const user = getUserSafe(req.user.id);
  const plan = PLANS[user.plan];
  let priceCharged = plan.visit_price_cents;
  let usedIncludedVisit = false;

  if (user.visits_remaining > 0) {
    priceCharged = 0;
    usedIncludedVisit = true;
  }

  const bookTxn = db.transaction(() => {
    db.prepare('UPDATE slots SET is_booked = 1 WHERE id = ?').run(slot_id);
    if (usedIncludedVisit) {
      db.prepare('UPDATE users SET visits_remaining = visits_remaining - 1 WHERE id = ?').run(req.user.id);
    }
    return db.prepare(
      'INSERT INTO appointments (patient_id, provider_id, slot_id, intake_id, price_charged_cents) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, slot.provider_id, slot_id, intake_id, priceCharged);
  });

  const info = bookTxn();
  const appointment = getAppointmentDetail(info.lastInsertRowid);
  res.json({ appointment });
});

function getAppointmentDetail(id) {
  return db.prepare(`
    SELECT a.*, p.name as provider_name, p.specialty, s.start_time,
           i.reason, i.history, u.name as patient_name
    FROM appointments a
    JOIN providers p ON p.id = a.provider_id
    JOIN slots s ON s.id = a.slot_id
    JOIN intakes i ON i.id = a.intake_id
    JOIN users u ON u.id = a.patient_id
    WHERE a.id = ?
  `).get(id);
}

app.get('/api/appointments/mine', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, p.name as provider_name, p.specialty, s.start_time
    FROM appointments a
    JOIN providers p ON p.id = a.provider_id
    JOIN slots s ON s.id = a.slot_id
    WHERE a.patient_id = ?
    ORDER BY s.start_time DESC
  `).all(req.user.id);
  res.json({ appointments: rows });
});

app.get('/api/appointments/:id', auth, (req, res) => {
  const appt = getAppointmentDetail(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  if (appt.patient_id !== req.user.id && req.user.role !== 'provider') {
    return res.status(403).json({ error: 'Not authorized to view this appointment' });
  }
  res.json({ appointment: appt });
});

// ---------- Provider queue ----------

app.get('/api/provider/queue', auth, requireRole('provider'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, s.start_time, i.reason, i.history, u.name as patient_name
    FROM appointments a
    JOIN slots s ON s.id = a.slot_id
    JOIN intakes i ON i.id = a.intake_id
    JOIN users u ON u.id = a.patient_id
    WHERE a.status = 'scheduled'
    ORDER BY s.start_time ASC
  `).all();
  res.json({ queue: rows });
});

app.post('/api/provider/appointments/:id/complete', auth, requireRole('provider'), (req, res) => {
  const { clinical_note, follow_up_doc } = req.body;
  if (!clinical_note) return res.status(400).json({ error: 'Clinical note is required to complete the visit' });

  db.prepare(
    "UPDATE appointments SET status = 'completed', clinical_note = ?, follow_up_doc = ? WHERE id = ?"
  ).run(clinical_note, follow_up_doc || '', req.params.id);

  res.json({ appointment: getAppointmentDetail(req.params.id) });
});

// ---------- Serve frontend in production ----------

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TeleCare server running on port ${PORT}`);
});
