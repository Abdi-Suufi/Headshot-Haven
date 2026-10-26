import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Ambient 3D backdrop for the landing page: a receding grid floor with floating targets that
// pop and respawn, plus gentle mouse parallax. Renders a single still frame for reduced motion.

export default function HeroScene() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return undefined; // no WebGL: the CSS gradient behind stays visible
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07080b, 14, 46);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 2.4, 8);

    const grid = new THREE.GridHelper(120, 80, 0xff6b35, 0x2a2f3b);
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    scene.add(grid);

    scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x101218, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(4, 8, 6);
    scene.add(key);

    const geo = new THREE.SphereGeometry(1, 32, 20);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff6b35, emissive: 0xff6b35, emissiveIntensity: 0.55, roughness: 0.3 });
    const ringGeo = new THREE.RingGeometry(0.9, 1, 48);
    const targets = Array.from({ length: 9 }, () => {
      const mesh = new THREE.Mesh(geo, mat);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      );
      scene.add(mesh, ring);
      return { mesh, ring, base: new THREE.Vector3(), phase: 0, life: 0, ttl: 0, pop: -1, size: 0 };
    });

    const respawn = (t, initial = false) => {
      t.base.set((Math.random() - 0.5) * 22, 1 + Math.random() * 5, -4 - Math.random() * 22);
      t.phase = Math.random() * Math.PI * 2;
      t.size = 0.35 + Math.random() * 0.35;
      t.ttl = 3 + Math.random() * 5;
      t.life = initial ? Math.random() * t.ttl : 0;
      t.pop = -1;
      t.ring.material.opacity = 0;
    };
    targets.forEach((t) => respawn(t, true));

    const mouse = new THREE.Vector2();
    const onMove = (e) => {
      mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let raf = 0;
    let last = performance.now();
    let time = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(host);

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      time += dt;

      grid.position.z = (time * 1.2) % 1.5;
      camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (2.4 - mouse.y * 0.6 - camera.position.y) * 0.04;
      camera.lookAt(0, 2.2, -10);

      for (const t of targets) {
        if (t.pop >= 0) {
          // Popping: shrink the sphere, expand the ring.
          t.pop += dt / 0.35;
          const k = Math.min(1, t.pop);
          t.mesh.scale.setScalar(t.size * (1 - k));
          t.ring.scale.setScalar(t.size * (1 + k * 2));
          t.ring.material.opacity = 1 - k;
          t.ring.lookAt(camera.position);
          if (k >= 1) respawn(t);
          continue;
        }
        t.life += dt;
        const grow = Math.min(1, t.life / 0.3);
        t.mesh.position.set(t.base.x + Math.sin(time * 0.6 + t.phase) * 0.6, t.base.y + Math.sin(time * 0.9 + t.phase) * 0.3, t.base.z);
        t.mesh.scale.setScalar(t.size * (1 - Math.pow(1 - grow, 3)));
        if (t.life > t.ttl) {
          t.pop = 0;
          t.ring.position.copy(t.mesh.position);
        }
      }
      renderer.render(scene, camera);
      if (reduced) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="hero-scene" ref={hostRef} aria-hidden="true" />;
}
