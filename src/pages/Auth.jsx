import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVATARS } from '../assets/avatars';
import { en } from '../i18n/en';
import PillButton from '../components/PillButton';

export default function Auth() {
  const { createAccount, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarId, setAvatarId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const result =
      mode === 'signin' ? await createAccount(username, password, avatarId) : await login(username, password);
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

        <form onSubmit={handleSubmit}>
          <h2 className="auth-heading">{mode === 'signin' ? en.auth.signInHeading : en.auth.loginHeading}</h2>
          <label>
            {en.auth.usernameLabel}
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={en.auth.usernamePlaceholder}
              autoComplete="username"
              required
            />
          </label>
          <label>
            {en.auth.passwordLabel}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={en.auth.passwordPlaceholder}
              autoComplete={mode === 'signin' ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          {mode === 'signin' && (
            <>
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
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          <PillButton variant={mode === 'signin' ? 'signin' : 'login'} type="submit" loading={busy} disabled={busy}>
            {mode === 'signin'
              ? busy
                ? en.auth.creatingAccount
                : en.auth.createAccountCta
              : busy
                ? en.auth.loggingIn
                : en.auth.loginCta}
          </PillButton>
        </form>
      </div>
    </div>
  );
}
