import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return (
    <main className="page container" style={{ textAlign: 'center', paddingTop: 120 }}>
      <div className="eyebrow" style={{ justifyContent: 'center' }}>
        <Icon name="crosshair" size={14} /> 404
      </div>
      <h1 style={{ fontSize: 48, margin: '12px 0' }}>Missed.</h1>
      <p className="muted">That page doesn’t exist. Your accuracy elsewhere is probably better.</p>
      <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
        <Link to="/" className="btn">
          Home
        </Link>
        <Link to="/play/gridshot" className="btn btn-primary">
          Play Gridshot
        </Link>
      </div>
    </main>
  );
}
