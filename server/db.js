const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'telecare.db'));
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient', -- patient | provider
  plan TEXT NOT NULL DEFAULT 'pay_per_visit', -- pay_per_visit | member | member_plus
  visits_remaining INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  is_priority INTEGER NOT NULL DEFAULT 0,
  is_booked INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS intakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  history TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  provider_id INTEGER NOT NULL,
  slot_id INTEGER NOT NULL,
  intake_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | completed | cancelled
  price_charged_cents INTEGER NOT NULL,
  clinical_note TEXT,
  follow_up_doc TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (slot_id) REFERENCES slots(id),
  FOREIGN KEY (intake_id) REFERENCES intakes(id)
);
`);

// Seed providers + slots once
const providerCount = db.prepare('SELECT COUNT(*) as c FROM providers').get().c;
if (providerCount === 0) {
  const insertProvider = db.prepare('INSERT INTO providers (name, specialty) VALUES (?, ?)');
  const providers = [
    ['Dr. Amara Chen', 'Family Medicine'],
    ['Dr. Priya Nair', 'Urgent Care'],
    ['Dr. Ben Osei', 'Internal Medicine'],
  ];
  const providerIds = providers.map(p => insertProvider.run(...p).lastInsertRowid);

  const insertSlot = db.prepare('INSERT INTO slots (provider_id, start_time, is_priority) VALUES (?, ?, ?)');
  const now = new Date();
  providerIds.forEach((pid) => {
    for (let day = 0; day < 3; day++) {
      for (let hour of [9, 11, 13, 15, 17]) {
        const slotTime = new Date(now);
        slotTime.setDate(now.getDate() + day + 1);
        slotTime.setHours(hour, 0, 0, 0);
        const isPriority = hour === 9 || hour === 17 ? 1 : 0;
        insertSlot.run(pid, slotTime.toISOString(), isPriority);
      }
    }
  });
}

// Seed a demo provider login
const demoProviderCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'provider'").get().c;
if (demoProviderCount === 0) {
  const bcrypt = require('bcryptjs');
  db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
    .run('provider@telecare.demo', bcrypt.hashSync('demo1234', 8), 'Dr. Amara Chen', 'provider');
}

module.exports = db;
