// Server-side rules for every game: what a plausible score looks like and which way is "better".
// Keep in sync with frontend/src/lib/games.js.

const GAMES = {
  gridshot: { higherIsBetter: true, min: 0, max: 50000, integer: true },
  spidershot: { higherIsBetter: true, min: 0, max: 40000, integer: true },
  tracking: { higherIsBetter: true, min: 0, max: 4500, integer: true },
  reaction: { higherIsBetter: false, min: 80, max: 2000, integer: true },
  cps: { higherIsBetter: true, min: 0, max: 25, variants: ['5s', '10s'] },
};

const GAME_IDS = Object.keys(GAMES);

function boardKey(game, variant) {
  return variant ? `${game}:${variant}` : game;
}

function isBetter(game, a, b) {
  if (b == null) return true;
  return GAMES[game].higherIsBetter ? a > b : a < b;
}

/** Returns `{ error }` or the normalised `{ score, variant }`. */
function validateScore(game, rawScore, rawVariant) {
  const config = GAMES[game];
  if (!config) return { error: 'Unknown game' };

  const score = Number(rawScore);
  if (!Number.isFinite(score)) return { error: 'Score must be a number' };
  if (score < config.min || score > config.max) return { error: `Score out of range for ${game}` };

  let variant = null;
  if (config.variants) {
    if (!config.variants.includes(rawVariant)) return { error: `Variant must be one of: ${config.variants.join(', ')}` };
    variant = rawVariant;
  }

  return { score: config.integer ? Math.round(score) : Math.round(score * 100) / 100, variant };
}

/** Accepts a small plain object of run details; anything else is dropped. */
function sanitizeGameData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  try {
    const json = JSON.stringify(data);
    return json.length <= 4096 ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

module.exports = { GAMES, GAME_IDS, boardKey, isBetter, validateScore, sanitizeGameData };
