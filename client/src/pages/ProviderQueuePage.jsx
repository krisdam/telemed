import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ProviderQueuePage() {
  const [queue, setQueue] = useState(null);

  useEffect(() => {
    api.providerQueue().then(({ queue }) => setQueue(queue));
  }, []);

  return (
    <main className="page wide">
      <h1>Today's queue</h1>
      <p className="lede">Scheduled visits waiting on documentation.</p>

      {queue === null && <p>Loading…</p>}

      {queue && queue.length === 0 && (
        <div className="empty-state">Your queue is clear.</div>
      )}

      {queue && queue.length > 0 && (
        <div className="card">
          {queue.map(a => (
            <div key={a.id} className="appt-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{a.patient_name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{formatTime(a.start_time)} · {a.reason}</div>
              </div>
              <Link to={`/provider/appointments/${a.id}`}>
                <button className="btn-primary">Open</button>
              </Link>
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
