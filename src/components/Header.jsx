import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { avatarUrlFor } from '../assets/avatars';
import { en } from '../i18n/en';
import { MAX_TIME_SEC, formatMMSS, secToNextRefill } from '../lib/time';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import SignOutSheet from './SignOutSheet';
import PillButton from './PillButton';

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5.2l3.6 2.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Header() {
  const { user, stats, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [, forceTick] = useState(0);

  const animatedScore = useAnimatedNumber(stats?.meScore ?? 0);

  // Re-render once a second so the "next refill" countdown reads live,
  // without writing to storage on every tick.
  useEffect(() => {
    if (!stats || stats.timeSec >= MAX_TIME_SEC) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [stats]);

  function handleSignOut() {
    setConfirmingSignOut(false);
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  const depleted = stats && stats.timeSec <= 0;

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <img src="/logo.png" alt="" className="brand-logo" />
        <img src="/nameapp.png" alt={en.home.heroWordmarkAlt} className="brand-wordmark" />
      </Link>
      <nav className="nav-links">
        <Link to="/">{en.header.homeLink}</Link>
        <Link to="/leaderboard">{en.header.leaderboardLink}</Link>
      </nav>
      <div className="header-user">
        {user && stats ? (
          <>
            <span className="score-pill">
              <img src="/point.png" alt="" className="score-pill-icon" />
              {animatedScore.toLocaleString()} {en.header.scoreUnit}
            </span>
            <span className={`time-pill ${depleted ? 'depleted' : ''}`}>
              <ClockIcon />
              {depleted
                ? `${en.header.timeDepletedLabel} · ${en.header.nextRefillPrefix} ${formatMMSS(secToNextRefill(stats, Date.now()))}`
                : formatMMSS(stats.timeSec)}
            </span>
            <div className="avatar-menu">
              <button
                className="avatar-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <img src={avatarUrlFor(user.avatarId)} alt="" className="avatar-img" />
                <span className="display-name">{user.username}</span>
              </button>
              {menuOpen && (
                <div className="avatar-dropdown" role="menu">
                  <button
                    className="avatar-dropdown-item"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmingSignOut(true);
                    }}
                  >
                    {en.header.signOutMenuItem}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <PillButton variant="signin" onClick={() => navigate('/login')}>
            {en.header.signInCta}
          </PillButton>
        )}
      </div>

      {confirmingSignOut && (
        <SignOutSheet onConfirm={handleSignOut} onCancel={() => setConfirmingSignOut(false)} />
      )}
    </header>
  );
}
