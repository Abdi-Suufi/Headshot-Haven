import * as THREE from 'three';

// All textures are generated on a canvas at runtime, so the arena ships with zero image assets.

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

/** Dark tiled panel with a faint centre mark, the classic aim-trainer look. */
export function createGridTexture({ base = '#161a22', line = '#272d39', mark = '#1f242e', accent = null } = {}) {
  const size = 256;
  const [c, ctx] = canvas(size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, size - 3, size - 3);

  ctx.strokeStyle = mark;
  ctx.lineWidth = 2;
  const m = size / 2;
  ctx.beginPath();
  ctx.moveTo(m - 10, m);
  ctx.lineTo(m + 10, m);
  ctx.moveTo(m, m - 10);
  ctx.lineTo(m, m + 10);
  ctx.stroke();

  if (accent) {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 18, 3);
    ctx.fillRect(0, 0, 3, 18);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial glow used for particles and muzzle flash. */
export function createGlowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const size = 64;
  const [c, ctx] = canvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFlashTexture() {
  const size = 128;
  const [c, ctx] = canvas(size);
  const m = size / 2;
  const g = ctx.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(255,250,230,1)');
  g.addColorStop(0.2, 'rgba(255,200,110,0.95)');
  g.addColorStop(0.5, 'rgba(255,120,40,0.35)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g;
  // A star shape reads as a muzzle flash rather than a plain blob.
  ctx.beginPath();
  const spikes = 7;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? m : m * 0.38;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    ctx.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
