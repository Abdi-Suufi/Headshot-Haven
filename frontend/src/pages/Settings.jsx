import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_SETTINGS, useSettings } from '../contexts/SettingsContext';
import { sound } from '../lib/audio';
import { clearHistory, useHistory } from '../lib/stats';
import Crosshair from '../components/Crosshair';
import Icon from '../components/Icon';
import SensitivityFields from '../components/SensitivityFields';
import './Settings.css';

const CROSSHAIR_PRESETS = [
  { name: 'Default', config: DEFAULT_SETTINGS.crosshair },
  { name: 'Dot', config: { color: '#00ffff', length: 0, thickness: 4, gap: 0, dot: true, outline: true, lines: false } },
  { name: 'Small cross', config: { color: '#ffffff', length: 4, thickness: 2, gap: 2, dot: false, outline: true, lines: true } },
  { name: 'Classic', config: { color: '#ffff00', length: 8, thickness: 2, gap: 4, dot: false, outline: false, lines: true } },
  { name: 'Pink + dot', config: { color: '#ff4fd8', length: 5, thickness: 2, gap: 3, dot: true, outline: true, lines: true } },
];

const FPS_LIMITS = [0, 30, 60, 120, 144, 165, 240, 360];

// Present only inside the desktop app (exposed by electron/preload.cjs).
const desktop = typeof window !== 'undefined' ? window.headshotDesktop : undefined;

/** Desktop-only "unlock frame rate" switch. Turning VSync off needs an app restart. */
function useFrameRateUnlock() {
  const [state, setState] = useState({ unlocked: false, pending: false, loaded: false });
  useEffect(() => {
    if (!desktop) return;
    desktop.getFrameRateUnlocked().then(({ unlocked, active }) => setState({ unlocked, pending: unlocked !== active, loaded: true }));
  }, []);
  const set = async (unlocked) => {
    const { active } = await desktop.setFrameRateUnlocked(unlocked);
    setState({ unlocked, pending: unlocked !== active, loaded: true });
  };
  return [state, set];
}

const COLOR_SWATCHES = ['#3dffa2', '#00ffff', '#ffffff', '#ffff00', '#ff4fd8', '#ff4d5e'];
const TARGET_SWATCHES = ['#ff6b35', '#ff4d5e', '#3dffa2', '#5cc8ff', '#ffd166', '#c77dff'];

function Slider({ label, value, min, max, step = 1, onChange, suffix = 'px' }) {
  return (
    <div className="field">
      <div className="row">
        <span className="label">{label}</span>
        <span className="spacer" />
        <span className="mono" style={{ fontSize: 13 }}>
          {value}
          {suffix}
        </span>
      </div>
      <input className="range" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        {hint && <div className="toggle-hint">{hint}</div>}
      </div>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span />
      </span>
    </label>
  );
}

function Swatches({ colors, value, onChange, label }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="swatches">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch ${value.toLowerCase() === c ? 'is-active' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            aria-label={c}
          />
        ))}
        <label className="swatch swatch-custom" title="Custom colour">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
          <Icon name="settings" size={14} />
        </label>
      </div>
    </div>
  );
}

export default function Settings() {
  const { settings, update, reset } = useSettings();
  const ch = settings.crosshair;
  const setCh = (patch) => update({ crosshair: patch });
  const history = useHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const [unlock, setUnlock] = useFrameRateUnlock();

  return (
    <main className="page">
      <div className="container">
        <header className="page-header settings-header">
          <div>
            <div className="eyebrow">
              <Icon name="settings" size={14} /> Preferences
            </div>
            <h1>Settings</h1>
            <p>Saved on this device and applied instantly, including mid-game from the pause menu.</p>
          </div>
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Reset to defaults
            </button>
            <Link to="/play/gridshot" className="btn btn-primary">
              <Icon name="play" size={14} /> Test in Gridshot
            </Link>
          </div>
        </header>

        <div className="settings-grid">
          <section className="card settings-card">
            <div className="card-title">
              <Icon name="mouse" />
              <h2>Sensitivity & view</h2>
            </div>
            <p className="settings-help">
              Pick your main game and type in its sensitivity. Rotation per mouse count matches that game exactly, so muscle memory
              carries over. Equivalent values for other games are shown below.
            </p>
            <SensitivityFields />
            <div className="settings-toggles">
              <Toggle label="Invert vertical look" checked={settings.invertY} onChange={(invertY) => update({ invertY })} />
              <Toggle
                label="Cursor aim mode"
                hint="Aim with a free cursor instead of capturing the mouse. Useful on trackpads and touch screens."
                checked={settings.inputMode === 'cursor'}
                onChange={(on) => update({ inputMode: on ? 'cursor' : 'lock' })}
              />
            </div>
          </section>

          <section className="card settings-card">
            <div className="card-title">
              <Icon name="crosshair" />
              <h2>Crosshair</h2>
            </div>
            <div className="crosshair-preview">
              <div className="crosshair-preview-bg">
                <span className="preview-target" />
              </div>
              <Crosshair config={ch} scale={2} />
            </div>
            <div className="preset-row">
              {CROSSHAIR_PRESETS.map((p) => (
                <button key={p.name} type="button" className="preset" onClick={() => update({ crosshair: p.config })}>
                  <span className="preset-icon">
                    <Crosshair config={p.config} />
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
            <Swatches label="Colour" colors={COLOR_SWATCHES} value={ch.color} onChange={(color) => setCh({ color })} />
            <div className="settings-sliders">
              <Slider label="Length" value={ch.length} min={0} max={20} onChange={(length) => setCh({ length })} />
              <Slider label="Thickness" value={ch.thickness} min={1} max={8} onChange={(thickness) => setCh({ thickness })} />
              <Slider label="Gap" value={ch.gap} min={0} max={16} onChange={(gap) => setCh({ gap })} />
            </div>
            <div className="settings-toggles">
              <Toggle label="Lines" checked={ch.lines} onChange={(lines) => setCh({ lines })} />
              <Toggle label="Centre dot" checked={ch.dot} onChange={(dot) => setCh({ dot })} />
              <Toggle label="Outline" checked={ch.outline} onChange={(outline) => setCh({ outline })} />
            </div>
          </section>

          <section className="card settings-card">
            <div className="card-title">
              <Icon name="target" />
              <h2>Arena</h2>
            </div>
            <Swatches label="Target colour" colors={TARGET_SWATCHES} value={settings.targetColor} onChange={(targetColor) => update({ targetColor })} />
            <div className="field">
              <span className="label">Graphics quality</span>
              <div className="segmented">
                {[
                  ['high', 'High · shadows, 2× AA'],
                  ['low', 'Performance'],
                ].map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={settings.quality === id} onClick={() => update({ quality: id })}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-toggles">
              <Toggle
                label="Show weapon"
                hint="First-person viewmodel with recoil and muzzle flash."
                checked={settings.showWeapon}
                onChange={(showWeapon) => update({ showWeapon })}
              />
              <Toggle
                label="Show FPS counter"
                hint="Frames per second and frame time, in the corner of the arena."
                checked={settings.showFps}
                onChange={(showFps) => update({ showFps })}
              />
            </div>
            <div className="field">
              <label htmlFor="fps-limit">Frame rate limit</label>
              <select
                id="fps-limit"
                className="select"
                value={settings.fpsLimit}
                onChange={(e) => update({ fpsLimit: Number(e.target.value) })}
              >
                {FPS_LIMITS.map((v) => (
                  <option key={v} value={v}>
                    {v === 0 ? (desktop && unlock.unlocked && !unlock.pending ? 'No limit (uncapped)' : 'No limit (monitor refresh rate)') : `${v} FPS`}
                  </option>
                ))}
              </select>
              <span className="settings-note">
                {desktop
                  ? unlock.unlocked
                    ? 'Frame rate is unlocked, so limits above your monitor’s refresh rate take effect.'
                    : 'Without unlocking, the game can’t run faster than your monitor’s refresh rate.'
                  : 'Browsers can’t run faster than your monitor’s refresh rate. The desktop app can.'}
              </span>
            </div>
            {desktop && unlock.loaded && (
              <div className="settings-toggles">
                <Toggle
                  label="Unlock frame rate"
                  hint="Turns off VSync so the game can run above your monitor’s refresh rate for lower input lag, like a real shooter. May cause screen tearing."
                  checked={unlock.unlocked}
                  onChange={setUnlock}
                />
                {unlock.pending && (
                  <div className="toggle-row restart-row">
                    <div className="toggle-hint">Restart the app to apply this change.</div>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => desktop.relaunch()}>
                      Restart now
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="card settings-card">
            <div className="card-title">
              <Icon name="bolt" />
              <h2>Audio & data</h2>
            </div>
            <Slider
              label="Master volume"
              value={Math.round(settings.volume * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => update({ volume: v / 100 })}
            />
            <button
              type="button"
              className="btn btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => {
                sound.unlock();
                setTimeout(() => sound.play('hit', { gain: 0.9 }), 60);
              }}
            >
              Play test sound
            </button>
            <div className="danger-zone">
              <div>
                <div className="toggle-label">Local run history</div>
                <div className="toggle-hint">{history.length} runs stored on this device.</div>
              </div>
              {confirmClear ? (
                <div className="row">
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmClear(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      clearHistory();
                      setConfirmClear(false);
                    }}
                  >
                    Delete all
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-sm" onClick={() => setConfirmClear(true)} disabled={!history.length}>
                  Clear history
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
