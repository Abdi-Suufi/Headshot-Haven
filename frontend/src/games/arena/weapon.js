import * as THREE from 'three';
import { createFlashTexture } from './textures';

// First-person viewmodel. It lives in its own scene with its own camera and is drawn after the
// world with a cleared depth buffer, so it never clips into walls and its FOV stays fixed
// regardless of the player's world FOV, the same technique real shooters use.

const BASE_POS = new THREE.Vector3(0.25, -0.235, -0.56);
const BASE_ROT = new THREE.Euler(0, 0.045, 0);

function box(w, h, d, mat, x, y, z, rx = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.x = rx;
  return m;
}

function cylinder(r, len, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat);
  m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

export class Weapon {
  constructor(accent = '#ff6b35') {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.01, 10);

    this.scene.add(new THREE.HemisphereLight(0xdde6ff, 0x1a1c22, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-1, 2, 1.5);
    this.scene.add(key);
    this.flashLight = new THREE.PointLight(0xffa04a, 0, 1.2, 2);
    this.scene.add(this.flashLight);

    const metal = new THREE.MeshStandardMaterial({ color: 0x2c313b, roughness: 0.45, metalness: 0.35 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x17191f, roughness: 0.7, metalness: 0.2 });
    this.accentMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.7, roughness: 0.4 });

    const gun = new THREE.Group();
    gun.add(
      box(0.075, 0.095, 0.36, metal, 0, 0, 0),
      box(0.05, 0.018, 0.34, dark, 0, 0.056, -0.01),
      box(0.07, 0.072, 0.26, dark, 0, -0.004, -0.3),
      cylinder(0.013, 0.17, metal, 0, 0.01, -0.5),
      cylinder(0.021, 0.055, dark, 0, 0.01, -0.6),
      box(0.05, 0.13, 0.065, dark, 0, -0.1, 0.085, 0.28),
      box(0.045, 0.15, 0.08, metal, 0, -0.11, -0.085, -0.14),
      box(0.055, 0.082, 0.2, dark, 0, -0.008, 0.27),
      box(0.032, 0.032, 0.035, dark, 0, 0.08, 0.09),
      box(0.012, 0.036, 0.012, dark, 0, 0.075, -0.15),
      box(0.079, 0.012, 0.24, this.accentMat, 0, 0.022, -0.02),
      box(0.074, 0.01, 0.12, this.accentMat, 0, -0.03, -0.3),
    );

    this.flash = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: createFlashTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
    );
    this.flash.position.set(0, 0.01, -0.66);
    this.flash.visible = false;
    gun.add(this.flash);

    this.gun = gun;
    this.group = new THREE.Group();
    this.group.add(gun);
    this.scene.add(this.group);

    this.recoil = 0;
    this.flashTime = 0;
    this.sway = new THREE.Vector2();
    this.swayTarget = new THREE.Vector2();
  }

  setAccent(color) {
    this.accentMat.color.set(color);
    this.accentMat.emissive.set(color);
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  fire() {
    this.recoil = Math.min(1.3, this.recoil + 0.85);
    this.flashTime = 0.045;
    this.flash.material.rotation = Math.random() * Math.PI * 2;
    this.flash.scale.setScalar(0.16 + Math.random() * 0.08);
  }

  /** Mouse deltas push the gun the opposite way, so it lags slightly behind the view. */
  addSway(dx, dy) {
    this.swayTarget.x = THREE.MathUtils.clamp(this.swayTarget.x - dx * 0.00035, -0.06, 0.06);
    this.swayTarget.y = THREE.MathUtils.clamp(this.swayTarget.y - dy * 0.00035, -0.05, 0.05);
  }

  update(dt, time) {
    this.recoil *= Math.exp(-dt * 13);
    this.swayTarget.multiplyScalar(Math.exp(-dt * 9));
    this.sway.lerp(this.swayTarget, Math.min(1, dt * 14));

    const bob = Math.sin(time * 1.7) * 0.0025;
    const r = this.recoil;
    this.group.position.set(
      BASE_POS.x + this.sway.x * 0.35,
      BASE_POS.y + bob + this.sway.y * 0.25 + r * 0.008,
      BASE_POS.z + r * 0.065,
    );
    this.group.rotation.set(BASE_ROT.x + r * 0.13 + this.sway.y, BASE_ROT.y + this.sway.x, r * 0.02);

    if (this.flashTime > 0) {
      this.flashTime -= dt;
      this.flash.visible = true;
      this.flashLight.intensity = 3;
      this.flash.getWorldPosition(this.flashLight.position);
    } else {
      this.flash.visible = false;
      this.flashLight.intensity = 0;
    }
  }
}
