import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function DashboardPage() {
  const [appointments, setAppointments] = useState(null);

  useEffect(() => {
    api.myAppointments().then(({ appointments }) => setAppointments(appointments));
  }, []);

  return (
    <main className="page">
      <h1>My visits</h1>
      <p className="lede">Everything you've booked and completed, in one place.</p>

      <div style={{ marginBottom: 24 }}>
        <Link to="/intake"><button className="btn-primary">Book a new visit</button></Link>
      </div>

      {appointments === null && <p>Loading…</p>}

      {appointments && appointments.length === 0 && (
        <div className="empty-state">No visits yet. Book your first one above.</div>
      )}

      {appointments && appointments.length > 0 && (
        <div className="card">
          {appointments.map(a => (
            <div key={a.id} className="appt-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{a.provider_name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{formatTime(a.start_time)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`status-badge status-${a.status}`}>{a.status}</span>
                <Link to={`/appointments/${a.id}`} className="link-btn">View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
