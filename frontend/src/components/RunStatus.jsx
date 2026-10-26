import { Link } from 'react-router-dom';
import Icon from './Icon';

/** One-line summary of where a finished run was saved. */
export default function RunStatus({ remote }) {
  switch (remote.state) {
    case 'saving':
      return (
        <div className="run-status">
          <span className="spinner" style={{ width: 14, height: 14 }} /> Submitting to leaderboard…
        </div>
      );
    case 'saved':
      return (
        <div className="run-status is-good">
          <Icon name="check" size={16} /> Saved to the global leaderboard
          {remote.rank ? (
            <>
              {' '}
              · rank <b>#{remote.rank}</b>
            </>
          ) : null}
        </div>
      );
    case 'guest':
      return (
        <div className="run-status">
          Saved locally. <Link to="/register">Create an account</Link> to post scores to the leaderboard.
        </div>
      );
    case 'offline':
      return (
        <div className="run-status">
          <Icon name="offline" size={16} /> Saved locally (leaderboard server offline)
        </div>
      );
    case 'error':
      return <div className="run-status is-bad">Couldn’t submit: {remote.message}. Saved locally.</div>;
    default:
      return null;
  }
}
