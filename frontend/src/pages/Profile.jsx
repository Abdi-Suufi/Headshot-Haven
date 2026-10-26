import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { allBoards, boardKey, boardLabel, formatScore, GAMES, isBetter } from '../lib/games';
import { useHistory } from '../lib/stats';
import { useAuth } from '../contexts/AuthContext';
import Chart from '../components/Chart';
import Icon, { GAME_ICONS } from '../components/Icon';
import './Profile.css';

function detail(run) {
  const d = run.data || {};
  if (run.game === 'tracking') return `${d.onTargetPct ?? '—'}% on target`;
  if (GAMES[run.game]?.kind === 'arena') return `${d.accuracy ?? '—'}% acc · ${d.hits ?? 0} hits`;
  if (run.game === 'reaction') return d.best ? `best ${d.best}ms` : '';
  if (run.game === 'cps') return `${d.clicks ?? '—'} clicks · peak ${d.peak ?? '—'}`;
  return '';
}

export default function Profile() {
  const { user, backend } = useAuth();
  const history = useHistory();

  const boards = useMemo(
    () =>
      allBoards().map(({ game, variant }) => {
        const key = boardKey(game, variant);
        const runs = history.filter((r) => boardKey(r.game, r.variant) === key);
        const best = runs.reduce((b, r) => (isBetter(game, r.score, b) ? r.score : b), null);
        const last5 = runs.slice(0, 5);
        const avg = last5.length ? last5.reduce((a, r) => a + r.score, 0) / last5.length : null;
        return { game, variant, key, runs, best, avg, series: runs.slice(0, 20).reverse().map((r) => r.score) };
      }),
    [history],
  );

  const totals = useMemo(() => {
    const seconds = history.reduce((s, r) => s + (r.data?.duration || (r.game === 'reaction' ? 15 : 0)), 0);
    const counts = {};
    for (const r of history) counts[r.game] = (counts[r.game] || 0) + 1;
    const fav = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const days = new Set(history.map((r) => new Date(r.at).toDateString())).size;
    return { seconds, fav: fav ? GAMES[fav[0]].name : '—', days };
  }, [history]);

  return (
    <main className="page">
      <div className="container">
        <header className="profile-head card">
          <span className="profile-avatar">
            {user?.profilePicture ? <img src={user.profilePicture} alt="" /> : user ? user.username[0].toUpperCase() : <Icon name="user" size={26} />}
          </span>
          <div className="profile-id">
            <h1>{user ? user.username : 'Guest player'}</h1>
            <p className="muted">
              {user
                ? `${user.email} · joined ${new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
                : 'Your stats are saved on this device. Sign in to post scores to the global leaderboards.'}
            </p>
          </div>
          {!user && backend.online !== false && (
            <div className="row">
              <Link to="/login" className="btn">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Create account
              </Link>
            </div>
          )}
        </header>

        <div className="profile-totals">
          <div className="stat">
            <div className="stat-label">Sessions</div>
            <div className="stat-value">{history.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Time trained</div>
            <div className="stat-value">
              {Math.round(totals.seconds / 60)}
              <small>min</small>
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Days active</div>
            <div className="stat-value">{totals.days}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Most played</div>
            <div className="stat-value profile-fav">{totals.fav}</div>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="card empty profile-empty">
            <Icon name="target" size={36} />
            <h2>No runs yet</h2>
            <p>Play any mode and your scores, personal bests and progress charts will show up here.</p>
            <Link to="/play/gridshot" className="btn btn-primary">
              <Icon name="play" size={14} /> Play Gridshot
            </Link>
          </div>
        ) : (
          <>
            <h2 className="profile-section-title">Personal bests</h2>
            <div className="profile-modes">
              {boards.map((b) => (
                <Link key={b.key} to={GAMES[b.game].path} className="card profile-mode">
                  <div className="row">
                    <span className="mode-icon-sm">
                      <Icon name={GAME_ICONS[b.game]} size={16} />
                    </span>
                    <b>{boardLabel(b.game, b.variant)}</b>
                    <span className="spacer" />
                    <span className="muted mono" style={{ fontSize: 12 }}>
                      {b.runs.length} runs
                    </span>
                  </div>
                  <div className="profile-mode-best mono">{formatScore(b.game, b.best)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {b.avg != null ? `Last ${Math.min(5, b.runs.length)} avg: ${formatScore(b.game, b.avg)}` : 'Not played yet'}
                  </div>
                  {b.series.length >= 2 && (
                    <Chart values={b.series} height={90} formatY={(v) => (b.game === 'cps' ? v.toFixed(1) : String(Math.round(v)))} formatX={(i) => `${i + 1}`} xLabel="Run" />
                  )}
                </Link>
              ))}
            </div>

            <h2 className="profile-section-title">Recent sessions</h2>
            <div className="card" style={{ padding: 0 }}>
              <div className="table-scroll-x">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mode</th>
                      <th className="num">Score</th>
                      <th className="profile-hide-sm">Details</th>
                      <th className="num">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 15).map((run) => (
                      <tr key={run.id}>
                        <td>
                          <span className="row" style={{ gap: 8 }}>
                            <Icon name={GAME_ICONS[run.game]} size={15} />
                            {boardLabel(run.game, run.variant)}
                          </span>
                        </td>
                        <td className="num">
                          <b>{formatScore(run.game, run.score)}</b>
                        </td>
                        <td className="muted profile-hide-sm">{detail(run)}</td>
                        <td className="num muted">{new Date(run.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
