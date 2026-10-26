import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GAMES, formatScore, isBetter } from '../lib/games';
import { useHistory } from '../lib/stats';
import { useRunRecorder } from '../hooks/useRunRecorder';
import { sound } from '../lib/audio';
import { percentSlowerThan, stdDev } from '../lib/metrics';
import Chart from '../components/Chart';
import Icon from '../components/Icon';
import RunStatus from '../components/RunStatus';
import './MiniGames.css';

const GAME = GAMES.reaction;
const ATTEMPTS = GAME.attempts;
const MIN_DELAY = 1500;
const MAX_DELAY = 4500;

function tier(ms) {
  if (ms < 180) return 'Superhuman';
  if (ms < 215) return 'Pro reflexes';
  if (ms < 250) return 'Sharp';
  if (ms < 290) return 'Average human';
  return 'Warming up';
}

const PROMPTS = {
  idle: { title: 'Click to start', sub: `Wait for green, then click as fast as you can. ${ATTEMPTS} attempts.` },
  waiting: { title: 'Wait for green…', sub: 'Don’t click yet.' },
  go: { title: 'CLICK!', sub: '' },
  early: { title: 'Too soon!', sub: 'You clicked before green. Click to retry this attempt.' },
};

export default function ReactionPage() {
  const [phase, setPhase] = useState('idle');
  const [attempts, setAttempts] = useState([]);
  const [last, setLast] = useState(null);
  const padRef = useRef(null);
  const timerRef = useRef(null);
  const goAtRef = useRef(0);
  const phaseRef = useRef('idle');
  phaseRef.current = phase;
  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;
  const { record, reset, local, remote } = useRunRecorder();

  const history = useHistory();
  const runs = useMemo(() => history.filter((r) => r.game === 'reaction'), [history]);
  const best = useMemo(() => runs.reduce((b, r) => (isBetter('reaction', r.score, b) ? r.score : b), null), [runs]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const arm = useCallback(() => {
    phaseRef.current = 'waiting';
    setPhase('waiting');
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timerRef.current = setTimeout(() => {
      // Flip the colour directly and timestamp in the same frame, so React render time isn't measured.
      requestAnimationFrame(() => {
        if (padRef.current) padRef.current.dataset.phase = 'go';
        goAtRef.current = performance.now();
        setPhase('go');
      });
    }, delay);
  }, []);

  const press = useCallback(
    (eventTime) => {
      const current = phaseRef.current;
      sound.unlock();
      if (current === 'idle' || current === 'result' || current === 'early') {
        if (current === 'idle') reset();
        arm();
      } else if (current === 'waiting') {
        clearTimeout(timerRef.current);
        sound.beep(220, 0.15, { type: 'square', gain: 0.08 });
        phaseRef.current = 'early';
        setPhase('early');
      } else if (current === 'go') {
        const at = eventTime && eventTime >= goAtRef.current ? eventTime : performance.now();
        const ms = Math.max(1, Math.round(at - goAtRef.current));
        sound.beep(1200, 0.06, { gain: 0.15 });
        const next = [...attemptsRef.current, ms];
        attemptsRef.current = next;
        phaseRef.current = next.length >= ATTEMPTS ? 'done' : 'result';
        setLast(ms);
        setAttempts(next);
        setPhase(phaseRef.current);
        if (next.length >= ATTEMPTS) {
          const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
          record({ game: 'reaction', score: avg, data: { attempts: next, best: Math.min(...next) } });
        }
      }
    },
    [arm, record, reset],
  );

  const restart = () => {
    clearTimeout(timerRef.current);
    setAttempts([]);
    setLast(null);
    reset();
    setPhase('idle');
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' || e.repeat || e.target.tagName === 'INPUT') return;
      e.preventDefault();
      if (phaseRef.current === 'done') return;
      press(e.timeStamp);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  const avg = attempts.length ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) : null;
  const done = phase === 'done';

  return (
    <main className="page">
      <div className="container">
        <header className="page-header mini-header">
          <div>
            <div className="eyebrow">
              <Icon name="bolt" size={14} /> {GAME.skill}
            </div>
            <h1>Reaction Time</h1>
            <p>{GAME.description}</p>
          </div>
          <div className="mini-pb">
            <span className="label">Personal best</span>
            <b className="mono">{best != null ? formatScore('reaction', best) : '—'}</b>
          </div>
        </header>

        {!done ? (
          <div
            ref={padRef}
            className="mini-pad reaction-pad"
            data-phase={phase}
            role="button"
            tabIndex={0}
            onPointerDown={(e) => {
              if (e.button === 0) press(e.timeStamp);
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {phase === 'result' ? (
              <>
                <div className="mini-big mono">
                  {last}
                  <small>ms</small>
                </div>
                <div className="mini-sub">
                  Attempt {attempts.length} of {ATTEMPTS} · click to continue
                </div>
              </>
            ) : (
              <>
                {phase === 'idle' && <Icon name="bolt" size={44} className="mini-icon" />}
                <div className="mini-title">{PROMPTS[phase].title}</div>
                {PROMPTS[phase].sub && <div className="mini-sub">{PROMPTS[phase].sub}</div>}
              </>
            )}
            <div className="attempt-dots">
              {Array.from({ length: ATTEMPTS }, (_, i) => (
                <span key={i} className={attempts[i] ? 'is-done' : i === attempts.length ? 'is-current' : ''}>
                  {attempts[i] ? attempts[i] : i + 1}
                </span>
              ))}
            </div>
            <div className="mini-kbd">
              or press <span className="kbd">Space</span>
            </div>
          </div>
        ) : (
          <section className="card mini-results fade-up">
            <div className="mini-results-head">
              <div>
                <span className="label">Average of {ATTEMPTS}</span>
                <div className="results-big mono">
                  {avg}
                  <small>ms</small>
                </div>
                <div className="row wrap">
                  <span className="badge badge-accent">{tier(avg)}</span>
                  {local?.isPersonalBest && local.previousBest != null && (
                    <span className="badge badge-good">
                      <Icon name="trophy" size={13} /> New personal best
                    </span>
                  )}
                  <span className="muted" style={{ fontSize: 13 }}>
                    Faster than ~{percentSlowerThan(avg)}% of people
                  </span>
                </div>
              </div>
              <div className="mini-results-actions">
                <button type="button" className="btn btn-primary btn-lg" onClick={restart}>
                  <Icon name="refresh" size={15} /> Try again
                </button>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-label">Best</div>
                <div className="stat-value">
                  {Math.min(...attempts)}
                  <small>ms</small>
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Worst</div>
                <div className="stat-value">
                  {Math.max(...attempts)}
                  <small>ms</small>
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Spread</div>
                <div className="stat-value">
                  ±{Math.round(stdDev(attempts))}
                  <small>ms</small>
                </div>
              </div>
            </div>
            <Chart
              values={attempts}
              type="bar"
              height={170}
              formatX={(i) => `#${i + 1}`}
              formatY={(v) => `${Math.round(v)}`}
              reference={avg}
              referenceLabel={`avg ${avg}ms`}
              highlight={(v) => (v === Math.min(...attempts) ? 'var(--good)' : 'var(--accent)')}
            />
            <RunStatus remote={remote} />
          </section>
        )}

        <ProgressCard runs={runs} />
      </div>
    </main>
  );
}

function ProgressCard({ runs }) {
  const recent = runs.slice(0, 20).reverse();
  if (recent.length < 2) return null;
  return (
    <section className="card mini-progress">
      <div className="card-title">
        <Icon name="chart" />
        <h2>Your last {recent.length} sessions</h2>
      </div>
      <Chart values={recent.map((r) => r.score)} height={160} formatY={(v) => `${Math.round(v)}ms`} formatX={(i) => `${i + 1}`} xLabel="Run" />
    </section>
  );
}
