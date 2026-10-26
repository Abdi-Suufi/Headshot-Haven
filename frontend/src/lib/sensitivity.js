// Mouse sensitivity maths. Each game turns one mouse count into `sens * yaw` degrees of rotation,
// so matching yaw values reproduces the exact feel of the player's real game.

export const SENS_PROFILES = {
  valorant: { label: 'Valorant', yaw: 0.07, defaultSens: 0.4 },
  cs2: { label: 'CS2 / Apex', yaw: 0.022, defaultSens: 1.27 },
  overwatch: { label: 'Overwatch 2', yaw: 0.0066, defaultSens: 4.24 },
  fortnite: { label: 'Fortnite', yaw: 0.5555, defaultSens: 0.05 },
};

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function degreesPerCount(game, sens) {
  const profile = SENS_PROFILES[game] ?? SENS_PROFILES.valorant;
  return sens * profile.yaw;
}

/** Physical mouse travel (cm) for a full 360° turn. */
export function cmPer360(game, sens, dpi) {
  const deg = degreesPerCount(game, sens);
  if (!deg || !dpi) return Infinity;
  return (360 / deg / dpi) * 2.54;
}

export function convertSens(fromGame, sens, toGame) {
  const from = SENS_PROFILES[fromGame] ?? SENS_PROFILES.valorant;
  const to = SENS_PROFILES[toGame] ?? SENS_PROFILES.valorant;
  return (sens * from.yaw) / to.yaw;
}

/** Games quote horizontal FOV; three.js cameras take vertical FOV. */
export function verticalFov(horizontalDeg, aspect) {
  return 2 * Math.atan(Math.tan((horizontalDeg * DEG2RAD) / 2) / aspect) * RAD2DEG;
}

export function roundSens(value) {
  if (!Number.isFinite(value)) return 0;
  if (value >= 10) return Math.round(value * 100) / 100;
  return Math.round(value * 1000) / 1000;
}
