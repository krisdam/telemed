import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function PlanPage() {
  const [plans, setPlans] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { user, setUser } = useAuth();

  useEffect(() => {
    api.plans().then(({ plans }) => setPlans(plans));
  }, []);

  async function handleChange(planKey) {
    setSaving(true);
    setMessage('');
    try {
      const { user } = await api.changePlan(planKey);
      setUser(user);
      setMessage(`You're now on the ${plans[planKey].label} plan.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <h1>Your plan</h1>
      <p className="lede">
        You're currently on <strong>{plans ? plans[user.plan].label : '…'}</strong>, with{' '}
        {user.visits_remaining} included visit{user.visits_remaining === 1 ? '' : 's'} remaining this period.
      </p>

      {message && <div className="card" style={{ marginBottom: 16, background: 'var(--teal-soft)', border: 'none' }}>{message}</div>}

      {plans && (
        <div className="plan-grid">
          {Object.entries(plans).map(([key, p]) => (
            <button
              key={key}
              className={`plan-card ${user.plan === key ? 'selected' : ''}`}
              onClick={() => handleChange(key)}
              disabled={saving || user.plan === key}
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
              {user.plan === key && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: 'var(--teal-dark)' }}>Current plan</div>}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
