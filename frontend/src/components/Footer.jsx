import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

export default function Footer() {
  const { backend } = useAuth();
  const status =
    backend.online == null ? 'Checking server…' : backend.online ? 'Leaderboard server online' : 'Offline mode: progress saved locally';

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <b>Headshot Haven</b>
          <span className="muted">Free aim training in your browser</span>
        </div>
        <div className="footer-links">
          <Link to="/play/gridshot">Arena</Link>
          <Link to="/leaderboards">Leaderboards</Link>
          <Link to="/settings">Settings</Link>
          <a href="https://github.com/Abdi-Suufi/Headshot-Haven" target="_blank" rel="noreferrer" aria-label="GitHub">
            <Icon name="github" size={18} />
          </a>
        </div>
        <div className={`footer-status ${backend.online ? 'is-online' : ''}`}>
          <span className="dot" /> {status}
        </div>
      </div>
    </footer>
  );
}
