import { lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GAMES, GAME_ORDER, formatScore, isBetter } from '../lib/games';
import { useHistory } from '../lib/stats';
import { useSettings } from '../contexts/SettingsContext';
import { cmPer360, SENS_PROFILES } from '../lib/sensitivity';
import Icon, { GAME_ICONS } from '../components/Icon';
import Crosshair from '../components/Crosshair';
import './Home.css';

// three.js loads after first paint so the landing page stays fast.
const HeroScene = lazy(() => import('../components/HeroScene'));

const FEATURES = [
  {
    icon: 'crosshair',
    title: 'Your real sensitivity',
    body: 'Enter your Valorant, CS2, Overwatch or Fortnite sens and DPI. Yaw is matched exactly, so practice transfers 1:1 to your game.',
  },
  {
    icon: 'mouse',
    title: 'Raw mouse input',
    body: 'Pointer lock with unadjusted movement skips OS acceleration. A first-person viewmodel, recoil and hit feedback make it feel like a real shooter.',
  },
  {
    icon: 'chart',
    title: 'Analytics after every run',
    body: 'Per-second performance charts, accuracy, kill timing and streaks, plus a history of every session so you can see yourself improve.',
  },
  {
    icon: 'trophy',
    title: 'Global leaderboards',
    body: 'Sign in to post scores to the Express + MongoDB backend. No account? Everything still works offline and is saved on your device.',
  },
];

export default function Home() {
  const history = useHistory();
  const { settings } = useSettings();

  const bests = useMemo(() => {
    const out = {};
    for (const run of history) {
      const key = run.game === 'cps' ? `cps:${run.variant}` : run.game;
      if (isBetter(run.game, run.score, out[key]?.score)) out[key] = run;
    }
    return out;
  }, [history]);

  const totalSeconds = useMemo(
    () =>
      history.reduce((sum, r) => {
        if (r.data?.duration) return sum + r.data.duration;
        if (r.game === 'reaction') return sum + 15;
        return sum;
      }, 0),
    [history],
  );

  const arena = GAME_ORDER.filter((id) => GAMES[id].kind === 'arena');
  const quick = GAME_ORDER.filter((id) => GAMES[id].kind !== 'arena');

  return (
    <main className="home">
      <section className="hero">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
        <div className="hero-fade" />
        <div className="container hero-inner">
          <div className="hero-copy fade-up">
            <div className="eyebrow">
              <span className="hero-live" /> Browser FPS aim trainer
            </div>
            <h1>
              Train your aim.
              <br />
              <span>Win more duels.</span>
            </h1>
            <p>
              A 3D first-person arena with real sensitivity matching, raw mouse input and per-second analytics. Plus reaction and
              CPS tests. Free, instant, no download.
            </p>
            <div className="hero-cta">
              <Link to="/play/gridshot" className="btn btn-primary btn-lg">
                <Icon name="play" size={16} /> Play Gridshot
              </Link>
              <Link to="/reaction" className="btn btn-lg">
                Test your reaction time
              </Link>
            </div>
            <div className="hero-meta">
              <span>
                <Icon name="target" size={15} /> 3 arena modes
              </span>
              <span>
                <Icon name="crosshair" size={15} /> {SENS_PROFILES[settings.sensGame].label} sens {settings.sens} ·{' '}
                {cmPer360(settings.sensGame, settings.sens, settings.dpi).toFixed(1)} cm/360
              </span>
              <span>
                <Icon name="bolt" size={15} /> Works offline
              </span>
            </div>
          </div>
          <div className="hero-reticle" aria-hidden="true">
            <Crosshair config={{ ...settings.crosshair, length: 14, gap: 8, thickness: 3 }} />
          </div>
        </div>
      </section>

      <section className="container home-section">
        <div className="section-head">
          <div className="eyebrow">Game modes</div>
          <h2>Pick a drill</h2>
        </div>

        <div className="mode-grid">
          {arena.map((id, i) => (
            <ModeCard key={id} id={id} best={bests[id]} featured={i === 0} />
          ))}
        </div>
        <div className="mode-grid mode-grid-quick">
          {quick.map((id) => (
            <ModeCard key={id} id={id} best={id === 'cps' ? bests['cps:5s'] : bests[id]} />
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="container home-section">
          <div className="progress-strip card">
            <div>
              <span className="label">Sessions played</span>
              <b className="mono">{history.length}</b>
            </div>
            <div>
              <span className="label">Time trained</span>
              <b className="mono">{Math.round(totalSeconds / 60)} min</b>
            </div>
            <div>
              <span className="label">Gridshot best</span>
              <b className="mono">{formatScore('gridshot', bests.gridshot?.score)}</b>
            </div>
            <div>
              <span className="label">Reaction best</span>
              <b className="mono">{formatScore('reaction', bests.reaction?.score)}</b>
            </div>
            <Link to="/profile" className="btn">
              View all stats <Icon name="arrowRight" size={15} />
            </Link>
          </div>
        </section>
      )}

      <section className="container home-section">
        <div className="section-head">
          <div className="eyebrow">Built like a real trainer</div>
          <h2>Practice that transfers to your game</h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature card">
              <span className="feature-icon">
                <Icon name={f.icon} size={20} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container home-section">
        <div className="cta-band">
          <div>
            <h2>Sixty seconds. Three targets.</h2>
            <p>Gridshot is the standard warm-up. Set your sens, then see where you stand.</p>
          </div>
          <div className="row wrap">
            <Link to="/settings" className="btn btn-lg">
              <Icon name="settings" size={16} /> Set up sensitivity
            </Link>
            <Link to="/play/gridshot" className="btn btn-primary btn-lg">
              <Icon name="play" size={16} /> Start training
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ModeCard({ id, best, featured }) {
  const g = GAMES[id];
  return (
    <Link to={g.path} className={`mode-card ${featured ? 'is-featured' : ''} mode-${id}`}>
      <div className="mode-art" aria-hidden="true">
        <ModeArt id={id} />
      </div>
      <div className="mode-body">
        <div className="row">
          <span className="mode-icon">
            <Icon name={GAME_ICONS[id]} size={18} />
          </span>
          {g.kind === 'arena' && <span className="badge badge-accent">3D</span>}
          <span className="spacer" />
          <span className="mode-skill">{g.skill}</span>
        </div>
        <h3>{g.name}</h3>
        <p>{g.tagline}</p>
        <div className="mode-foot">
          <span className="muted">
            Best: <b className="mono">{best ? formatScore(id, best.score) : '—'}</b>
          </span>
          <span className="mode-play">
            Play <Icon name="arrowRight" size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Small schematic illustration of each mode, drawn in SVG. */
function ModeArt({ id }) {
  switch (id) {
    case 'gridshot':
      return (
        <svg viewBox="0 0 200 110">
          {[0, 1, 2, 3, 4].map((c) =>
            [0, 1, 2].map((r) => <circle key={`${c}${r}`} cx={40 + c * 30} cy={25 + r * 30} r="3" className="art-dot" />),
          )}
          <circle cx="70" cy="25" r="11" className="art-target" />
          <circle cx="130" cy="55" r="11" className="art-target" />
          <circle cx="100" cy="85" r="11" className="art-target" />
        </svg>
      );
    case 'spidershot':
      return (
        <svg viewBox="0 0 200 110">
          <path d="M100 58 L34 30 M100 58 L172 40 M100 58 L150 92" className="art-line" />
          <circle cx="100" cy="58" r="10" className="art-target" />
          <circle cx="34" cy="30" r="7" className="art-target art-faded" />
          <circle cx="172" cy="40" r="7" className="art-target" />
          <circle cx="150" cy="92" r="7" className="art-target art-faded" />
        </svg>
      );
    case 'tracking':
      return (
        <svg viewBox="0 0 200 110">
          <path d="M20 60 C 50 30, 70 85, 100 55 S 150 30, 180 58" className="art-line" />
          <circle cx="100" cy="55" r="12" className="art-target" />
          <path d="M100 41v-6M100 69v6M86 55h-6M114 55h6" className="art-cross" />
        </svg>
      );
    case 'reaction':
      return (
        <svg viewBox="0 0 200 110">
          <rect x="30" y="30" width="60" height="50" rx="8" className="art-red" />
          <path d="M98 55h12M104 49l6 6-6 6" className="art-line" />
          <rect x="118" y="30" width="60" height="50" rx="8" className="art-green" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 110">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={30 + i * 18} y={85 - [20, 34, 46, 52, 58, 50, 56, 60][i]} width="11" height={[20, 34, 46, 52, 58, 50, 56, 60][i]} rx="3" className="art-bar" />
          ))}
        </svg>
      );
  }
}
