import * as THREE from 'three';
import { createMode, EYE_HEIGHT, START_PITCH, trackingPoints } from './modes';
import { Weapon } from './weapon';
import { BurstPool, ImpactPool } from './effects';
import { createGridTexture } from './textures';
import { degreesPerCount, verticalFov } from '../../lib/sensitivity';
import { GAMES } from '../../lib/games';
import { sound } from '../../lib/audio';

const DEG = Math.PI / 180;
const CENTER = new THREE.Vector2(0, 0);
const COUNTDOWN = 3;
const HUD_INTERVAL = 1000 / 20;
// Some Chrome/Windows setups report occasional bogus movement spikes under pointer lock.
const MAX_MOVEMENT = 400;

const ROOM = { width: 44, height: 15, front: -38, back: 10 };

/**
 * Owns the three.js scene, input handling and game clock for the 3D modes.
 * React talks to it through a handful of methods (begin/resume/restart/quit/applySettings)
 * and listens through `onHud` (throttled stats) and `onEvent` (state changes, hits, results).
 *
 * States: idle → countdown → playing ⇄ paused → ended
 */
export class ArenaEngine {
  constructor(container, { mode, settings, onHud = () => {}, onEvent = () => {} }) {
    this.container = container;
    this.modeId = mode;
    this.game = GAMES[mode];
    this.settings = settings;
    this.onHud = onHud;
    this.onEvent = onEvent;

    this.state = 'idle';
    this.time = 0;
    this.yaw = 0;
    this.pitch = START_PITCH * DEG;
    this.targets = [];
    this.pointer = new THREE.Vector2();
    // Touch-first devices can't capture a mouse, so they aim with taps.
    this.coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    this.cursorMode = settings.inputMode === 'cursor' || this.coarsePointer;
    this.lockSupported = null; // unknown until the first lock attempt resolves
    this.pendingLock = null;
    this.lastHud = 0;
    this.nextFrameAt = 0;
    this.raycaster = new THREE.Raycaster();

    this.initRenderer();
    this.buildRoom();
    this.weapon = new Weapon(settings.targetColor);
    this.bursts = new BurstPool(this.scene);
    this.impacts = new ImpactPool(this.scene);
    this.targetGeo = new THREE.SphereGeometry(1, 40, 24);
    this.targetMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.05, emissiveIntensity: 0.45 });

    this.mode = createMode(mode, this);
    this.resetStats();
    this.mode.start(); // live preview behind the start menu

    this.applySettings(settings);
    this.bindEvents();
    this.resize();
    this.lastFrame = performance.now();
    this.channel = new MessageChannel();
    this.channel.port1.onmessage = this.frame;
    // The desktop app can run with VSync off; it reports that through its bridge.
    this.uncapped = false;
    window.headshotDesktop?.getFrameRateUnlocked().then(({ active }) => {
      this.uncapped = active;
    });
    this.scheduleFrame();
  }

  // ---------------------------------------------------------------- setup

  initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.autoClear = false;
    renderer.domElement.className = 'arena-canvas';
    this.container.appendChild(renderer.domElement);
    this.renderer = renderer;
    this.canvas = renderer.domElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x14171d);
    this.scene.fog = new THREE.Fog(0x14171d, 50, 110);

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 200);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.set(0, EYE_HEIGHT, 0);
    this.scene.add(this.camera);
  }

  buildRoom() {
    const { width: W, height: H, front, back } = ROOM;
    const depth = back - front;
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    const wallTex = createGridTexture({ base: '#3b414d', line: '#505869', mark: '#454c59' });
    const floorTex = createGridTexture({ base: '#262a32', line: '#363c49', mark: '#2e333d', accent: '#6b4632' });
    this.roomMeshes = [];

    const surface = (tex, w, h, repeatScale = 2) => {
      const t = tex.clone();
      t.needsUpdate = true;
      t.anisotropy = aniso;
      t.repeat.set(w / repeatScale, h / repeatScale);
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, metalness: 0 });
    };
    const add = (mesh) => {
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.roomMeshes.push(mesh);
      return mesh;
    };

    const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(W, depth), surface(floorTex, W, depth)));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, (front + back) / 2);

    const ceiling = add(new THREE.Mesh(new THREE.PlaneGeometry(W, depth), surface(wallTex, W, depth, 4)));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, H, (front + back) / 2);

    const frontWall = add(new THREE.Mesh(new THREE.PlaneGeometry(W, H), surface(wallTex, W, H)));
    frontWall.position.set(0, H / 2, front);

    const backWall = add(new THREE.Mesh(new THREE.PlaneGeometry(W, H), surface(wallTex, W, H)));
    backWall.rotation.y = Math.PI;
    backWall.position.set(0, H / 2, back);

    const leftWall = add(new THREE.Mesh(new THREE.PlaneGeometry(depth, H), surface(wallTex, depth, H)));
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-W / 2, H / 2, (front + back) / 2);

    const rightWall = add(new THREE.Mesh(new THREE.PlaneGeometry(depth, H), surface(wallTex, depth, H)));
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(W / 2, H / 2, (front + back) / 2);

    // Cover blocks and pillars give the room the silhouette of an FPS map.
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x2b303a, roughness: 0.8 });
    const trimMat = new THREE.MeshBasicMaterial({ color: 0xff6b35 });
    this.trimMat = trimMat;
    const blocks = [
      [-17, 1.6, -30, 4, 3.2, 4],
      [-13.5, 1, -31, 3, 2, 3],
      [17, 2.2, -28, 4, 4.4, 4],
      [13, 1, -33, 2.4, 2, 2.4],
      [-19.5, H / 2, -12, 1.6, H, 1.6],
      [19.5, H / 2, -12, 1.6, H, 1.6],
      [-19.5, H / 2, 2, 1.6, H, 1.6],
      [19.5, H / 2, 2, 1.6, H, 1.6],
    ];
    for (const [x, y, z, w, h, d] of blocks) {
      const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), coverMat));
      m.position.set(x, y, z);
      m.castShadow = true;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.06, d + 0.02), trimMat);
      trim.position.set(x, y - h / 2 + 0.25, z);
      this.scene.add(trim);
    }

    // Glowing strips: ceiling light panels and an accent line along the base of the walls.
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xaab4cc });
    const panelGeo = new THREE.PlaneGeometry(3, 1.2);
    for (const x of [-12, 0, 12]) {
      for (let z = front + 6; z < back - 2; z += 9) {
        const panel = new THREE.Mesh(panelGeo, lightMat);
        panel.rotation.x = Math.PI / 2;
        panel.position.set(x, H - 0.01, z);
        this.scene.add(panel);
      }
    }
    const strip = (w, x, z, ry) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.08), trimMat);
      s.position.set(x, 0.3, z);
      s.rotation.y = ry;
      this.scene.add(s);
    };
    strip(W, 0, front + 0.01, 0);
    strip(depth, -W / 2 + 0.01, (front + back) / 2, Math.PI / 2);
    strip(depth, W / 2 - 0.01, (front + back) / 2, -Math.PI / 2);

    // Spawn pad under the player.
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.7, 0.12, 48),
      new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.6 }),
    );
    pad.position.set(0, 0.06, 0);
    pad.receiveShadow = true;
    this.scene.add(pad);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.55, 64), trimMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.125, 0);
    this.scene.add(ring);

    this.scene.add(new THREE.HemisphereLight(0xd6e0ff, 0x5a6070, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(6, 22, 6);
    sun.target.position.set(0, 0, -16);
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 30, bottom: -30, near: 1, far: 70 });
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun, sun.target);
    this.sun = sun;

    const fill = new THREE.PointLight(0xff8a50, 18, 40, 2);
    fill.position.set(0, 8, -24);
    this.scene.add(fill);
  }

  bindEvents() {
    this.onMouseMove = (e) => {
      if (this.cursorMode || document.pointerLockElement !== this.canvas) return;
      const { movementX: dx, movementY: dy } = e;
      if (Math.abs(dx) > MAX_MOVEMENT || Math.abs(dy) > MAX_MOVEMENT) return;
      const k = degreesPerCount(this.settings.sensGame, this.settings.sens) * DEG;
      this.yaw -= dx * k;
      this.pitch -= dy * k * (this.settings.invertY ? -1 : 1);
      this.pitch = THREE.MathUtils.clamp(this.pitch, -89 * DEG, 89 * DEG);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.weapon.addSway(dx, dy);
    };
    this.onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (!this.cursorMode && document.pointerLockElement === this.canvas) this.fire();
    };
    this.onPointerMove = (e) => {
      if (!this.cursorMode) return;
      this.updatePointer(e);
    };
    this.onPointerDown = (e) => {
      if (!this.cursorMode || e.button !== 0) return;
      this.updatePointer(e);
      this.fire();
    };
    this.onLockChange = () => {
      const locked = document.pointerLockElement === this.canvas;
      if (locked) {
        clearTimeout(this.lockTimer);
        this.lockSupported = true;
        this.cursorMode = false;
        this.emit({ type: 'input', cursor: false });
        const cb = this.pendingLock;
        this.pendingLock = null;
        cb?.();
      } else if (!this.cursorMode && (this.state === 'playing' || this.state === 'countdown')) {
        this.pause();
      }
    };
    this.onLockError = () => this.lockFailed();
    this.onKeyDown = (e) => {
      if (e.code === 'KeyR' && (this.state === 'playing' || this.state === 'countdown' || this.state === 'paused')) {
        e.preventDefault();
        this.restart();
      } else if (e.code === 'Escape' && this.cursorMode && (this.state === 'playing' || this.state === 'countdown')) {
        this.pause();
      }
    };
    this.onBlur = () => {
      if (this.cursorMode && (this.state === 'playing' || this.state === 'countdown')) this.pause();
    };
    this.onContextMenu = (e) => e.preventDefault();

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('pointerlockchange', this.onLockChange);
    document.addEventListener('pointerlockerror', this.onLockError);
    document.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('blur', this.onBlur);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  updatePointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Portrait screens would otherwise get an extreme fisheye vertical FOV.
    this.camera.fov = Math.min(verticalFov(this.settings.fov, this.camera.aspect), 95);
    this.camera.updateProjectionMatrix();
    this.weapon.setAspect(w / h);
  }

  applySettings(settings) {
    const prev = this.settings;
    this.settings = settings;
    if (prev.fpsLimit !== settings.fpsLimit) this.nextFrameAt = 0;
    const high = settings.quality !== 'low';
    this.renderer.setPixelRatio(high ? Math.min(window.devicePixelRatio, 2) : 1);
    if (this.renderer.shadowMap.enabled !== high) {
      this.renderer.shadowMap.enabled = high;
      this.sun.castShadow = high;
      this.scene.traverse((o) => {
        if (o.material) o.material.needsUpdate = true;
      });
    }
    this.targetMat.color.set(settings.targetColor);
    this.targetMat.emissive.set(settings.targetColor);
    for (const t of this.targets) {
      if (t.mesh.material !== this.targetMat) {
        t.mesh.material.color.set(settings.targetColor);
        t.mesh.material.emissive.set(settings.targetColor);
      }
    }
    this.weapon.setAccent(settings.targetColor);
    if (prev.inputMode !== settings.inputMode && this.state === 'idle') {
      this.cursorMode = settings.inputMode === 'cursor' || this.coarsePointer;
      this.emit({ type: 'input', cursor: this.cursorMode });
    }
    this.resize();
  }

  // ---------------------------------------------------------------- targets

  spawnTarget({ yaw, pitch, distance, radius, slot = null }) {
    // Tracking targets get their own material so their glow can react to being tracked.
    const material = this.mode.kind === 'tracking' ? this.targetMat.clone() : this.targetMat;
    const mesh = new THREE.Mesh(this.targetGeo, material);
    mesh.castShadow = true;
    const target = { mesh, radius, slot, spawnAt: this.elapsedMs(), age: 0 };
    this.placeTarget(target, yaw, pitch, distance);
    mesh.scale.setScalar(radius * 0.2);
    this.scene.add(mesh);
    this.targets.push(target);
    return target;
  }

  placeTarget(target, yawDeg, pitchDeg, distance) {
    const yaw = yawDeg * DEG;
    const pitch = pitchDeg * DEG;
    target.mesh.position.set(
      -Math.sin(yaw) * Math.cos(pitch) * distance,
      EYE_HEIGHT + Math.sin(pitch) * distance,
      -Math.cos(yaw) * Math.cos(pitch) * distance,
    );
  }

  removeTarget(target) {
    this.scene.remove(target.mesh);
    if (target.mesh.material !== this.targetMat) target.mesh.material.dispose();
    this.targets = this.targets.filter((t) => t !== target);
  }

  clearTargets() {
    for (const t of [...this.targets]) this.removeTarget(t);
  }

  aimRay() {
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(this.cursorMode ? this.pointer : CENTER, this.camera);
    return this.raycaster;
  }

  // ---------------------------------------------------------------- gameplay

  resetStats() {
    this.elapsed = 0;
    this.stats = {
      score: 0,
      hits: 0,
      shots: 0,
      streak: 0,
      bestStreak: 0,
      killTimes: [],
      lastKillAt: 0,
      onTargetMs: 0,
      currentTrack: 0,
      longestTrack: 0,
      onTarget: false,
      timeline: new Array(Math.ceil(this.game.duration)).fill(0),
    };
  }

  elapsedMs() {
    return this.elapsed * 1000;
  }

  fire() {
    if (this.state !== 'playing' || this.mode.kind === 'tracking') return;
    const s = this.stats;
    s.shots++;
    this.weapon.fire();
    sound.play('shot', { gain: 0.28, rate: 0.96 + Math.random() * 0.08 });

    const ray = this.aimRay();
    const hit = ray.intersectObjects(this.targets.map((t) => t.mesh), false)[0];
    if (hit) {
      const target = this.targets.find((t) => t.mesh === hit.object);
      this.registerHit(target);
    } else {
      s.streak = 0;
      const wall = ray.intersectObjects(this.roomMeshes, false)[0];
      if (wall?.face) {
        const normal = wall.face.normal.clone().transformDirection(wall.object.matrixWorld);
        this.impacts.add(wall.point, normal);
      }
      this.emit({ type: 'miss' });
    }
  }

  registerHit(target) {
    const s = this.stats;
    const now = this.elapsedMs();
    s.hits++;
    s.streak++;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    const ttk = now - target.spawnAt;
    s.killTimes.push(this.mode.measure === 'ttk' ? ttk : now - s.lastKillAt);
    s.lastKillAt = now;
    const points = this.mode.points({ streak: s.streak, ttk });
    s.score += points;
    const second = Math.min(s.timeline.length - 1, Math.floor(this.elapsed));
    s.timeline[second] += 1;

    this.bursts.spawn(target.mesh.position, this.settings.targetColor, target.radius, this.camera);
    this.removeTarget(target);
    this.mode.onHit(target);
    sound.play('hit', { gain: 0.9, rate: 1 + Math.min(s.streak, 20) * 0.01 });
    this.emit({ type: 'hit', points, streak: s.streak });
    this.emitHud(true);
  }

  updateTracking(dt) {
    const s = this.stats;
    const target = this.mode.target;
    if (!target || !this.targets.includes(target)) return;
    const on = this.aimRay().intersectObject(target.mesh, false).length > 0;
    const playing = this.state === 'playing';
    if (on && playing) {
      const ms = dt * 1000;
      s.onTargetMs += ms;
      s.currentTrack += ms;
      s.longestTrack = Math.max(s.longestTrack, s.currentTrack);
      s.timeline[Math.min(s.timeline.length - 1, Math.floor(this.elapsed))] += ms;
      s.score = trackingPoints(s.onTargetMs);
    } else {
      s.currentTrack = 0;
    }
    if (on !== s.onTarget) {
      s.onTarget = on;
      if (playing) this.emit({ type: 'track', on });
    }
    const mat = target.mesh.material;
    const goal = on ? 1.6 : 0.45;
    mat.emissiveIntensity += (goal - mat.emissiveIntensity) * Math.min(1, dt * 18);
    const pulse = on ? 1 + Math.sin(this.time * 30) * 0.03 : 1;
    target.mesh.scale.setScalar(target.radius * pulse);
  }

  // ---------------------------------------------------------------- state machine

  setState(state) {
    this.state = state;
    this.emit({ type: 'state', state });
    this.emitHud(true);
  }

  /** Must be called from a user gesture (click / key) so pointer lock can be granted. */
  begin() {
    sound.unlock();
    this.prepareRun();
    this.withLock(() => this.startCountdown());
  }

  resume() {
    if (this.state !== 'paused') return;
    sound.unlock();
    this.withLock(() => {
      if (this.state !== 'paused') return;
      if (this.resumeTo === 'countdown') this.startCountdown();
      else this.setState('playing');
    });
  }

  restart() {
    this.prepareRun();
    const locked = document.pointerLockElement === this.canvas;
    if (locked || this.cursorMode) this.startCountdown();
    else this.withLock(() => this.startCountdown());
  }

  quit() {
    this.pendingLock = null;
    clearTimeout(this.lockTimer);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.prepareRun();
    this.mode.start();
    this.setState('idle');
  }

  prepareRun() {
    this.clearTargets();
    this.impacts.clear();
    this.resetStats();
    this.yaw = 0;
    this.pitch = START_PITCH * DEG;
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  startCountdown() {
    this.clearTargets();
    this.countdown = COUNTDOWN;
    this.lastTick = COUNTDOWN + 1;
    this.setState('countdown');
  }

  startPlaying() {
    this.mode.start();
    sound.beep(1320, 0.12, { gain: 0.2 });
    this.setState('playing');
  }

  pause() {
    this.resumeTo = this.state;
    this.setState('paused');
  }

  end() {
    this.clearTargets();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    // Result first, so the UI already has it when the state flips to "ended".
    this.emit({ type: 'end', result: this.buildResult() });
    this.setState('ended');
  }

  buildResult() {
    const s = this.stats;
    const duration = this.game.duration;
    if (this.mode.kind === 'tracking') {
      return {
        game: this.modeId,
        score: Math.round(s.score),
        data: {
          onTargetPct: Math.round((s.onTargetMs / (duration * 1000)) * 1000) / 10,
          longestTrackMs: Math.round(s.longestTrack),
          duration,
        },
        timeline: s.timeline.map((ms) => Math.min(100, Math.round(ms / 10))),
      };
    }
    const avg = s.killTimes.length ? s.killTimes.reduce((a, b) => a + b, 0) / s.killTimes.length : 0;
    return {
      game: this.modeId,
      score: Math.round(s.score),
      data: {
        hits: s.hits,
        shots: s.shots,
        misses: s.shots - s.hits,
        accuracy: s.shots ? Math.round((s.hits / s.shots) * 1000) / 10 : 0,
        bestStreak: s.bestStreak,
        avgKillMs: Math.round(avg),
        kps: Math.round((s.hits / duration) * 100) / 100,
        duration,
      },
      timeline: s.timeline,
    };
  }

  withLock(onLocked) {
    if (this.cursorMode || this.lockSupported === false || !this.canvas.requestPointerLock) {
      this.enterCursorMode();
      onLocked();
      return;
    }
    if (document.pointerLockElement === this.canvas) {
      onLocked();
      return;
    }
    this.pendingLock = onLocked;
    // Some embedded browsers neither grant nor reject the request; don't leave the player waiting.
    clearTimeout(this.lockTimer);
    this.lockTimer = setTimeout(() => this.lockFailed(new Error('request timed out')), 1500);
    const request = (opts) => {
      try {
        return this.canvas.requestPointerLock(opts);
      } catch (err) {
        return Promise.reject(err);
      }
    };
    const p = request({ unadjustedMovement: true });
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        // Raw input isn't available everywhere; fall back to standard pointer lock.
        if (err?.name === 'NotSupportedError') {
          const p2 = request();
          if (p2 && typeof p2.catch === 'function') p2.catch((e) => this.lockFailed(e));
        } else {
          this.lockFailed(err);
        }
      });
    }
  }

  lockFailed(err) {
    clearTimeout(this.lockTimer);
    if (!this.pendingLock) return;
    const cb = this.pendingLock;
    this.pendingLock = null;
    if (this.lockSupported) {
      // Lock worked before, so this is the browser's cooldown after Esc. Ask for another click.
      this.emit({ type: 'lockError', message: 'Click again to recapture the mouse.' });
      return;
    }
    // Pointer lock unavailable (embedded frame, unsupported browser): play with a free cursor.
    this.lockSupported = false;
    if (err) console.info('[arena] pointer lock unavailable:', err.message);
    this.emit({ type: 'lockError', message: 'Mouse capture isn’t available in this browser, so you aim with the cursor.' });
    this.enterCursorMode();
    cb();
  }

  enterCursorMode() {
    if (!this.cursorMode) {
      this.cursorMode = true;
    }
    this.pointer.set(0, 0);
    this.emit({ type: 'input', cursor: true });
  }

  emit(event) {
    this.onEvent(event);
  }

  emitHud(force = false) {
    const now = performance.now();
    if (!force && now - this.lastHud < HUD_INTERVAL) return;
    this.lastHud = now;
    const s = this.stats;
    this.onHud({
      state: this.state,
      score: Math.round(s.score),
      timeLeft: Math.max(0, this.game.duration - this.elapsed),
      progress: Math.min(1, this.elapsed / this.game.duration),
      countdown: this.state === 'countdown' ? Math.ceil(this.countdown) : 0,
      hits: s.hits,
      shots: s.shots,
      accuracy: s.shots ? (s.hits / s.shots) * 100 : 100,
      streak: s.streak,
      onTargetPct: this.elapsed > 0 ? (s.onTargetMs / (this.elapsed * 1000)) * 100 : 0,
      onTarget: s.onTarget,
    });
  }

  // ---------------------------------------------------------------- loop

  /**
   * Queues the next frame. Normally that's requestAnimationFrame (paced by the monitor). When the
   * desktop app has VSync off *and* a frame limit is set, frames are paced with timers instead:
   * Chromium slows its frame callbacks right down whenever one skips drawing, which would make
   * the limiter undershoot badly.
   */
  scheduleFrame() {
    if (this.disposed) return;
    if (this.uncapped && this.settings.fpsLimit > 0) {
      const wait = this.nextFrameAt - performance.now();
      // Sleep coarsely, then finish with an unclamped message-channel hop for precision.
      if (wait > 4) this.timer = setTimeout(this.frame, wait - 3);
      else this.channel.port2.postMessage(0);
    } else {
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  frame = () => {
    // Read the clock directly: with VSync off, the timestamp passed to requestAnimationFrame
    // isn't precise enough to pace frames by.
    const now = performance.now();
    // Frame rate limit: skip this screen refresh if the next frame isn't due yet. The schedule
    // advances by a fixed step, so the average lands on the limit even when it doesn't divide
    // evenly into the monitor's refresh rate (e.g. 60 FPS on a 144 Hz screen).
    const limit = this.settings.fpsLimit;
    if (limit > 0) {
      if (now < this.nextFrameAt - (this.uncapped ? 0.1 : 1)) {
        this.scheduleFrame();
        return;
      }
      this.nextFrameAt = Math.max(this.nextFrameAt + 1000 / limit, now);
    }
    this.scheduleFrame();
    this.trackPerf(now);
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.time += dt;

    if (this.state === 'countdown') {
      this.countdown -= dt;
      const tick = Math.ceil(this.countdown);
      if (tick < this.lastTick && tick > 0) {
        this.lastTick = tick;
        sound.beep(660, 0.08, { gain: 0.18 });
      }
      if (this.countdown <= 0) this.startPlaying();
    } else if (this.state === 'playing') {
      this.elapsed += dt;
      this.mode.update?.(dt);
      if (this.elapsed >= this.game.duration) this.end();
    } else if (this.state === 'idle') {
      this.mode.update?.(dt);
      // Gentle camera drift keeps the menu backdrop alive.
      this.camera.rotation.set(START_PITCH * DEG + Math.sin(this.time * 0.13) * 0.02, Math.sin(this.time * 0.21) * 0.07, 0);
    }

    if (this.mode.kind === 'tracking') this.updateTracking(dt);

    for (const t of this.targets) {
      if (t.age < 1) {
        t.age = Math.min(1, t.age + dt / 0.09);
        const e = 1 - Math.pow(1 - t.age, 3);
        t.mesh.scale.setScalar(t.radius * (0.2 + 0.8 * e));
      }
    }
    this.bursts.update(dt);
    this.impacts.update(dt);
    this.weapon.update(dt, this.time);

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    if (this.settings.showWeapon && this.state !== 'idle' && this.state !== 'ended') {
      this.renderer.clearDepth();
      this.renderer.render(this.weapon.scene, this.weapon.camera);
    }
    if (this.state === 'playing' || this.state === 'countdown') this.emitHud();
  };

  /** Counts rendered frames and reports FPS and average frame time twice a second. */
  trackPerf(now) {
    this.perfFrames = (this.perfFrames || 0) + 1;
    if (!this.perfStart) this.perfStart = now;
    const span = now - this.perfStart;
    if (span >= 500) {
      this.emit({ type: 'perf', fps: Math.round((this.perfFrames * 1000) / span), frameMs: Math.round((span / this.perfFrames) * 10) / 10 });
      this.perfFrames = 0;
      this.perfStart = now;
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.timer);
    this.channel.port1.close();
    clearTimeout(this.lockTimer);
    this.resizeObserver.disconnect();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    document.removeEventListener('pointerlockerror', this.onLockError);
    document.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('blur', this.onBlur);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();

    const disposeScene = (scene) =>
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of mats) {
          m.map?.dispose();
          m.dispose();
        }
      });
    disposeScene(this.scene);
    disposeScene(this.weapon.scene);
    this.targetGeo.dispose();
    this.targetMat.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
