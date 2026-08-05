import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveSession } from '../api';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(form);
      saveSession(token);
      setUser(user);
      navigate(user.role === 'provider' ? '/provider' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <h1>Log in</h1>
      <p className="lede">Patients and providers use the same login screen.</p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary btn-block" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="card" style={{ marginTop: 24, fontSize: 13, color: 'var(--ink-soft)' }}>
        Provider demo login — email <strong>provider@telecare.demo</strong>, password <strong>demo1234</strong>
      </div>

      <p style={{ marginTop: 20, fontSize: 14, color: 'var(--ink-soft)' }}>
        New here? <Link to="/signup" style={{ color: 'var(--teal)', fontWeight: 600 }}>Create an account</Link>
      </p>
    </main>
  );
}
