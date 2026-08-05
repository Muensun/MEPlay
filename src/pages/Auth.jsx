import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVATARS, avatarUrlFor } from '../assets/avatars';
import { en } from '../i18n/en';
import PillButton from '../components/PillButton';

export default function Auth() {
  const { users, createAccount, loginAs } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(users.length > 0 ? 'login' : 'signin');
  const [username, setUsername] = useState('');
  const [avatarId, setAvatarId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    // No real network call yet (local-only), but the loading state is
    // wired for when account creation talks to a server.
    await Promise.resolve();
    const result = createAccount(username, avatarId);
    setBusy(false);
    if (result.ok) navigate('/');
    else setError(result.error);
  }

  async function handleLogin(userId) {
    setError('');
    setBusy(true);
    await Promise.resolve();
    const result = loginAs(userId);
    setBusy(false);
    if (result.ok) navigate('/');
    else setError(result.error);
  }

  return (
    <div className="page auth-page">
      <img src="/logo.png" alt={en.common.appName} className="auth-logo" />
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => setMode('signin')}
            type="button"
          >
            {en.auth.signInTab}
          </button>
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
            type="button"
          >
            {en.auth.loginTab}
          </button>
        </div>

        {mode === 'signin' ? (
          <form onSubmit={handleCreate}>
            <h2 className="auth-heading">{en.auth.signInHeading}</h2>
            <label>
              {en.auth.usernameLabel}
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={en.auth.usernamePlaceholder}
                required
              />
            </label>

            <p className="avatar-picker-label">{en.auth.chooseAvatarLabel}</p>
            <div className="avatar-picker">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`avatar-option ${avatarId === a.id ? 'selected' : ''}`}
                  onClick={() => setAvatarId(a.id)}
                  aria-pressed={avatarId === a.id}
                >
                  <img src={a.url} alt="" />
                </button>
              ))}
            </div>

            {error && <p className="error-text">{error}</p>}

            <PillButton variant="signin" type="submit" loading={busy} disabled={busy}>
              {busy ? en.auth.creatingAccount : en.auth.createAccountCta}
            </PillButton>
          </form>
        ) : (
          <div>
            <h2 className="auth-heading">{en.auth.loginHeading}</h2>
            {users.length === 0 ? (
              <>
                <p className="muted">{en.auth.noAccountsYet}</p>
                <PillButton variant="signin" onClick={() => setMode('signin')}>
                  {en.auth.createInsteadCta}
                </PillButton>
              </>
            ) : (
              <>
                <p className="avatar-picker-label">{en.auth.existingAccountsHeading}</p>
                <ul className="account-list">
                  {users.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="account-option"
                        onClick={() => handleLogin(u.id)}
                        disabled={busy}
                      >
                        <img src={avatarUrlFor(u.avatarId)} alt="" />
                        <span>{u.username}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {error && <p className="error-text">{error}</p>}
                <PillButton variant="login" onClick={() => setMode('signin')} disabled={busy}>
                  {en.auth.createInsteadCta}
                </PillButton>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
