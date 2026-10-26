// Single source of truth for every game mode: naming, routing, units and score ordering.

export const GAMES = {
  gridshot: {
    id: 'gridshot',
    name: 'Gridshot',
    kind: 'arena',
    path: '/play/gridshot',
    duration: 60,
    unit: 'pts',
    higherIsBetter: true,
    skill: 'Flicking & speed',
    tagline: 'Three targets. Sixty seconds. Clear the grid.',
    description:
      'Three targets sit on a grid floating in front of you. Destroy one and another appears. Keep a streak alive to multiply your points up to 2x.',
  },
  spidershot: {
    id: 'spidershot',
    name: 'Spidershot',
    kind: 'arena',
    path: '/play/spidershot',
    duration: 60,
    unit: 'pts',
    higherIsBetter: true,
    skill: 'Wide flicks & recentering',
    tagline: 'Snap out, snap back. Faster kills, bigger bonus.',
    description:
      'Targets alternate between the centre and a random spot across a wide arc. Faster kills earn up to +150 bonus points per target.',
  },
  tracking: {
    id: 'tracking',
    name: 'Strafe Track',
    kind: 'arena',
    path: '/play/tracking',
    duration: 45,
    unit: 'pts',
    higherIsBetter: true,
    skill: 'Smooth tracking',
    tagline: 'Stay on a strafing target. No clicking, just control.',
    description:
      'A target strafes unpredictably in front of you. Keep your crosshair on it. You score for every moment on target.',
  },
  reaction: {
    id: 'reaction',
    name: 'Reaction Time',
    kind: 'page',
    path: '/reaction',
    unit: 'ms',
    higherIsBetter: false,
    skill: 'Reflexes',
    attempts: 5,
    tagline: 'Wait for green. Click. Five attempts, averaged.',
    description:
      'The screen turns green after a random delay. Click as fast as you can. Your score is the average of five attempts, and clicking early costs you a retry.',
  },
  cps: {
    id: 'cps',
    name: 'CPS Test',
    kind: 'page',
    path: '/cps',
    unit: 'CPS',
    higherIsBetter: true,
    skill: 'Click speed',
    variants: ['5s', '10s'],
    defaultVariant: '5s',
    tagline: 'How fast can you click? Timer starts on your first click.',
    description:
      'Click the pad as fast as possible. The timer starts on your first click. You get average and peak clicks per second plus a live chart.',
  },
};

export const ARENA_MODES = ['gridshot', 'spidershot', 'tracking'];
export const GAME_ORDER = ['gridshot', 'spidershot', 'tracking', 'reaction', 'cps'];

/** Leaderboards are keyed by game plus optional variant (e.g. "cps:10s"). */
export function boardKey(game, variant) {
  return variant ? `${game}:${variant}` : game;
}

export function boardLabel(game, variant) {
  const name = GAMES[game]?.name ?? game;
  return variant ? `${name} · ${variant}` : name;
}

/** Every leaderboard the app knows about, in display order. */
export function allBoards() {
  return GAME_ORDER.flatMap((id) => {
    const g = GAMES[id];
    return g.variants ? g.variants.map((v) => ({ game: id, variant: v })) : [{ game: id, variant: undefined }];
  });
}

export function isBetter(game, a, b) {
  if (b == null) return a != null;
  if (a == null) return false;
  return GAMES[game].higherIsBetter ? a > b : a < b;
}

export function formatScore(game, score) {
  if (score == null || Number.isNaN(score)) return '—';
  switch (game) {
    case 'reaction':
      return `${Math.round(score)} ms`;
    case 'cps':
      return `${score.toFixed(2)} CPS`;
    default:
      return Math.round(score).toLocaleString();
  }
}

/** Number only, no unit: for big result displays where the unit is rendered separately. */
export function formatScoreValue(game, score) {
  if (score == null || Number.isNaN(score)) return '—';
  if (game === 'reaction') return String(Math.round(score));
  if (game === 'cps') return score.toFixed(2);
  return Math.round(score).toLocaleString();
}
