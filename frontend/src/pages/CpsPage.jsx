import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GAMES, formatScore, isBetter } from '../lib/games';
import { useHistory } from '../lib/stats';
import { useRunRecorder } from '../hooks/useRunRecorder';
import { sound } from '../lib/audio';
import { peakCps } from '../lib/metrics';
import Chart from '../components/Chart';
import Icon from '../components/Icon';
import RunStatus from '../components/RunStatus';
import './MiniGames.css';

const GAME = GAMES.cps;
const BUCKET = 0.5; // seconds per chart sample
const COOLDOWN = 900; // ms after the end before the pad accepts a new start (avoids accidental restarts)

function tier(cps) {
  if (cps < 4) return 'Sloth';
  if (cps < 6) return 'Casual';
  if (cps < 8) return 'Quick';
  if (cps < 10) return 'Fast';
  if (cps < 12) return 'Jitter clicker';
  if (cps < 15) return 'Butterfly';
  return 'Are you a robot?';
}

export default function CpsPage() {
  const [variant, setVariant] = useState(GAME.defaultVariant);
  const duration = parseInt(variant, 10);
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [live, setLive] = useState({ clicks: 0, timeLeft: duration, cps: 0 });
  const [result, setResult] = useState(null);
  const [ripples, setRipples] = useState([]);
  const clicksRef = useRef([]);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const endedAtRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const rippleId = useRef(0);
  const { record, reset, local, remote } = useRunRecorder();

  const history = useHistory();
  const runs = useMemo(() => history.filter((r) => r.game === 'cps' && r.variant === variant), [history, variant]);
  const best = useMemo(() => runs.reduce((b, r) => (isBetter('cps', r.score, b) ? r.score : b), null), [runs]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    if (phaseRef.current !== 'running') setLive({ clicks: 0, timeLeft: duration, cps: 0 });
  }, [duration]);

  const finish = useCallback(() => {
    const total = duration * 1000;
    const times = clicksRef.current.filter((t) => t <= total);
    const clicks = times.length;
    const avg = Math.round((clicks / duration) * 100) / 100;
    const buckets = new Array(Math.round(duration / BUCKET)).fill(0);
    for (const t of times) buckets[Math.min(buckets.length - 1, Math.floor(t / 1000 / BUCKET))] += 1 / BUCKET;
    const intervals = times.slice(1).map((t, i) => t - times[i]);
    const avgInterval = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    const res = { clicks, avg, peak: peakCps(times), series: buckets, avgInterval: Math.round(avgInterval) };
    endedAtRef.current = performance.now();
    phaseRef.current = 'done';
    setResult(res);
    setPhase('done');
    setLive((l) => ({ ...l, timeLeft: 0 }));
    record({ game: 'cps', variant, score: avg, data: { clicks, peak: res.peak, duration, series: buckets } });
  }, [duration, variant, record]);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startRef.current;
    if (elapsed >= duration * 1000) {
      finish();
      return;
    }
    const times = clicksRef.current;
    let recent = 0;
    for (let i = times.length - 1; i >= 0 && elapsed - times[i] <= 1000; i--) recent++;
    setLive({ clicks: times.length, timeLeft: duration - elapsed / 1000, cps: elapsed < 1000 ? times.length / Math.max(elapsed / 1000, 0.25) : recent });
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, finish]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++rippleId.current;
    setRipples((r) => [...r.slice(-24), { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);

    if (phaseRef.current === 'done') {
      if (performance.now() - endedAtRef.current < COOLDOWN) return;
      start(e);
      return;
    }
    if (phaseRef.current === 'idle') {
      start(e);
      return;
    }
    clicksRef.current.push(e.timeStamp - startRef.current);
  };

  const start = (e) => {
    sound.unlock();
    reset();
    setResult(null);
    startRef.current = e.timeStamp;
    clicksRef.current = [0];
    phaseRef.current = 'running';
    setPhase('running');
    rafRef.current = requestAnimationFrame(tick);
  };

  const changeVariant = (v) => {
    if (phase === 'running') return;
    setVariant(v);
    setPhase('idle');
    setResult(null);
    reset();
  };

  const recent = runs.slice(0, 20).reverse();

  return (
    <main className="page">
      <div className="container">
        <header className="page-header mini-header">
          <div>
            <div className="eyebrow">
              <Icon name="mouse" size={14} /> {GAME.skill}
            </div>
            <h1>CPS Test</h1>
            <p>{GAME.description}</p>
          </div>
          <div className="mini-pb">
            <span className="label">Best · {variant}</span>
            <b className="mono">{best != null ? formatScore('cps', best) : '—'}</b>
          </div>
        </header>

        <div className="row wrap" style={{ marginBottom: 16 }}>
          <div className="segmented" role="group" aria-label="Test length">
            {GAME.variants.map((v) => (
              <button key={v} type="button" aria-pressed={v === variant} onClick={() => changeVariant(v)} disabled={phase === 'running'}>
                {v} test
              </button>
            ))}
          </div>
        </div>

        <div
          className="mini-pad cps-pad"
          data-phase={phase}
          onPointerDown={onPointerDown}
          onContextMenu={(e) => e.preventDefault()}
          role="button"
          tabIndex={0}
        >
          {ripples.map((r) => (
            <span
              key={r.id}
              className="ripple"
              style={{ left: r.x, top: r.y }}
              onAnimationEnd={() => setRipples((list) => list.filter((x) => x.id !== r.id))}
            />
          ))}

          {phase === 'idle' && (
            <>
              <Icon name="mouse" size={44} className="mini-icon" />
              <div className="mini-title">Click to start</div>
              <div className="mini-sub">The {duration}-second timer begins on your first click.</div>
            </>
          )}
          {phase === 'running' && (
            <>
              <div className="mini-big mono">
                {live.cps.toFixed(1)}
                <small>CPS</small>
              </div>
              <div className="cps-live">
                <span>
                  <b className="mono">{live.clicks}</b> clicks
                </span>
                <span>
                  <b className="mono">{live.timeLeft.toFixed(1)}</b>s left
                </span>
              </div>
              <div className="cps-bar">
                <span style={{ transform: `scaleX(${live.timeLeft / duration})` }} />
              </div>
            </>
          )}
          {phase === 'done' && result && (
            <>
              <div className="mini-big mono">
                {result.avg.toFixed(2)}
                <small>CPS</small>
              </div>
              <div className="mini-sub">Click to go again</div>
            </>
          )}
        </div>

        {phase === 'done' && result && (
          <section className="card mini-results fade-up">
            <div className="mini-results-head">
              <div>
                <span className="label">{duration}s average</span>
                <div className="results-big mono">
                  {result.avg.toFixed(2)}
                  <small>CPS</small>
                </div>
                <div className="row wrap">
                  <span className="badge badge-accent">{tier(result.avg)}</span>
                  {local?.isPersonalBest && local.previousBest != null && (
                    <span className="badge badge-good">
                      <Icon name="trophy" size={13} /> New personal best
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-label">Total clicks</div>
                <div className="stat-value">{result.clicks}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Peak (1s window)</div>
                <div className="stat-value">
                  {result.peak}
                  <small>CPS</small>
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Avg interval</div>
                <div className="stat-value">
                  {result.avgInterval}
                  <small>ms</small>
                </div>
              </div>
            </div>
            <div>
              <span className="label">Clicks per second over time</span>
              <Chart
                values={result.series}
                height={160}
                formatX={(i) => `${((i + 1) * BUCKET).toFixed(1)}s`}
                formatY={(v) => v.toFixed(0)}
                reference={result.avg}
                referenceLabel="avg"
              />
            </div>
            <RunStatus remote={remote} />
          </section>
        )}

        {recent.length >= 2 && (
          <section className="card mini-progress">
            <div className="card-title">
              <Icon name="chart" />
              <h2>Your last {recent.length} {variant} tests</h2>
            </div>
            <Chart values={recent.map((r) => r.score)} height={160} formatY={(v) => v.toFixed(1)} xLabel="Run" />
          </section>
        )}
      </div>
    </main>
  );
}
