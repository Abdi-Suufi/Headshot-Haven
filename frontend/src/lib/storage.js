// localStorage can throw (private mode, blocked storage), so every access is guarded.

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is best-effort; the app keeps working in memory.
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
