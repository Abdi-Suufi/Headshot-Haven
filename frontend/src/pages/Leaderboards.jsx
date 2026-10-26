import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { allBoards, boardKey, boardLabel, formatScore, GAMES, isBetter } from '../lib/games';
import { useHistory } from '../lib/stats';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Icon, { GAME_ICONS } from '../components/Icon';
import './Leaderboards.css';

const BOARDS = allBoards();

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function Leaderboards() {
  const [params, setParams] = useSearchParams();
  const selected = BOARDS.find((b) => boardKey(b.game, b.variant) === params.get('board')) ?? BOARDS[0];
  const { game, variant } = selected;
  const { user, backend } = useAuth();
  const [state, setState] = useState({ status: 'idle', rows: [] });
  const history = useHistory();

  useEffect(() => {
    if (backend.online !== true) return undefined;
    let cancelled = false;
    setState({ status: 'loading', rows: [] });
    api
      .leaderboard(game, variant)
      .then((res) => !cancelled && setState({ status: 'ready', rows: res.leaderboard }))
      .catch((err) => !cancelled && setState({ status: 'error', rows: [], message: err.message }));
    return () => {
      cancelled = true;
    };
  }, [game, variant, backend.online]);

  const localTop = useMemo(() => {
    const runs = history.filter((r) => boardKey(r.game, r.variant) === boardKey(game, variant));
    runs.sort((a, b) => (isBetter(game, a.score, b.score) ? -1 : isBetter(game, b.score, a.score) ? 1 : 0));
    return runs.slice(0, 10);
  }, [game, variant, history]);

  const select = (b) => setParams({ board: boardKey(b.game, b.variant) }, { replace: true });

  return (
    <main className="page">
      <div className="container">
        <header className="page-header">
          <div className="eyebrow">
            <Icon name="trophy" size={14} /> Rankings
          </div>
          <h1>Leaderboards</h1>
          <p>Each player’s best score per mode. {GAMES[game].higherIsBetter ? 'Higher is better.' : 'Lower is better.'}</p>
        </header>

        <div className="lb-tabs">
          {BOARDS.map((b) => {
            const key = boardKey(b.game, b.variant);
            return (
              <button
                key={key}
                type="button"
                className={`lb-tab ${key === boardKey(game, variant) ? 'is-active' : ''}`}
                onClick={() => select(b)}
              >
                <Icon name={GAME_ICONS[b.game]} size={16} />
                {boardLabel(b.game, b.variant)}
              </button>
            );
          })}
        </div>

        <div className="lb-layout">
          <section className="card lb-card">
            <div className="card-title">
              <h2>Global top 25</h2>
              <span className="spacer" />
              <Link to={GAMES[game].path} className="btn btn-sm btn-primary">
                <Icon name="play" size={13} /> Play
              </Link>
            </div>

            {backend.online === false && (
              <div className="alert alert-info lb-offline">
                <Icon name="offline" size={16} /> The leaderboard server isn’t running, so global rankings are unavailable. Your own
                runs are still saved on this device. See them on the right.
              </div>
            )}
            {backend.online === true && state.status === 'loading' && (
              <div className="empty">
                <span className="spinner" />
              </div>
            )}
            {state.status === 'error' && <div className="alert alert-error">{state.message}</div>}
            {state.status === 'ready' && state.rows.length === 0 && (
              <div className="empty">
                No scores yet. <Link to={GAMES[game].path}>Be the first.</Link>
              </div>
            )}
            {state.status === 'ready' && state.rows.length > 0 && (
              <div className="table-scroll">
                <table className="table lb-table">
                  <thead>
                    <tr>
                      <th style={{ width: 64 }}>Rank</th>
                      <th>Player</th>
                      <th className="num">Score</th>
                      <th className="num lb-hide-sm">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.map((row) => {
                      const mine = user && row.userId === user.id;
                      return (
                        <tr key={row.userId} className={mine ? 'is-me' : ''}>
                          <td>
                            <span className={`lb-rank rank-${row.rank}`}>{row.rank}</span>
                          </td>
                          <td>
                            <div className="lb-player">
                              <span className="lb-avatar">
                                {row.profilePicture ? <img src={row.profilePicture} alt="" /> : row.username?.[0]?.toUpperCase()}
                              </span>
                              {row.username}
                              {mine && <span className="badge badge-accent">You</span>}
                            </div>
                          </td>
                          <td className="num">
                            <b>{formatScore(game, row.score)}</b>
                          </td>
                          <td className="num muted lb-hide-sm">{timeAgo(row.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="card lb-card">
            <div className="card-title">
              <h2>Your best runs</h2>
            </div>
            {localTop.length === 0 ? (
              <div className="empty">
                No runs yet.
                <br />
                <Link to={GAMES[game].path} className="btn btn-sm" style={{ marginTop: 12 }}>
                  Play {GAMES[game].name}
                </Link>
              </div>
            ) : (
              <ol className="lb-local">
                {localTop.map((run, i) => (
                  <li key={run.id}>
                    <span className="lb-local-i mono">{i + 1}</span>
                    <b className="mono">{formatScore(game, run.score)}</b>
                    <span className="muted">{timeAgo(run.at)}</span>
                  </li>
                ))}
              </ol>
            )}
            {!user && backend.online && (
              <p className="lb-note">
                <Link to="/register">Create an account</Link> to put your scores on the global board.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
