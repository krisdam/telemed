import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveSession } from '../api';
import { useAuth } from '../AuthContext';

export default function SignupPage() {
  const [plans, setPlans] = useState(null);
  const [plan, setPlan] = useState('pay_per_visit');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    api.plans().then(({ plans }) => setPlans(plans));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.signup({ ...form, plan });
      saveSession(token);
      setUser(user);
      navigate('/intake');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <h1>Create your account</h1>
      <p className="lede">Choose how you want to access care, then set up your login.</p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        {plans && (
          <div className="field">
            <label>Choose a plan</label>
            <div className="plan-grid">
              {Object.entries(plans).map(([key, p]) => (
                <button
                  type="button"
                  key={key}
                  className={`plan-card ${plan === key ? 'selected' : ''}`}
                  onClick={() => setPlan(key)}
                >
                  <div className="plan-name">{p.label}</div>
                  <div className="plan-price">
                    {p.monthly_price_cents === 0 ? '$0' : `$${(p.monthly_price_cents / 100).toFixed(0)}`}
                    <span>/mo</span>
                  </div>
                  <div className="plan-detail">
                    {p.included_visits > 0
                      ? `${p.included_visits} visits included, then $${(p.visit_price_cents / 100).toFixed(0)} each`
                      : `$${(p.visit_price_cents / 100).toFixed(0)} per visit`}
                    {p.priority_scheduling && <div>Priority scheduling</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>

        <button type="submit" className="btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 14, color: 'var(--ink-soft)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--teal)', fontWeight: 600 }}>Log in</Link>
      </p>
    </main>
  );
}
