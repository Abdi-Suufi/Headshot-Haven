import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { load, save } from '../lib/storage';
import { sound } from '../lib/audio';

const KEY = 'hh.settings.v1';

export const DEFAULT_SETTINGS = {
  sensGame: 'valorant',
  sens: 0.4,
  dpi: 800,
  fov: 103,
  invertY: false,
  inputMode: 'lock', // 'lock' = FPS pointer lock, 'cursor' = aim with a free cursor (trackpads, touch)
  volume: 0.5,
  showWeapon: true,
  showFps: false,
  fpsLimit: 0, // 0 = no limit (the monitor's refresh rate, or uncapped in the desktop app)
  quality: 'high', // 'high' | 'low'
  targetColor: '#ff6b35',
  crosshair: {
    color: '#3dffa2',
    length: 6,
    thickness: 2,
    gap: 3,
    dot: false,
    outline: true,
    lines: true,
  },
};

function merge(stored) {
  if (!stored || typeof stored !== 'object') return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    crosshair: { ...DEFAULT_SETTINGS.crosshair, ...(stored.crosshair || {}) },
  };
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => merge(load(KEY, null)));

  useEffect(() => {
    save(KEY, settings);
    sound.setVolume(settings.volume);
  }, [settings]);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : patch;
      return {
        ...prev,
        ...next,
        crosshair: next.crosshair ? { ...prev.crosshair, ...next.crosshair } : prev.crosshair,
      };
    });
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
