import { useSyncExternalStore } from 'react';
import { load, save, remove } from './storage';
import { boardKey, isBetter } from './games';

// Every run is kept locally so the app is fully usable (and shows progress) without the backend.

const KEY = 'hh.history.v1';
const MAX_ENTRIES = 600;

let history = load(KEY, []);
if (!Array.isArray(history)) history = [];
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === KEY) {
      history = load(KEY, []);
      fn();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

export function getHistory() {
  return history;
}

export function runsFor(game, variant) {
  const key = boardKey(game, variant);
  return history.filter((r) => boardKey(r.game, r.variant) === key);
}

export function bestFor(game, variant) {
  let best = null;
  for (const run of runsFor(game, variant)) {
    if (isBetter(game, run.score, best?.score)) best = run;
  }
  return best;
}

/**
 * Store a finished run. Returns whether it beat the previous local best,
 * computed before the run is added.
 */
export function recordRun({ game, variant, score, data = {} }) {
  const previous = bestFor(game, variant);
  const run = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    game,
    variant: variant || undefined,
    score,
    data,
    at: Date.now(),
  };
  history = [run, ...history].slice(0, MAX_ENTRIES);
  save(KEY, history);
  emit();
  return { run, previousBest: previous?.score ?? null, isPersonalBest: isBetter(game, score, previous?.score) };
}

export function clearHistory() {
  history = [];
  remove(KEY);
  emit();
}

export function useHistory() {
  return useSyncExternalStore(subscribe, getHistory, getHistory);
}
