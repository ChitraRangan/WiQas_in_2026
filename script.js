const menuBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

const current = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const target = a.getAttribute('href');
  if (target === current) a.classList.add('active');
});

document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());


// Interactive quantum galaxy used in the home-page hero.
(() => {
  const card = document.getElementById('quantumGalaxy');
  if (!card) return;

  const canvas = card.querySelector('.quantum-canvas');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let filaments = [];
  let raf = 0;
  let last = performance.now();
  let spin = 0;
  let burst = 0;
  let settledFrames = 0;

  const pointer = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    active: false,
    strength: 0
  };

  const palettes = [
    [112, 232, 255],
    [151, 172, 255],
    [184, 146, 255],
    [255, 255, 255],
    [111, 207, 255]
  ];

  function gaussianish() {
    return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  }

  function rebuildParticles() {
    const area = width * height;
    const count = Math.max(150, Math.min(285, Math.round(area / 560)));
    const arms = 5;
    particles = Array.from({ length: count }, (_, i) => {
      const t = Math.pow(Math.random(), 0.72);
      const arm = i % arms;
      const theta = arm * (Math.PI * 2 / arms) + t * 8.6 + gaussianish() * (0.18 + t * 0.5);
      const radius = 0.035 + t * 0.49;
      return {
        radius,
        theta,
        z: gaussianish() * (0.28 + 0.36 * t),
        size: 0.52 + Math.random() * (Math.random() < 0.1 ? 2.1 : 1.25),
        alpha: 0.25 + Math.random() * 0.72,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.55 + Math.random() * 1.4,
        color: palettes[Math.floor(Math.random() * palettes.length)]
      };
    });

    filaments = Array.from({ length: 5 }, (_, arm) => ({
      arm,
      phase: arm * (Math.PI * 2 / 5)
    }));
  }

  function resize() {
    const rect = card.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildParticles();
    draw(performance.now());
  }

  function fieldTransform(px, py, z, now, radiusNorm) {
    const minDim = Math.min(width, height);
    const cx = width * 0.50;
    const cy = height * 0.46;
    const nx = pointer.x;
    const ny = pointer.y;

    // Pseudo-3D parallax: foreground and background particles move in opposite directions.
    let x = cx + px + nx * z * minDim * 0.16;
    let y = cy + py + ny * z * minDim * 0.11;

    if (pointer.strength > 0.001) {
      const mx = cx + pointer.x * width * 0.38;
      const my = cy + pointer.y * height * 0.38;
      const dx = mx - x;
      const dy = my - y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const radius = minDim * 0.36;
      const influence = Math.exp(-(dist * dist) / (radius * radius)) * pointer.strength;

      // Gravitational attraction plus a tangential swirl around the cursor.
      const attract = (8 + 19 * radiusNorm) * influence;
      const swirl = (10 + 26 * radiusNorm) * influence;
      x += (dx / dist) * attract + (-dy / dist) * swirl;
      y += (dy / dist) * attract + ( dx / dist) * swirl;
    }

    // A click/tap emits a short radial pulse through the disk.
    if (burst > 0.001) {
      const wave = Math.sin(radiusNorm * 25 - now * 0.012) * burst;
      const scale = 1 + wave * 0.055;
      x = cx + (x - cx) * scale;
      y = cy + (y - cy) * scale;
    }

    return [x, y];
  }

  function drawFilaments(now) {
    const minDim = Math.min(width, height);
    const cx = width * 0.50;
    const cy = height * 0.46;
    const flatten = 0.47 + pointer.y * 0.045;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.7;

    filaments.forEach((f, idx) => {
      ctx.beginPath();
      for (let k = 0; k <= 62; k++) {
        const t = k / 62;
        const r = (0.04 + t * 0.48) * minDim;
        const a = f.phase + t * 8.6 + spin;
        const baseX = Math.cos(a) * r;
        const baseY = Math.sin(a) * r * flatten;
        const z = Math.sin(a * 1.7 + idx) * 0.22;
        const p = fieldTransform(baseX, baseY, z, now, t);
        if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      const alpha = 0.075 + idx * 0.008;
      ctx.strokeStyle = `rgba(100, 207, 255, ${alpha})`;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawCore(now) {
    const cx = width * 0.50 + pointer.x * 5;
    const cy = height * 0.46 + pointer.y * 4;
    const minDim = Math.min(width, height);
    const pulse = 1 + Math.sin(now * 0.0024) * 0.035 + burst * 0.08;
    const r = minDim * 0.105 * pulse;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.8);
    halo.addColorStop(0, 'rgba(235,252,255,.98)');
    halo.addColorStop(.08, 'rgba(104,232,255,.95)');
    halo.addColorStop(.32, 'rgba(92,104,244,.60)');
    halo.addColorStop(.66, 'rgba(116,77,224,.17)');
    halo.addColorStop(1, 'rgba(50,36,126,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.8, 0, Math.PI * 2);
    ctx.fill();

    const nucleus = ctx.createRadialGradient(cx - r * .22, cy - r * .22, r * .06, cx, cy, r);
    nucleus.addColorStop(0, 'rgba(255,255,255,1)');
    nucleus.addColorStop(.18, 'rgba(118,240,255,1)');
    nucleus.addColorStop(.55, 'rgba(99,91,239,.92)');
    nucleus.addColorStop(1, 'rgba(31,25,95,.15)');
    ctx.fillStyle = nucleus;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Thin accretion ring responds to pointer tilt.
    ctx.translate(cx, cy);
    ctx.rotate(pointer.x * .16);
    ctx.scale(1, .30 + pointer.y * .03);
    ctx.strokeStyle = `rgba(151, 231, 255, ${0.42 + burst * .25})`;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 2.12, r * 2.12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPointerField() {
    if (pointer.strength <= 0.01) return;
    const cx = width * 0.50;
    const cy = height * 0.46;
    const mx = cx + pointer.x * width * 0.38;
    const my = cy + pointer.y * height * 0.38;
    const rad = Math.min(width, height) * .23;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const lens = ctx.createRadialGradient(mx, my, 0, mx, my, rad);
    lens.addColorStop(0, `rgba(119, 231, 255, ${0.13 * pointer.strength})`);
    lens.addColorStop(.45, `rgba(113, 122, 255, ${0.055 * pointer.strength})`);
    lens.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(mx, my, rad, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(181, 243, 255, ${0.18 * pointer.strength})`;
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.arc(mx, my, 13 + pointer.strength * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function draw(now) {
    ctx.clearRect(0, 0, width, height);

    const minDim = Math.min(width, height);
    const flatten = 0.47 + pointer.y * 0.045;
    const tilt = pointer.x * 0.12;

    drawPointerField();
    drawFilaments(now);

    // Back-to-front sorting improves the 3D impression.
    const ordered = particles.slice().sort((a, b) => a.z - b.z);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of ordered) {
      const a = p.theta + spin + p.z * tilt;
      const r = p.radius * minDim;
      const x0 = Math.cos(a) * r;
      const y0 = Math.sin(a) * r * flatten;
      const [x, y] = fieldTransform(x0, y0, p.z, now, p.radius / .52);
      const shimmer = .76 + .24 * Math.sin(now * .001 * p.twinkleSpeed + p.twinkle);
      const depth = .76 + (p.z + .7) * .23;
      const alpha = Math.max(.08, Math.min(1, p.alpha * shimmer * depth));
      const radius = Math.max(.35, p.size * (0.88 + p.z * .23));
      const [rr, gg, bb] = p.color;

      ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (p.size > 1.8) {
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${alpha * .24})`;
        ctx.lineWidth = .6;
        ctx.beginPath();
        ctx.moveTo(x - radius * 3.5, y);
        ctx.lineTo(x + radius * 3.5, y);
        ctx.moveTo(x, y - radius * 3.5);
        ctx.lineTo(x, y + radius * 3.5);
        ctx.stroke();
      }
    }
    ctx.restore();

    drawCore(now);
  }

  function animate(now) {
    const dt = Math.min(40, now - last);
    last = now;

    pointer.x += (pointer.tx - pointer.x) * 0.075;
    pointer.y += (pointer.ty - pointer.y) * 0.075;
    const targetStrength = pointer.active ? 1 : 0;
    pointer.strength += (targetStrength - pointer.strength) * 0.075;
    burst *= Math.pow(0.965, dt / 16.67);

    if (!reduceMotion) spin += dt * 0.000065;
    draw(now);

    const moving = pointer.active || pointer.strength > .004 || burst > .004;
    if (reduceMotion && !moving) {
      settledFrames += 1;
      if (settledFrames > 6) {
        raf = 0;
        return;
      }
    } else {
      settledFrames = 0;
    }
    raf = requestAnimationFrame(animate);
  }

  function ensureAnimation() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(animate);
    }
  }

  function updatePointer(event) {
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / Math.max(1, rect.width);
    const py = (event.clientY - rect.top) / Math.max(1, rect.height);
    pointer.tx = Math.max(-1, Math.min(1, (px - .5) * 2));
    pointer.ty = Math.max(-1, Math.min(1, (py - .5) * 2));
    pointer.active = true;
    card.classList.add('is-active', 'has-interacted');
    ensureAnimation();
  }

  card.addEventListener('pointerenter', updatePointer);
  card.addEventListener('pointermove', updatePointer);
  card.addEventListener('pointerleave', () => {
    pointer.active = false;
    pointer.tx = 0;
    pointer.ty = 0;
    card.classList.remove('is-active');
    ensureAnimation();
  });
  card.addEventListener('pointerdown', event => {
    updatePointer(event);
    burst = 1;
    card.classList.add('has-interacted');
    ensureAnimation();
  });

  const observer = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (observer) observer.observe(card);
  else window.addEventListener('resize', resize, { passive: true });

  resize();
  ensureAnimation();
})();
