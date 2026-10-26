import { useSyncExternalStore } from 'react';
import { load, save, remove } from './storage';
import { boardKey, isBetter } from './games';

// Every run is kept locally so the app is fully usable (and shows progress) without the backend.
// Guests share one history per browser; each signed-in account gets its own.

const GUEST_KEY = 'hh.history.v1';
const MAX_ENTRIES = 600;

function read(key) {
  const runs = load(key, []);
  return Array.isArray(runs) ? runs : [];
}

let key = GUEST_KEY;
let history = read(key);
const listeners = new Set();

function persist() {
  history = history.slice(0, MAX_ENTRIES);
  save(key, history);
  emit();
}

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === key) {
      history = read(key);
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
  history = [run, ...history];
  persist();
  return { run, previousBest: previous?.score ?? null, isPersonalBest: isBetter(game, score, previous?.score) };
}

export function clearHistory() {
  history = [];
  remove(key);
  emit();
}

/** Switch to the history of a signed-in account (or back to the guest history with `null`). */
export function setHistoryOwner(userId) {
  const next = userId ? `${GUEST_KEY}:${userId}` : GUEST_KEY;
  if (next === key) return;
  key = next;
  history = read(key);
  emit();
}

/** Add runs (e.g. fetched from the server) that aren't already stored, newest first. */
export function mergeRuns(runs) {
  const known = new Set(history.map((r) => r.id));
  const added = runs.filter((r) => !known.has(r.id));
  if (!added.length) return;
  history = [...history, ...added].sort((a, b) => b.at - a.at);
  persist();
}

/**
 * Move the guest's runs into the current (new) account, so playing before signing up isn't lost.
 * The guest history is emptied, so a second account created later doesn't inherit them too.
 */
export function importGuestRuns() {
  if (key === GUEST_KEY) return;
  mergeRuns(read(GUEST_KEY));
  remove(GUEST_KEY);
}

/** Re-key a local run once the server has saved it, so syncing later doesn't duplicate it. */
export function linkRunToServer(localId, serverId) {
  const id = `srv-${serverId}`;
  if (history.some((r) => r.id === id)) {
    history = history.filter((r) => r.id !== localId);
  } else {
    history = history.map((r) => (r.id === localId ? { ...r, id } : r));
  }
  persist();
}

/** Shape a score document from the API like a locally recorded run. */
export function runFromServer(doc) {
  return {
    id: `srv-${doc._id}`,
    game: doc.gameType,
    variant: doc.variant || undefined,
    score: doc.score,
    data: doc.gameData || {},
    at: new Date(doc.createdAt).getTime(),
  };
}

export function useHistory() {
  return useSyncExternalStore(subscribe, getHistory, getHistory);
}
