import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import Icon from '../components/Icon';
import './AuthPage.css';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register, backend, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isLogin && !USERNAME_RE.test(form.username)) {
      setError('Username must be 3–20 characters: letters, numbers or underscores.');
      return;
    }
    if (!isLogin && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const offline = backend.online === false;

  return (
    <main className="page auth-page">
      <div className="auth-card card fade-up">
        <div className="auth-head">
          <span className="nav-mark auth-mark">
            <Icon name="crosshair" size={20} strokeWidth={2.4} />
          </span>
          <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted">
            {isLogin ? 'Sign in to post scores to the global leaderboards.' : 'Get on the global leaderboards. Your local stats stay too.'}
          </p>
        </div>

        {user && (
          <div className="alert alert-info">
            You’re signed in as <b>{user.username}</b>. <Link to="/profile">Go to profile</Link>
          </div>
        )}
        {offline && (
          <div className="alert alert-info">
            The account server is offline right now. You can still play every mode, and your runs are saved on this device.
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          {!isLogin && (
            <div className="field">
              <label htmlFor="username">Username</label>
              <input id="username" className="input" autoComplete="username" value={form.username} onChange={set('username')} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={set('password')}
              required
              minLength={isLogin ? undefined : 8}
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy || offline}>
            {busy ? <span className="spinner" /> : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {backend.googleAuth && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <a href={api.googleUrl()} className="btn btn-lg btn-block">
              <Icon name="google" /> Continue with Google
            </a>
          </>
        )}

        <p className="auth-switch">
          {isLogin ? (
            <>
              New here? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
