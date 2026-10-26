// Mode logic is kept free of three.js: modes decide *where* targets go (as yaw/pitch/distance from
// the player's eye) and how hits are scored. The engine owns meshes, input and rendering.

export const EYE_HEIGHT = 2.2;
export const START_PITCH = 3.5; // degrees; the camera starts looking at the centre of the grid

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

/** Gridshot: streak multiplier grows 5% per consecutive hit, capped at 2x. */
export function gridshotPoints(streak) {
  return Math.round(100 * (1 + 0.05 * clamp(streak - 1, 0, 20)));
}

/** Spidershot: 100 base, plus up to 150 for kills under 250ms, fading to 0 at 1250ms. */
export function spidershotPoints(ttkMs) {
  const t = clamp(1 - (ttkMs - 250) / 1000, 0, 1);
  return 100 + Math.round(150 * t);
}

export const TRACKING_POINTS_PER_SECOND = 100;

export function trackingPoints(onTargetMs) {
  return (onTargetMs / 1000) * TRACKING_POINTS_PER_SECOND;
}

const GRID_COLS = [-14, -7, 0, 7, 14];
const GRID_ROWS = [-7, 0, 7, 14].map((p) => p + START_PITCH - 3.5);
export const GRID_SLOTS = GRID_ROWS.flatMap((pitch) => GRID_COLS.map((yaw) => ({ yaw, pitch })));

/** Pick a random free slot, never the one just vacated (so a target never respawns in place). */
export function pickSlot(occupied, exclude, total = GRID_SLOTS.length) {
  const free = [];
  for (let i = 0; i < total; i++) if (!occupied.has(i) && i !== exclude) free.push(i);
  return free[Math.floor(Math.random() * free.length)];
}

class GridshotMode {
  kind = 'hits';
  measure = 'interval';

  constructor(engine) {
    this.engine = engine;
  }

  start() {
    this.occupied = new Set();
    for (let i = 0; i < 3; i++) this.spawn(-1);
  }

  spawn(exclude) {
    const slot = pickSlot(this.occupied, exclude);
    this.occupied.add(slot);
    const { yaw, pitch } = GRID_SLOTS[slot];
    // Depth varies so the grid reads as 3D space rather than a flat wall.
    this.engine.spawnTarget({ yaw, pitch, distance: rand(12, 16), radius: 0.55, slot });
  }

  onHit(target) {
    this.occupied.delete(target.slot);
    this.spawn(target.slot);
  }

  points({ streak }) {
    return gridshotPoints(streak);
  }
}

class SpidershotMode {
  kind = 'hits';
  measure = 'ttk';

  constructor(engine) {
    this.engine = engine;
  }

  start() {
    this.nextIsCenter = true;
    this.spawn();
  }

  spawn() {
    if (this.nextIsCenter) {
      this.engine.spawnTarget({ yaw: 0, pitch: START_PITCH, distance: 14, radius: 0.62 });
    } else {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.engine.spawnTarget({
        yaw: side * rand(14, 50),
        pitch: rand(-2, 20),
        distance: rand(12, 18),
        radius: 0.5,
      });
    }
    this.nextIsCenter = !this.nextIsCenter;
  }

  onHit() {
    this.spawn();
  }

  points({ ttk }) {
    return spidershotPoints(ttk);
  }
}

class TrackingMode {
  kind = 'tracking';
  measure = null;

  constructor(engine) {
    this.engine = engine;
  }

  start() {
    this.t = 0;
    this.yaw = 0;
    this.pitch = START_PITCH;
    this.vel = 0;
    this.targetVel = (Math.random() < 0.5 ? -1 : 1) * rand(14, 30);
    this.nextChange = rand(0.4, 1.0);
    this.target = this.engine.spawnTarget({ yaw: this.yaw, pitch: this.pitch, distance: 14, radius: 0.7 });
  }

  update(dt) {
    this.t += dt;
    this.nextChange -= dt;
    if (this.nextChange <= 0) {
      // Direction changes and speed bursts mimic an enemy ADAD-strafing.
      const dir = Math.random() < 0.7 ? -Math.sign(this.targetVel || 1) : Math.sign(this.targetVel || 1);
      this.targetVel = dir * rand(12, 40);
      this.nextChange = rand(0.35, 1.1);
    }
    this.vel += (this.targetVel - this.vel) * Math.min(1, dt * 7);
    this.yaw += this.vel * dt;
    if (Math.abs(this.yaw) > 38) {
      this.yaw = Math.sign(this.yaw) * 38;
      this.targetVel = -this.targetVel;
      this.vel *= -0.4;
    }
    this.pitch = START_PITCH + Math.sin(this.t * 0.9) * 3 + Math.sin(this.t * 2.3) * 0.8;
    this.engine.placeTarget(this.target, this.yaw, this.pitch, 14);
  }

  onHit() {}

  points() {
    return 0;
  }
}

const MODE_CLASSES = { gridshot: GridshotMode, spidershot: SpidershotMode, tracking: TrackingMode };

export function createMode(id, engine) {
  const Mode = MODE_CLASSES[id] ?? GridshotMode;
  return new Mode(engine);
}
