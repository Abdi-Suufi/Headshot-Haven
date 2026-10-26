// Pure scoring helpers shared by the mini-games (and covered by unit tests).

/** Highest number of clicks inside any 1-second window. `times` are ascending ms offsets. */
export function peakCps(times) {
  let best = 0;
  let j = 0;
  for (let i = 0; i < times.length; i++) {
    while (times[i] - times[j] > 1000) j++;
    best = Math.max(best, i - j + 1);
  }
  return best;
}

export function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1));
}

/**
 * Share of people (in %) with a slower visual reaction time than `ms`, using a rough
 * population model (normal, mean 273ms, sd 55ms) typical of browser click tests.
 */
export function percentSlowerThan(ms, mean = 273, sd = 55) {
  const z = (ms - mean) / sd;
  // Abramowitz-Stegun approximation of the normal tail probability.
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const tail = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const faster = z > 0 ? 1 - tail : tail;
  return Math.round((1 - faster) * 1000) / 10;
}
