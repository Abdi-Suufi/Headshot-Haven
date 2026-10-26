import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Landing route for the Google OAuth redirect: stores the issued token and loads the profile. */
export default function AuthCallback() {
  const [params] = useSearchParams();
  const { acceptToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    // The API puts the token in the URL fragment so it never hits server logs.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('token') || params.get('token');
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) {
      setError(hash.get('error') || params.get('error') || 'No sign-in token was returned.');
      return;
    }
    acceptToken(token).then((user) => {
      if (user) navigate('/profile', { replace: true });
      else setError('That sign-in link is invalid or has expired.');
    });
  }, [params, acceptToken, navigate]);

  return (
    <main className="page container" style={{ textAlign: 'center', paddingTop: 120 }}>
      {error ? (
        <>
          <h1 style={{ fontSize: 32 }}>Sign-in failed</h1>
          <p className="muted" style={{ margin: '12px 0 24px' }}>
            {error}
          </p>
          <Link to="/login" className="btn btn-primary">
            Back to sign in
          </Link>
        </>
      ) : (
        <span className="spinner" />
      )}
    </main>
  );
}
