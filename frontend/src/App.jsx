import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';

// Heavy pages (three.js, charts) are split into their own chunks.
const ArenaPage = lazy(() => import('./pages/ArenaPage'));
const ReactionPage = lazy(() => import('./pages/ReactionPage'));
const CpsPage = lazy(() => import('./pages/CpsPage'));
const Leaderboards = lazy(() => import('./pages/Leaderboards'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Shell() {
  const { pathname } = useLocation();
  const immersive = pathname.startsWith('/play');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="route-loading">
            <span className="spinner" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
      {!immersive && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Home />} />
              <Route path="play" element={<Navigate to="/play/gridshot" replace />} />
              <Route path="play/:mode" element={<ArenaPage />} />
              <Route path="reaction" element={<ReactionPage />} />
              <Route path="cps" element={<CpsPage />} />
              <Route path="leaderboards" element={<Leaderboards />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="login" element={<AuthPage mode="login" />} />
              <Route path="register" element={<AuthPage mode="register" />} />
              <Route path="auth/callback" element={<AuthCallback />} />
              {/* Routes from the previous version of the site. */}
              <Route path="aim-training" element={<Navigate to="/play/gridshot" replace />} />
              <Route path="cps-game" element={<Navigate to="/cps" replace />} />
              <Route path="reaction-game" element={<Navigate to="/reaction" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
