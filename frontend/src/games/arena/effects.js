import * as THREE from 'three';
import { createGlowTexture } from './textures';

// Pooled effects: nothing is allocated during play, which keeps frame times flat.

const PARTICLES = 28;
const BURST_LIFE = 0.5;

class Burst {
  constructor(scene, texture) {
    this.positions = new Float32Array(PARTICLES * 3);
    this.velocities = new Float32Array(PARTICLES * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.material = new THREE.PointsMaterial({
      size: 0.16,
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.visible = false;

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1, 40),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    this.ring.visible = false;
    scene.add(this.points, this.ring);
    this.life = BURST_LIFE;
  }

  spawn(pos, color, radius, camera) {
    const dir = this._dir || (this._dir = new THREE.Vector3());
    for (let i = 0; i < PARTICLES; i++) {
      const j = i * 3;
      dir.randomDirection();
      const speed = 2.5 + Math.random() * 5;
      this.positions[j] = pos.x + dir.x * radius * 0.6;
      this.positions[j + 1] = pos.y + dir.y * radius * 0.6;
      this.positions[j + 2] = pos.z + dir.z * radius * 0.6;
      this.velocities[j] = dir.x * speed;
      this.velocities[j + 1] = dir.y * speed + 1.5;
      this.velocities[j + 2] = dir.z * speed;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.material.color.set(color);
    this.ring.material.color.set(color);
    this.ring.position.copy(pos);
    this.ring.quaternion.copy(camera.quaternion);
    this.baseRadius = radius;
    this.life = 0;
    this.points.visible = this.ring.visible = true;
  }

  update(dt) {
    if (this.life >= BURST_LIFE) return;
    this.life += dt;
    const k = Math.min(1, this.life / BURST_LIFE);
    const drag = Math.exp(-dt * 4);
    for (let i = 0; i < PARTICLES; i++) {
      const j = i * 3;
      this.velocities[j + 1] -= 9 * dt;
      this.velocities[j] *= drag;
      this.velocities[j + 1] *= drag;
      this.velocities[j + 2] *= drag;
      this.positions[j] += this.velocities[j] * dt;
      this.positions[j + 1] += this.velocities[j + 1] * dt;
      this.positions[j + 2] += this.velocities[j + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.material.opacity = 1 - k;
    this.material.size = 0.16 * (1 - k * 0.6);
    const s = this.baseRadius * (1 + k * 1.8);
    this.ring.scale.setScalar(s);
    this.ring.material.opacity = (1 - k) * 0.8;
    if (k >= 1) this.points.visible = this.ring.visible = false;
  }
}

export class BurstPool {
  constructor(scene, size = 8) {
    this.texture = createGlowTexture();
    this.items = Array.from({ length: size }, () => new Burst(scene, this.texture));
    this.next = 0;
  }

  spawn(pos, color, radius, camera) {
    const burst = this.items[this.next];
    this.next = (this.next + 1) % this.items.length;
    burst.spawn(pos, color, radius, camera);
  }

  update(dt) {
    for (const b of this.items) b.update(dt);
  }
}

const IMPACT_HOLD = 2.5;
const IMPACT_FADE = 1;

export class ImpactPool {
  constructor(scene, size = 48) {
    const geo = new THREE.CircleGeometry(0.06, 14);
    this.items = Array.from({ length: size }, () => {
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: 0x050608,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4,
        }),
      );
      mesh.visible = false;
      scene.add(mesh);
      return { mesh, age: Infinity };
    });
    this.next = 0;
    this._look = new THREE.Vector3();
  }

  add(point, normal) {
    const item = this.items[this.next];
    this.next = (this.next + 1) % this.items.length;
    item.mesh.position.copy(point).addScaledVector(normal, 0.004);
    item.mesh.lookAt(this._look.copy(point).add(normal));
    item.mesh.rotation.z = Math.random() * Math.PI;
    item.mesh.scale.setScalar(0.8 + Math.random() * 0.4);
    item.age = 0;
    item.mesh.visible = true;
  }

  update(dt) {
    for (const item of this.items) {
      if (!item.mesh.visible) continue;
      item.age += dt;
      const fade = (item.age - IMPACT_HOLD) / IMPACT_FADE;
      item.mesh.material.opacity = 0.85 * (1 - Math.max(0, fade));
      if (fade >= 1) item.mesh.visible = false;
    }
  }

  clear() {
    for (const item of this.items) item.mesh.visible = false;
  }
}
