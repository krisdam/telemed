import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="topbar">
      <Link to={user?.role === 'provider' ? '/provider' : '/'} className="brand">
        <span className="brand-mark" aria-hidden="true"></span>
        TeleCare
      </Link>
      <div className="topbar-actions">
        {user && user.role === 'patient' && (
          <>
            <Link to="/dashboard">My visits</Link>
            <Link to="/plan">Plan</Link>
            <span className="pill">{planLabel(user.plan)}</span>
          </>
        )}
        {user && (
          <>
            <span>{user.name}</span>
            <button className="link-btn" onClick={handleLogout}>Log out</button>
          </>
        )}
        {!user && <Link to="/login">Log in</Link>}
      </div>
    </header>
  );
}

function planLabel(plan) {
  if (plan === 'member') return 'Member';
  if (plan === 'member_plus') return 'Member+';
  return 'Pay-per-visit';
}
