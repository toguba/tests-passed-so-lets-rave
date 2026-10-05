(() => {
  'use strict';

  // ---------------------------------------------------------------- config
  const DEFAULTS = {
    palette: 'rainbow',
    strobe: true,
    speed: 1,
    density: 1,
  };
  const cfg = Object.assign({}, DEFAULTS, window.STAGE_CONFIG || {});
  const params = new URLSearchParams(location.search);
  for (const [key, raw] of params) {
    if (!(key in DEFAULTS)) continue;
    if (key === 'strobe') cfg[key] = !/^(0|false|no|off)$/i.test(raw);
    else if (key === 'palette') cfg[key] = raw;
    else { const n = parseFloat(raw); if (Number.isFinite(n)) cfg[key] = n; }
  }
  cfg.speed = Math.max(0, cfg.speed);
  cfg.density = Math.max(0, cfg.density);
  const GREEN = String(cfg.palette).toLowerCase() === 'green';

  // Map a phase (in turns) to a hue on the active palette.
  const hue = GREEN
    ? x => 128 + 34 * Math.sin(x * Math.PI * 2)
    : x => ((x * 360) % 360 + 360) % 360;

  // Click or F = fullscreen, hide cursor when idle.
  document.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'f' || e.key === 'F') document.body.click();
  });
  let idleTimer;
  const wake = () => {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), 1500);
  };
  document.addEventListener('mousemove', wake);
  wake();

  // ---------------------------------------------------------------- canvases
  const display = document.getElementById('stage');
  const dctx = display.getContext('2d');
  const scene = document.createElement('canvas');
  const ctx = scene.getContext('2d');
  const bloom = document.createElement('canvas');
  const bctx = bloom.getContext('2d');
  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    for (const c of [display, scene]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    bloom.width = Math.ceil(W / 4); bloom.height = Math.ceil(H / 4);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020408'; ctx.fillRect(0, 0, W, H);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------- icon sprites
  // Testing iconography, drawn in a [-1, 1] box.
  let LW = 1;
  const ICONS = {
    check(c) {
      c.lineWidth = 0.26 * LW; c.beginPath();
      c.moveTo(-0.62, 0.02); c.lineTo(-0.2, 0.44); c.lineTo(0.66, -0.46); c.stroke();
    },
    circle(c) {
      c.lineWidth = 0.13 * LW; c.beginPath(); c.arc(0, 0, 0.82, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 0.18 * LW; c.beginPath();
      c.moveTo(-0.4, 0.02); c.lineTo(-0.12, 0.3); c.lineTo(0.42, -0.28); c.stroke();
    },
    shield(c) {
      c.lineWidth = 0.11 * LW; c.beginPath();
      c.moveTo(0, -0.88); c.lineTo(0.72, -0.6); c.quadraticCurveTo(0.72, 0.45, 0, 0.9);
      c.quadraticCurveTo(-0.72, 0.45, -0.72, -0.6); c.closePath(); c.stroke();
      c.lineWidth = 0.16 * LW; c.beginPath();
      c.moveTo(-0.32, 0.0); c.lineTo(-0.08, 0.24); c.lineTo(0.36, -0.26); c.stroke();
    },
    flask(c) {
      c.lineWidth = 0.1 * LW; c.beginPath();
      c.moveTo(-0.3, -0.85); c.lineTo(0.3, -0.85);
      c.moveTo(-0.18, -0.85); c.lineTo(-0.18, -0.25); c.lineTo(-0.68, 0.78); c.lineTo(0.68, 0.78);
      c.lineTo(0.18, -0.25); c.lineTo(0.18, -0.85); c.stroke();
      c.globalAlpha = 0.55; c.beginPath();
      c.moveTo(-0.43, 0.26); c.lineTo(0.43, 0.26); c.lineTo(0.68, 0.78); c.lineTo(-0.68, 0.78); c.closePath(); c.fill();
      c.globalAlpha = 1; c.beginPath(); c.arc(0.05, 0.05, 0.07, 0, 7); c.arc(-0.12, -0.08, 0.05, 0, 7); c.fill();
    },
    bug(c) { // zero bugs: a bug with a strike-through
      c.lineWidth = 0.09 * LW; c.beginPath(); c.ellipse(0, 0.12, 0.34, 0.5, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(0, -0.48, 0.18, 0, Math.PI * 2); c.stroke();
      c.beginPath();
      for (const y of [-0.1, 0.15, 0.4]) { c.moveTo(-0.34, y); c.lineTo(-0.66, y - 0.12); c.moveTo(0.34, y); c.lineTo(0.66, y - 0.12); }
      c.moveTo(0, -0.38); c.lineTo(0, 0.62); c.stroke();
      c.lineWidth = 0.14 * LW; c.beginPath(); c.moveTo(-0.8, 0.8); c.lineTo(0.8, -0.8); c.stroke();
    },
    pass(c) {
      c.lineWidth = 0.09 * LW;
      c.beginPath(); c.roundRect ? c.roundRect(-0.92, -0.42, 1.84, 0.84, 0.2) : c.rect(-0.92, -0.42, 1.84, 0.84); c.stroke();
      c.save(); c.scale(0.01, 0.01);
      c.font = '900 50px "Arial Black", Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('PASS', 0, 3); c.restore();
    },
    dot(c) {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 0.6);
      g.addColorStop(0, '#fff'); g.addColorStop(0.3, c.fillStyle); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 0.6, 0, Math.PI * 2); c.fill();
    },
  };
  // Checkmarks are weighted to dominate.
  const POOL = ['check', 'check', 'check', 'check', 'circle', 'circle', 'shield', 'pass', 'flask', 'bug', 'dot', 'dot'];
  const HUE_STEPS = 12, SPRITE = 128;
  const sprites = {};
  for (const name of Object.keys(ICONS)) {
    sprites[name] = [];
    for (let k = 0; k < HUE_STEPS; k++) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = SPRITE;
      const c = cv.getContext('2d');
      const col = `hsl(${hue(k / HUE_STEPS)}, 100%, 62%)`;
      c.translate(SPRITE / 2, SPRITE / 2);
      c.scale(SPRITE * 0.3, SPRITE * 0.3);
      c.strokeStyle = c.fillStyle = col;
      c.lineCap = c.lineJoin = 'round';
      c.shadowColor = col; c.shadowBlur = 18;
      ICONS[name](c);
      // white-hot core pass
      c.shadowBlur = 0; c.globalAlpha = 0.6; c.strokeStyle = c.fillStyle = '#fff';
      if (name !== 'dot') { LW = 0.35; ICONS[name](c); LW = 1; }
      sprites[name].push(cv);
    }
  }
  const pick = a => a[(Math.random() * a.length) | 0];
  const randSprite = () => sprites[pick(POOL)][(Math.random() * HUE_STEPS) | 0];
  const checkSprite = () => sprites[Math.random() < 0.75 ? 'check' : 'circle'][(Math.random() * HUE_STEPS) | 0];

  // ---------------------------------------------------------------- tunnel particles
  const FAR = 22;
  const tunnel = [];
  function spawnTunnel(p, anywhere) {
    const a = Math.random() * Math.PI * 2, r = 0.7 + Math.random() * 3.2;
    p.x = Math.cos(a) * r; p.y = Math.sin(a) * r;
    p.z = anywhere ? 0.4 + Math.random() * FAR : FAR;
    p.spr = randSprite(); p.rot = Math.random() * 6.28; p.spin = (Math.random() - 0.5) * 3;
    return p;
  }
  for (let i = 0; i < Math.round(240 * cfg.density); i++) tunnel.push(spawnTunnel({}, true));

  // ---------------------------------------------------------------- confetti / sparks
  const confetti = [];
  function burst(x, y, n, power = 1) {
    n = Math.round(n * cfg.density);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (150 + Math.random() * 650) * power;
      confetti.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200 * power,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 12,
        life: 0, max: 1.6 + Math.random() * 1.8,
        size: 14 + Math.random() * 30, spr: Math.random() < 0.8 ? checkSprite() : randSprite(),
      });
    }
  }
  const sparks = [];
  function sparkle(n) {
    for (let i = 0; i < n * cfg.density; i++) {
      sparks.push({ x: Math.random() * W, y: Math.random() * H, life: 0, max: 0.4 + Math.random() * 0.8,
        r: 1 + Math.random() * 2.5, h: hue(Math.random()) });
    }
  }

  // ---------------------------------------------------------------- rings
  const rings = [];

  // ---------------------------------------------------------------- draw helpers
  function drawBackdrop(t, cx, cy) {
    const R = Math.max(W, H);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.6);
    g.addColorStop(0, `hsla(${hue(t * 0.05)}, 100%, 45%, 0.16)`);
    g.addColorStop(0.5, `hsla(${hue(t * 0.05 + 0.3)}, 100%, 30%, 0.05)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // rotating god rays
    const N = 18, a0 = t * 0.12;
    for (let i = 0; i < N; i++) {
      const a = a0 + (i / N) * Math.PI * 2, w = 0.055;
      ctx.fillStyle = `hsla(${hue(i / N + t * 0.04)}, 100%, 55%, ${i % 2 ? 0.035 : 0.07})`;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R);
      ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R);
      ctx.closePath(); ctx.fill();
    }
  }

  function drawGrid(t, cx, horizon) {
    const F = H * 0.55, Z = 34;
    const scroll = (t * 3.2) % 1;
    ctx.lineWidth = 1.5;
    for (const side of [1, -1]) {
      const mul = side === 1 ? 1 : 0.4;
      for (let i = 0; i < Z; i++) {
        const z = 0.3 + i - scroll;
        if (z <= 0.3) continue;
        const y = horizon + side * F / z;
        const a = (1 - z / Z) * Math.min(1, 3 / z) * mul;
        ctx.strokeStyle = `hsla(${hue(z * 0.035 - t * 0.08)}, 100%, 58%, ${a})`;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let xw = -24; xw <= 24; xw += 1.6) {
        ctx.strokeStyle = `hsla(${hue(xw * 0.02 + t * 0.06)}, 100%, 58%, ${0.55 * mul})`;
        ctx.beginPath();
        ctx.moveTo(cx + xw * F / 0.3, horizon + side * F / 0.3);
        ctx.lineTo(cx + xw * F / Z, horizon + side * F / Z);
        ctx.stroke();
      }
    }
  }

  function drawLasers(t) {
    const L = Math.hypot(W, H) * 1.1;
    const emitters = [
      [0.04, 1.02, 0.9, 0], [0.3, 1.02, 1.3, 1.7], [0.7, 1.02, 1.1, 3.1], [0.96, 1.02, 0.7, 4.4],
      [0.0, -0.02, 0.8, 2.2], [1.0, -0.02, 1.0, 5.3],
    ];
    ctx.lineCap = 'round';
    emitters.forEach(([ex, ey, w, ph], i) => {
      const x = ex * W, y = ey * H;
      const base = ey > 0.5 ? -Math.PI / 2 : Math.PI / 2;
      const a = base + Math.sin(t * w + ph) * 0.75;
      const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
      const h = hue(t * 0.1 + i / emitters.length);
      const g = ctx.createLinearGradient(x, y, x2, y2);
      g.addColorStop(0, `hsla(${h}, 100%, 70%, 0.95)`);
      g.addColorStop(1, `hsla(${h}, 100%, 50%, 0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 9; ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.lineWidth = 2.2; ctx.globalAlpha = 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function drawTunnel(t, dt, cx, cy) {
    const F = Math.min(W, H) * 0.55;
    const ang = t * 0.15, ca = Math.cos(ang), sa = Math.sin(ang);
    const v = 5.5 * dt;
    for (const p of tunnel) {
      p.z -= v; p.rot += p.spin * dt;
      if (p.z < 0.35) spawnTunnel(p, false);
    }
    tunnel.sort((a, b) => b.z - a.z);
    for (const p of tunnel) {
      const x = p.x * ca - p.y * sa, y = p.x * sa + p.y * ca;
      const sx = cx + (x / p.z) * F, sy = cy + (y / p.z) * F;
      const size = Math.min(220, (0.55 / p.z) * F);
      if (sx < -size || sx > W + size || sy < -size || sy > H + size) continue;
      ctx.globalAlpha = Math.min(1, (FAR - p.z) / 5) * Math.min(1, p.z / 1.2);
      const c = Math.cos(p.rot) * dpr, s = Math.sin(p.rot) * dpr;
      ctx.setTransform(c, s, -s, c, sx * dpr, sy * dpr);
      ctx.drawImage(p.spr, -size / 2, -size / 2, size, size);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
  }

  function drawRings(t, dt, cx, cy, S) {
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.age += dt;
      if (r.age > 2.4) { rings.splice(i, 1); continue; }
      const k = r.age / 2.4;
      ctx.strokeStyle = `hsla(${r.h}, 100%, 60%, ${(1 - k) * 0.9})`;
      ctx.lineWidth = 2 + (1 - k) * 8;
      ctx.beginPath();
      if (r.hex) {
        for (let j = 0; j <= 6; j++) {
          const a = j * Math.PI / 3 + r.spin + t * 0.5, rad = S * 0.75 + k * Math.max(W, H) * 0.7;
          ctx[j ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
      } else {
        ctx.arc(cx, cy, S * 0.75 + k * Math.max(W, H) * 0.7, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  }

  // The hero: an extruded 3D checkmark built from stacked glowing slices.
  const CHECK = [[-0.58, -0.02], [-0.16, 0.4], [0.62, -0.48]];
  function drawHeroCheck(t, cx, cy, S, flip) {
    const ry = Math.sin(t * 0.7) * 0.75 + flip * Math.PI * 2;
    const rx = Math.sin(t * 0.53) * 0.35;
    const cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);
    const scale = S * (1 + 0.05 * Math.sin(t * 4.2));
    const DEPTH = 0.22, SLICES = 16, CAM = 3.2;
    const slices = [];
    for (let i = 0; i < SLICES; i++) {
      const z0 = -DEPTH + (2 * DEPTH * i) / (SLICES - 1);
      let zsum = 0;
      const pts = CHECK.map(([x, y]) => {
        const x1 = x * cY - z0 * sY, z1 = x * sY + z0 * cY;
        const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
        zsum += z2;
        const p = CAM / (CAM + z2);
        return [cx + x1 * scale * p, cy + y2 * scale * p, p];
      });
      slices.push({ pts, z: zsum / 3, front: i === 0 || i === SLICES - 1 });
    }
    slices.sort((a, b) => b.z - a.z);

    // halo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.3);
    halo.addColorStop(0, `hsla(${hue(t * 0.08)}, 100%, 60%, 0.35)`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo; ctx.fillRect(cx - scale * 1.5, cy - scale * 1.5, scale * 3, scale * 3);

    ctx.lineCap = ctx.lineJoin = 'round';
    slices.forEach((s, idx) => {
      const k = idx / (slices.length - 1); // 0 = farthest, 1 = nearest
      const h = hue(t * 0.08 + k * 0.25);
      const p = s.pts[1][2];
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `hsl(${h}, 100%, ${18 + k * 38}%)`;
      ctx.lineWidth = 0.24 * scale * p;
      ctx.beginPath();
      ctx.moveTo(s.pts[0][0], s.pts[0][1]); ctx.lineTo(s.pts[1][0], s.pts[1][1]); ctx.lineTo(s.pts[2][0], s.pts[2][1]);
      ctx.stroke();
      if (s.front) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `hsla(${h}, 100%, 75%, 0.9)`;
        ctx.lineWidth = 0.13 * scale * p;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 0.045 * scale * p;
        ctx.stroke();
      }
    });
    ctx.globalCompositeOperation = 'lighter';
  }

  function drawConfetti(dt) {
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.life += dt;
      if (p.life > p.max) { confetti.splice(i, 1); continue; }
      p.vy += 520 * dt; p.vx *= 1 - 1.2 * dt; p.vy *= 1 - 0.6 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const c = Math.cos(p.rot) * dpr, s = Math.sin(p.rot) * dpr;
      ctx.globalAlpha = Math.min(1, (p.max - p.life) * 2);
      ctx.setTransform(c, s, -s, c, p.x * dpr, p.y * dpr);
      ctx.drawImage(p.spr, -p.size / 2, -p.size / 2, p.size, p.size);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
  }

  function drawSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life > s.max) { sparks.splice(i, 1); continue; }
      const a = Math.sin((s.life / s.max) * Math.PI);
      ctx.fillStyle = `hsla(${s.h}, 100%, 80%, ${a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1 + a), 0, 7); ctx.fill();
      ctx.fillRect(s.x - s.r * 6 * a, s.y - 0.5, s.r * 12 * a, 1);
      ctx.fillRect(s.x - 0.5, s.y - s.r * 6 * a, 1, s.r * 12 * a);
    }
  }

  // ---------------------------------------------------------------- main loop
  const FLIP_EVERY = 6.5, FLIP_LEN = 1.3;
  const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let t = 0, last = performance.now();
  let nextRing = 0, nextBurst = 1.2, nextStrobe = 4 + Math.random() * 4, lastFlipIndex = 0;
  let strobeLeft = 0;
  let started = false;

  function frame(now) {
    const realDt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const dt = realDt * cfg.speed;
    t += dt;

    const cx = W / 2, cy = H / 2;
    const S = Math.min(W, H) * 0.26;

    if (!started) { started = true; burst(cx, cy, 160, 1.3); }

    // events (all on a fixed clock, independent of any music)
    if (t >= nextRing) { rings.push({ age: 0, h: hue(t * 0.1), hex: Math.random() < 0.35, spin: Math.random() * 6 }); nextRing = t + 0.55; }
    if (t >= nextBurst) {
      burst(W * (0.15 + Math.random() * 0.7), H * (0.2 + Math.random() * 0.5), 34, 0.7);
      nextBurst = t + 1 + Math.random() * 1.6;
    }
    const flipIndex = Math.floor(t / FLIP_EVERY);
    const phase = t - flipIndex * FLIP_EVERY;
    const flip = phase < FLIP_LEN && flipIndex > 0 ? ease(phase / FLIP_LEN) : 0;
    if (flipIndex !== lastFlipIndex && phase >= FLIP_LEN) {
      lastFlipIndex = flipIndex;
      burst(cx, cy, 90, 1.1);
      if (cfg.strobe) strobeLeft = 0.25;
    }
    if (cfg.strobe && t >= nextStrobe) { strobeLeft = 0.3; nextStrobe = t + 5 + Math.random() * 5; }
    sparkle(dt * 40);

    // scene: fade previous frame for motion trails
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 4, 8, 0.38)';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    drawBackdrop(t, cx, cy);
    drawGrid(t, cx, cy);
    drawLasers(t);
    drawTunnel(t, dt, cx, cy);
    drawRings(t, dt, cx, cy, S);
    drawHeroCheck(t, cx, cy + Math.sin(t * 2.1) * S * 0.04, S, flip);
    drawConfetti(dt);
    drawSparks(dt);
    ctx.globalCompositeOperation = 'source-over';

    // composite: scene + blurred bloom
    bctx.clearRect(0, 0, bloom.width, bloom.height);
    bctx.filter = 'blur(5px)';
    bctx.drawImage(scene, 0, 0, bloom.width, bloom.height);
    bctx.filter = 'none';
    dctx.globalCompositeOperation = 'source-over';
    dctx.globalAlpha = 1;
    dctx.drawImage(scene, 0, 0, W, H);
    dctx.globalCompositeOperation = 'lighter';
    dctx.globalAlpha = 0.85;
    dctx.drawImage(bloom, 0, 0, W, H);

    // strobe: a few soft pulses
    if (strobeLeft > 0) {
      strobeLeft -= realDt;
      if (Math.floor(strobeLeft / 0.06) % 2 === 0) {
        dctx.globalAlpha = 0.22;
        dctx.fillStyle = GREEN ? '#b8ffcf' : '#ffffff';
        dctx.fillRect(0, 0, W, H);
      }
    }
    dctx.globalAlpha = 1;
    dctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
