import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArenaEngine } from '../games/arena/ArenaEngine';
import { ARENA_MODES, GAMES, formatScore, isBetter } from '../lib/games';
import { useHistory } from '../lib/stats';
import { useSettings } from '../contexts/SettingsContext';
import { useRunRecorder } from '../hooks/useRunRecorder';
import Crosshair from '../components/Crosshair';
import Chart from '../components/Chart';
import Icon, { GAME_ICONS } from '../components/Icon';
import RunStatus from '../components/RunStatus';
import SensitivityFields from '../components/SensitivityFields';
import './ArenaPage.css';

const INITIAL_HUD = { score: 0, timeLeft: 0, progress: 0, countdown: 0, hits: 0, shots: 0, accuracy: 100, streak: 0, onTargetPct: 0, onTarget: false };

export default function ArenaPage() {
  const { mode } = useParams();
  if (!ARENA_MODES.includes(mode)) return <Navigate to="/play/gridshot" replace />;
  // Keyed so switching modes builds a fresh engine.
  return <Arena key={mode} mode={mode} />;
}

function formatTime(sec) {
  const s = Math.ceil(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Keys aimed at a form field or a focused button/link should keep their native behaviour. */
function isTyping(e) {
  const tag = e.target?.tagName;
  return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY';
}

function Arena({ mode }) {
  const game = GAMES[mode];
  const { settings } = useSettings();
  const stageRef = useRef(null);
  const canvasHostRef = useRef(null);
  const engineRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [state, setState] = useState('idle');
  const [hud, setHud] = useState(INITIAL_HUD);
  const [result, setResult] = useState(null);
  const [cursor, setCursor] = useState(
    () => settings.inputMode === 'cursor' || (window.matchMedia?.('(pointer: coarse)').matches ?? false),
  );
  const [notice, setNotice] = useState(null);
  const [hitFx, setHitFx] = useState({ key: 0, points: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [webglError, setWebglError] = useState(null);
  const [perf, setPerf] = useState(null);

  const recorder = useRunRecorder();
  const recordRef = useRef(recorder.record);
  recordRef.current = recorder.record;
  const resetRef = useRef(recorder.reset);
  resetRef.current = recorder.reset;

  const history = useHistory();
  const runs = useMemo(() => history.filter((r) => r.game === mode), [history, mode]);
  const best = useMemo(() => runs.reduce((b, r) => (isBetter(mode, r.score, b?.score) ? r : b), null), [runs, mode]);

  const onEvent = useCallback(
    (e) => {
      switch (e.type) {
        case 'state':
          setState(e.state);
          if (e.state === 'countdown' || e.state === 'idle') {
            setResult(null);
            resetRef.current();
          }
          break;
        case 'end':
          setResult(e.result);
          recordRef.current({
            game: mode,
            score: e.result.score,
            data: { ...e.result.data, timeline: e.result.timeline },
          });
          break;
        case 'hit':
          setHitFx((fx) => ({ key: fx.key + 1, points: e.points }));
          break;
        case 'input':
          setCursor(e.cursor);
          break;
        case 'perf':
          setPerf({ fps: e.fps, frameMs: e.frameMs });
          break;
        case 'lockError':
          setNotice(e.message);
          break;
        default:
      }
    },
    [mode],
  );

  useEffect(() => {
    let engine;
    try {
      engine = new ArenaEngine(canvasHostRef.current, { mode, settings: settingsRef.current, onHud: setHud, onEvent });
    } catch (err) {
      setWebglError(err.message || 'WebGL could not be initialised.');
      return undefined;
    }
    engineRef.current = engine;
    if (import.meta.env.DEV) window.__arena = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [mode, onEvent]);

  useEffect(() => {
    engineRef.current?.applySettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const start = useCallback(() => engineRef.current?.begin(), []);
  const resume = useCallback(() => engineRef.current?.resume(), []);
  const restart = useCallback(() => engineRef.current?.restart(), []);
  const quit = useCallback(() => engineRef.current?.quit(), []);

  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e) || e.repeat) return;
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      if (state === 'idle' || state === 'ended') {
        e.preventDefault();
        start();
      } else if (state === 'paused') {
        e.preventDefault();
        resume();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, start, resume]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stageRef.current?.requestFullscreen?.().catch(() => {});
  };

  const active = state === 'countdown' || state === 'playing';
  const showHud = active || state === 'paused';

  return (
    <div className={`arena ${fullscreen ? 'is-fullscreen' : ''} ${cursor ? 'is-cursor' : ''}`} ref={stageRef}>
      <div className="arena-canvas-host" ref={canvasHostRef} />

      {webglError && (
        <div className="arena-overlay">
          <div className="arena-panel panel-glass arena-center">
            <h2>3D isn’t available</h2>
            <p className="muted">{webglError} Try a browser with WebGL enabled, or play the Reaction and CPS tests.</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
              <Link className="btn" to="/reaction">
                Reaction test
              </Link>
              <Link className="btn" to="/cps">
                CPS test
              </Link>
            </div>
          </div>
        </div>
      )}

      {showHud && <Hud game={game} hud={hud} />}

      {active && !cursor && (
        <div className="arena-reticle">
          <Crosshair config={settings.crosshair} />
          {hitFx.key > 0 && <span key={hitFx.key} className="hitmarker" />}
        </div>
      )}
      {active && hitFx.key > 0 && game.id !== 'tracking' && (
        <span key={`p${hitFx.key}`} className="hit-points">
          +{hitFx.points}
        </span>
      )}

      {notice && state !== 'paused' && <div className="arena-toast fade-up">{notice}</div>}

      {settings.showFps && perf && (
        <div className="fps-counter mono" aria-hidden="true">
          <b>{perf.fps}</b> FPS <span>{perf.frameMs} ms</span>
        </div>
      )}

      {state === 'countdown' && hud.countdown > 0 && (
        <div className="arena-countdown" key={hud.countdown}>
          {hud.countdown}
        </div>
      )}

      {state === 'idle' && !webglError && (
        <div className="arena-overlay arena-overlay-menu">
          <div className="arena-panel panel-glass arena-menu fade-up">
            <ModeTabs current={mode} />
            <div className="eyebrow">
              <Icon name={GAME_ICONS[mode]} size={14} /> {game.skill}
            </div>
            <h1 className="arena-title">{game.name}</h1>
            <p className="arena-tagline">{game.description}</p>

            <div className="arena-facts">
              <div>
                <span className="label">Duration</span>
                <b className="mono">{game.duration}s</b>
              </div>
              <div>
                <span className="label">Personal best</span>
                <b className="mono">{best ? formatScore(mode, best.score) : '—'}</b>
              </div>
              <div>
                <span className="label">Runs</span>
                <b className="mono">{runs.length}</b>
              </div>
            </div>

            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={start}>
              <Icon name="play" size={16} /> Start {game.name}
            </button>
            <p className="arena-hint">
              Press <span className="kbd">Space</span> to start · <span className="kbd">Esc</span> pause · <span className="kbd">R</span> restart
            </p>

            <details className="arena-quick">
              <summary>
                <Icon name="settings" size={15} /> Sensitivity & FOV
              </summary>
              <SensitivityFields compact />
              <Link to="/settings" className="arena-quick-link">
                Crosshair, audio & graphics <Icon name="arrowRight" size={14} />
              </Link>
            </details>
          </div>
          <button type="button" className="btn btn-ghost arena-fs" onClick={toggleFullscreen} title="Fullscreen">
            <Icon name="fullscreen" />
          </button>
        </div>
      )}

      {state === 'paused' && (
        <div className="arena-overlay">
          <div className="arena-panel panel-glass arena-center fade-up">
            <div className="eyebrow">
              <Icon name="pause" size={14} /> Paused
            </div>
            <h2 className="arena-paused-title">{formatTime(hud.timeLeft)} left</h2>
            {notice && <div className="alert alert-info">{notice}</div>}
            <div className="arena-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={resume}>
                <Icon name="play" size={15} /> Resume
              </button>
              <button type="button" className="btn btn-lg" onClick={restart}>
                <Icon name="refresh" size={15} /> Restart
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={quit}>
                Quit
              </button>
            </div>
            <div className="arena-pause-settings">
              <SensitivityFields compact />
            </div>
          </div>
        </div>
      )}

      {state === 'ended' && result && (
        <Results
          game={game}
          result={result}
          local={recorder.local}
          remote={recorder.remote}
          onAgain={start}
          onMenu={quit}
        />
      )}
    </div>
  );
}

function ModeTabs({ current }) {
  return (
    <div className="segmented arena-tabs">
      {ARENA_MODES.map((id) => (
        <Link key={id} to={GAMES[id].path} replace aria-current={id === current ? 'page' : undefined}>
          {GAMES[id].name}
        </Link>
      ))}
    </div>
  );
}

function Hud({ game, hud }) {
  const tracking = game.id === 'tracking';
  const multiplier = game.id === 'gridshot' ? 1 + 0.05 * Math.min(Math.max(hud.streak - 1, 0), 20) : null;
  return (
    <div className="hud">
      <div className="hud-left">
        <span className="hud-label">Score</span>
        <span className="hud-score">{hud.score.toLocaleString()}</span>
        {multiplier != null && hud.streak > 1 && <span className="hud-mult">×{multiplier.toFixed(2)}</span>}
      </div>
      <div className="hud-center">
        <span className={`hud-time ${hud.timeLeft <= 5 && hud.progress > 0 ? 'is-low' : ''}`}>{formatTime(hud.timeLeft || game.duration)}</span>
        <div className="hud-bar">
          <span style={{ transform: `scaleX(${1 - hud.progress})` }} />
        </div>
      </div>
      <div className="hud-right">
        {tracking ? (
          <>
            <span className="hud-label">On target</span>
            <span className={`hud-stat ${hud.onTarget ? 'is-on' : ''}`}>{hud.onTargetPct.toFixed(1)}%</span>
          </>
        ) : (
          <>
            <span className="hud-label">Accuracy</span>
            <span className="hud-stat">{hud.accuracy.toFixed(1)}%</span>
            <span className="hud-sub">
              {hud.hits} hits · streak {hud.streak}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Results({ game, result, local, remote, onAgain, onMenu }) {
  const d = result.data;
  const tracking = game.id === 'tracking';
  const prev = local?.previousBest;
  const isPB = local?.isPersonalBest && prev != null;
  const delta = prev != null ? result.score - prev : null;

  return (
    <div className="arena-overlay">
      <div className="arena-panel panel-glass arena-results fade-up">
        <div className="results-head">
          <div>
            <div className="eyebrow">
              <Icon name={GAME_ICONS[game.id]} size={14} /> {game.name} · results
            </div>
            <div className="results-score">
              <span className="mono">{result.score.toLocaleString()}</span>
              <small>pts</small>
            </div>
            {isPB ? (
              <span className="badge badge-good">
                <Icon name="trophy" size={13} /> New personal best · +{delta.toLocaleString()}
              </span>
            ) : prev == null ? (
              <span className="badge badge-accent">First run recorded</span>
            ) : (
              <span className="badge">
                PB {prev.toLocaleString()} · {delta >= 0 ? '+' : ''}
                {delta.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="stat-grid">
          {tracking ? (
            <>
              <Stat label="On target" value={`${d.onTargetPct}`} unit="%" />
              <Stat label="Longest track" value={(d.longestTrackMs / 1000).toFixed(2)} unit="s" />
              <Stat label="Duration" value={d.duration} unit="s" />
            </>
          ) : (
            <>
              <Stat label="Accuracy" value={d.accuracy} unit="%" />
              <Stat label="Hits" value={d.hits} unit={`/ ${d.shots}`} />
              <Stat label="Kills / sec" value={d.kps.toFixed(2)} />
              <Stat label={game.id === 'spidershot' ? 'Avg time to kill' : 'Avg kill interval'} value={d.avgKillMs} unit="ms" />
              <Stat label="Best streak" value={d.bestStreak} />
            </>
          )}
        </div>

        <div className="results-chart">
          <div className="row">
            <span className="label">{tracking ? 'On target % per second' : 'Kills per second'}</span>
          </div>
          <Chart
            values={result.timeline}
            height={150}
            type={tracking ? 'area' : 'bar'}
            yMax={tracking ? 100 : undefined}
            formatX={(i) => `${i + 1}s`}
            formatY={(v) => (tracking ? `${Math.round(v)}%` : String(Math.round(v * 10) / 10))}
            reference={tracking ? d.onTargetPct : d.kps}
            referenceLabel="avg"
          />
        </div>

        <RunStatus remote={remote} />

        <div className="arena-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onAgain}>
            <Icon name="refresh" size={15} /> Play again
          </button>
          <button type="button" className="btn btn-lg" onClick={onMenu}>
            Change mode
          </button>
          <Link to="/leaderboards" className="btn btn-ghost btn-lg">
            <Icon name="trophy" size={15} /> Leaderboards
          </Link>
        </div>
        <p className="arena-hint">
          <span className="kbd">Space</span> to play again
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
    </div>
  );
}
