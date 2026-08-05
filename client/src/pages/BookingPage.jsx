import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function BookingPage() {
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const intakeId = state?.intake_id;

  useEffect(() => {
    if (!intakeId) {
      navigate('/intake');
      return;
    }
    api.slots().then(({ slots }) => setSlots(slots)).catch(err => setError(err.message));
  }, [intakeId]);

  async function handleBook(slotId) {
    setError('');
    setBookingId(slotId);
    try {
      const { appointment } = await api.book({ slot_id: slotId, intake_id: intakeId });
      navigate(`/appointments/${appointment.id}`);
    } catch (err) {
      setError(err.message);
      setBookingId(null);
    }
  }

  return (
    <main className="page">
      <h1>Book your visit</h1>
      <p className="lede">
        {user?.plan === 'pay_per_visit'
          ? 'Upgrade to a membership plan to unlock priority slots (marked below).'
          : 'As a member, you have access to priority slots — marked below.'}
      </p>

      {error && <div className="error-banner">{error}</div>}

      {!slots && <p>Loading available times…</p>}

      {slots && slots.length === 0 && (
        <div className="empty-state">No open slots right now. Check back soon.</div>
      )}

      {slots && slots.length > 0 && (
        <div className="slot-list">
          {slots.map(s => (
            <div key={s.id} className={`slot-row ${s.is_priority ? 'priority' : ''}`}>
              <div className="slot-meta">
                <div className="provider">{s.provider_name} · {s.specialty}</div>
                <div className="time">{formatTime(s.start_time)}</div>
                {s.is_priority ? <div className="tag-priority">Priority slot</div> : null}
              </div>
              <button
                className="btn-primary"
                disabled={bookingId === s.id}
                onClick={() => handleBook(s.id)}
              >
                {bookingId === s.id ? 'Booking…' : 'Book'}
              </button>
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
