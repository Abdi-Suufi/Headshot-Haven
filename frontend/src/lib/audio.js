import gunUrl from '../assets/audio/gun-noise.mp3';
import hitUrl from '../assets/audio/ball-hit.ogg';
import highscoreUrl from '../assets/audio/highscore.mp3';

// Web Audio rather than <audio> elements: decoded buffers play with near-zero latency and can
// overlap freely, which matters when shots are fired several times per second.

const SAMPLES = { shot: gunUrl, hit: hitUrl, highscore: highscoreUrl };

class SoundManager {
  ctx = null;
  master = null;
  buffers = {};
  loading = null;
  volume = 0.5;

  ensureContext() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    this.ctx = new Ctx({ latencyHint: 'interactive' });
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  /** Call from a user gesture: browsers keep audio suspended until then. */
  unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!this.loading) this.loading = this.loadAll();
  }

  async loadAll() {
    await Promise.all(
      Object.entries(SAMPLES).map(async ([name, url]) => {
        try {
          const res = await fetch(url);
          const data = await res.arrayBuffer();
          this.buffers[name] = await this.ctx.decodeAudioData(data);
        } catch {
          // A missing sample just means silence for that sound.
        }
      }),
    );
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  play(name, { gain = 1, rate = 1 } = {}) {
    const ctx = this.ctx;
    const buffer = this.buffers[name];
    if (!ctx || !buffer || this.volume <= 0) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.master);
    src.start();
  }

  /** Short synthesized blip for UI feedback (countdown ticks, misses). */
  beep(freq = 880, duration = 0.08, { gain = 0.25, type = 'sine' } = {}) {
    const ctx = this.ctx;
    if (!ctx || this.volume <= 0) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }
}

export const sound = new SoundManager();
