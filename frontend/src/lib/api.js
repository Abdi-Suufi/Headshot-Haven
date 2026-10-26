// Thin fetch wrapper for the Express API. Every call fails soft: the UI treats any network or
// parse failure as "server offline" and falls back to local-only mode.

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'hh.token';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request(path, { method = 'GET', body, timeout = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(err.name === 'AbortError' ? 'Request timed out' : 'Server unreachable', 0);
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  const type = res.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    data = await res.json().catch(() => null);
  }
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  if (data === null) {
    // A static host answering with index.html means there is no API behind it.
    throw new ApiError('Unexpected response from server', res.status);
  }
  return data;
}

export const api = {
  health: () => request('/health', { timeout: 3000 }),
  register: (username, email, password) => request('/auth/register', { method: 'POST', body: { username, email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  googleUrl: () => `${BASE}/auth/google`,
  submitScore: (game, { score, variant, gameData }) =>
    request(`/games/${game}`, { method: 'POST', body: { score, variant, gameData } }),
  history: (limit = 100) => request(`/games/history?limit=${limit}`),
  leaderboard: (game, variant) =>
    request(`/games/${game}/leaderboard${variant ? `?variant=${encodeURIComponent(variant)}` : ''}`),
  updateProfile: (fields) => request('/users/profile', { method: 'PUT', body: fields }),
};
