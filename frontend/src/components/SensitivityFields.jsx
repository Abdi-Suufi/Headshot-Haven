import { useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { SENS_PROFILES, cmPer360, convertSens, roundSens } from '../lib/sensitivity';
import './SensitivityFields.css';

/** Number input that lets the user clear and retype freely; only valid values are committed. */
function NumberInput({ value, onCommit, integer = false, ...props }) {
  const [draft, setDraft] = useState(String(value));
  // Sync external changes without clobbering what's being typed (e.g. the trailing "0" of "1.50").
  useEffect(() => setDraft((d) => (parseFloat(d) === value ? d : String(value))), [value]);
  return (
    <input
      {...props}
      className="input mono"
      type="number"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseFloat(e.target.value);
        if (Number.isFinite(n) && n > 0) onCommit(integer ? Math.round(n) : n);
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
}

/** Sensitivity + FOV controls, shared by the Settings page and the in-game menus. */
export default function SensitivityFields({ compact = false }) {
  const { settings, update } = useSettings();
  const cm = cmPer360(settings.sensGame, settings.sens, settings.dpi);

  const changeGame = (game) => {
    // Keep the same physical feel when switching profile by converting the value.
    update({ sensGame: game, sens: roundSens(convertSens(settings.sensGame, settings.sens, game)) });
  };

  return (
    <div className={`sens-fields ${compact ? 'is-compact' : ''}`}>
      <div className="sens-row">
        <div className="field">
          <label htmlFor="sens-game">Game</label>
          <select id="sens-game" className="select" value={settings.sensGame} onChange={(e) => changeGame(e.target.value)}>
            {Object.entries(SENS_PROFILES).map(([id, p]) => (
              <option key={id} value={id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sens-value">In-game sens</label>
          <NumberInput id="sens-value" step="0.001" min="0.001" value={settings.sens} onCommit={(sens) => update({ sens })} />
        </div>
        {!compact && (
          <div className="field">
            <label htmlFor="sens-dpi">Mouse DPI</label>
            <NumberInput id="sens-dpi" step="50" min="100" integer value={settings.dpi} onCommit={(dpi) => update({ dpi })} />
          </div>
        )}
      </div>

      <div className="field">
        <div className="row">
          <label htmlFor="sens-fov" className="label">
            Horizontal FOV
          </label>
          <span className="spacer" />
          <span className="mono">{settings.fov}°</span>
        </div>
        <input
          id="sens-fov"
          className="range"
          type="range"
          min="70"
          max="120"
          step="1"
          value={settings.fov}
          onChange={(e) => update({ fov: Number(e.target.value) })}
        />
      </div>

      {!compact && Number.isFinite(cm) && (
        <div className="sens-readout">
          <div>
            <span className="label">cm / 360°</span>
            <b className="mono">{cm.toFixed(1)} cm</b>
          </div>
          {Object.entries(SENS_PROFILES)
            .filter(([id]) => id !== settings.sensGame)
            .map(([id, p]) => (
              <div key={id}>
                <span className="label">{p.label}</span>
                <b className="mono">{roundSens(convertSens(settings.sensGame, settings.sens, id))}</b>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
