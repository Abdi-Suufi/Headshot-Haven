import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';
import { importGuestRuns, mergeRuns, runFromServer, setHistoryOwner } from '../lib/stats';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // `online` stays null until the first health check finishes.
  const [backend, setBackend] = useState({ online: null, googleAuth: false, database: false });

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return null;
    }
    try {
      const { user: me } = await api.me();
      setUser(me);
      return me;
    } catch (err) {
      // Only discard the token when the server actually rejected it.
      if (err.status === 401) setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const health = await api.health();
        if (cancelled) return;
        setBackend({ online: true, googleAuth: !!health.googleAuth, database: health.database === 'connected' });
        await loadUser();
      } catch {
        if (!cancelled) setBackend({ online: false, googleAuth: false, database: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  // Each account sees only its own runs; on sign-in, pull its past runs from the server too.
  const userId = user?.id ?? null;
  useEffect(() => {
    setHistoryOwner(userId);
    if (!userId) return undefined;
    let cancelled = false;
    api
      .history(100)
      .then(({ history }) => {
        if (!cancelled) mergeRuns(history.map(runFromServer));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await api.register(username, email, password);
    setToken(res.token);
    // A brand-new account keeps whatever was played as a guest just before signing up.
    setHistoryOwner(res.user.id);
    importGuestRuns();
    setUser(res.user);
    return res.user;
  }, []);

  const acceptToken = useCallback(
    async (token) => {
      setToken(token);
      return loadUser();
    },
    [loadUser],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, backend, login, register, logout, acceptToken, refreshUser: loadUser }),
    [user, loading, backend, login, register, logout, acceptToken, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
