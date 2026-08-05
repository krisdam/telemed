import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function AppointmentPage() {
  const { id } = useParams();
  const [appt, setAppt] = useState(null);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  function load() {
    api.appointment(id).then(({ appointment }) => setAppt(appointment)).catch(err => setError(err.message));
  }

  useEffect(() => { load(); }, [id]);

  if (error) return <main className="page"><div className="error-banner">{error}</div></main>;
  if (!appt) return <main className="page"><p>Loading…</p></main>;

  return (
    <main className="page">
      <h1>Visit with {appt.provider_name}</h1>
      <p className="lede">{formatTime(appt.start_time)} · {appt.specialty}</p>

      {appt.status === 'scheduled' && !joined && (
        <div className="card">
          <h2>Ready when you are</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '8px 0 16px' }}>
            Reason for visit: {appt.reason}
          </p>
          <button className="btn-primary" onClick={() => setJoined(true)}>Join visit</button>
        </div>
      )}

      {appt.status === 'scheduled' && joined && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--teal-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <span style={{ color: 'var(--teal-dark)', fontWeight: 600 }}>{initials(appt.provider_name)}</span>
          </div>
          <h2>In visit with {appt.provider_name}</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
            This is a simulated consult screen. Your provider is reviewing your intake and will document the visit on their end.
          </p>
        </div>
      )}

      {appt.status === 'completed' && (
        <>
          <div className="card">
            <h2>Visit summary</h2>
            <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{appt.clinical_note}</p>
          </div>
          {appt.follow_up_doc && (
            <div className="card">
              <h2>Follow-up</h2>
              <p style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{appt.follow_up_doc}</p>
            </div>
          )}
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <Link to="/dashboard" className="link-btn">Back to my visits</Link>
      </p>
    </main>
  );
}

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2);
}
