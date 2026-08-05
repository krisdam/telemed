import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function ProviderVisitPage() {
  const { id } = useParams();
  const [appt, setAppt] = useState(null);
  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.appointment(id).then(({ appointment }) => setAppt(appointment)).catch(err => setError(err.message));
  }, [id]);

  async function handleComplete(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.completeVisit(id, { clinical_note: note, follow_up_doc: followUp });
      navigate('/provider');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <main className="page"><div className="error-banner">{error}</div></main>;
  if (!appt) return <main className="page"><p>Loading…</p></main>;

  return (
    <main className="page wide">
      <h1>{appt.patient_name}</h1>
      <p className="lede">{formatTime(appt.start_time)}</p>

      <div className="two-col">
        <div className="card">
          <h2>Patient intake</h2>
          <p style={{ fontSize: 14, marginTop: 8 }}><strong>Reason:</strong> {appt.reason}</p>
          {appt.history && <p style={{ fontSize: 14, marginTop: 8 }}><strong>History:</strong> {appt.history}</p>}
        </div>

        <div className="card">
          <h2>Document visit</h2>
          <form onSubmit={handleComplete}>
            <div className="field">
              <label htmlFor="note">Clinical note</label>
              <textarea id="note" required value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="followup">Follow-up (optional)</label>
              <textarea id="followup" placeholder="Referral, prescription note, next steps..." value={followUp} onChange={e => setFollowUp(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary btn-block" disabled={saving}>
              {saving ? 'Completing…' : 'Complete visit'}
            </button>
          </form>
        </div>
      </div>

      <p style={{ marginTop: 24 }}>
        <Link to="/provider" className="link-btn">Back to queue</Link>
      </p>
    </main>
  );
}

function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
