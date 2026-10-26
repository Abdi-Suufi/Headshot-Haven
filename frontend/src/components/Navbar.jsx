import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';
import logo from '../assets/img/headshot-haven-logo.svg';
import './Navbar.css';

const LINKS = [
  { to: '/play/gridshot', label: '3D Arena', match: '/play' },
  { to: '/reaction', label: 'Reaction' },
  { to: '/cps', label: 'CPS' },
  { to: '/leaderboards', label: 'Leaderboards' },
  { to: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);

  const isActive = (link) => location.pathname.startsWith(link.match || link.to);

  return (
    <header className="nav">
      <div className="nav-inner container">
        <Link to="/" className="nav-brand" aria-label="Headshot Haven home">
          <span className="nav-mark" aria-hidden="true">
            <Icon name="crosshair" size={18} strokeWidth={2.4} />
          </span>
          <img src={logo} alt="Headshot Haven" />
        </Link>

        <nav className={`nav-links ${open ? 'is-open' : ''}`}>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={isActive(link) ? 'active' : ''}>
              {link.label}
            </NavLink>
          ))}
          <div className="nav-mobile-auth">
            {user ? (
              <>
                <Link to="/profile">Profile</Link>
                <button type="button" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Create account</Link>
              </>
            )}
          </div>
        </nav>

        <div className="nav-actions">
          {user ? (
            <div className="nav-user" ref={menuRef}>
              <button type="button" className="nav-avatar" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                {user.profilePicture ? <img src={user.profilePicture} alt="" /> : user.username?.[0]?.toUpperCase()}
              </button>
              {menu && (
                <div className="nav-menu panel-glass">
                  <div className="nav-menu-head">
                    <b>{user.username}</b>
                    <span className="muted">{user.email}</span>
                  </div>
                  <Link to="/profile">
                    <Icon name="user" size={16} /> Profile & stats
                  </Link>
                  <Link to="/settings">
                    <Icon name="settings" size={16} /> Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                  >
                    <Icon name="logout" size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/profile" className="btn btn-ghost btn-sm nav-hide-sm">
                My stats
              </Link>
              <Link to="/login" className="btn btn-sm nav-hide-sm">
                Sign in
              </Link>
            </>
          )}
          <button type="button" className="nav-burger btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
