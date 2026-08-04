import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <img src="/logo.png" alt="MEPlay" className="brand-logo" />
        MEPlay
      </Link>
      <nav className="nav-links">
        <Link to="/">หน้าแรก</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </nav>
      <div className="header-user">
        {user ? (
          <>
            <span className="points-pill">⭐ {user.points} แต้ม</span>
            <span className="display-name">{user.displayName}</span>
            <button
              className="btn-ghost"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              ออกจากระบบ
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary">
            เข้าสู่ระบบ / สมัคร
          </Link>
        )}
      </div>
    </header>
  );
}
