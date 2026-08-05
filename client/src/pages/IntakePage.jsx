import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function IntakePage() {
  const [form, setForm] = useState({ reason: '', history: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { intake_id } = await api.submitIntake(form);
      navigate('/book', { state: { intake_id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <h1>Tell us why you're visiting</h1>
      <p className="lede">This goes to your provider before the visit so they can prepare.</p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="reason">Reason for visit</label>
          <input
            id="reason"
            required
            placeholder="e.g. Persistent cough for 5 days"
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="history">Relevant medical history (optional)</label>
          <textarea
            id="history"
            placeholder="Allergies, current medications, prior related conditions..."
            value={form.history}
            onChange={e => setForm({ ...form, history: e.target.value })}
          />
        </div>
        <button type="submit" className="btn-primary btn-block" disabled={loading}>
          {loading ? 'Saving…' : 'Continue to booking'}
        </button>
      </form>
    </main>
  );
}
