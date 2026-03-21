const W = 1920, H = 1080;
let active = 0;
const rafs = {};

function scaleCanvas() {
  const s = Math.min(window.innerWidth / W, (window.innerHeight - 40) / H);
  const wrapper = document.getElementById('wrapper');
  wrapper.style.transform = `scale(${s})`;
  wrapper.style.top = '40px';
  wrapper.style.left = ((window.innerWidth - W * s) / 2) + 'px';
  wrapper.style.width = W + 'px';
  wrapper.style.height = H + 'px';
}
window.addEventListener('resize', scaleCanvas);
scaleCanvas();

function show(n) {
  goTo(n);
}

function ctx(n) { return document.getElementById('c' + n).getContext('2d'); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function lerp(a, b, t) { return a + (b - a) * t; }

// ─────────────────────────────────────────────────────
// 01 · INNER CITADEL
// ─────────────────────────────────────────────────────
function scene01() {
  const cx = ctx(0); let t = 0; const CYCLE = 2400;
  const particles = Array.from({length:160}, () => ({
    a: Math.random()*Math.PI*2, r: rnd(380,620), dr: rnd(-0.8,0.8),
    phase: Math.random()*Math.PI*2
  }));
  const walls = Array.from({length:120}, (_,i) => {
    const a = i/120 * Math.PI*2;
    return {a, r: rnd(180,260), phase: Math.random()*Math.PI*2};
  });

  function draw() {
    rafs[0] = requestAnimationFrame(draw); if (active !== 0) return; t++;
    const p = (t % CYCLE) / CYCLE;
    const build = Math.min(1, Math.max(0, (p-0.1)/0.55));
    const ease = build < 0.5 ? 2*build*build : 1 - Math.pow(-2*build+2,2)/2;

    cx.fillStyle = 'rgba(0,0,0,0.16)'; cx.fillRect(0,0,W,H);

    // chaos outside
    particles.forEach(pt => {
      pt.a += 0.006 + Math.sin(t*0.02 + pt.phase)*0.004;
      const rr = pt.r + Math.sin(t*0.03 + pt.phase)*40;
      const x = W/2 + Math.cos(pt.a)*rr;
      const y = H/2 + Math.sin(pt.a)*rr*0.7;
      cx.fillStyle = `rgba(140,50,20,${0.35*(1-ease)})`;
      cx.fillRect(x-3,y-3,6,6);
    });

    // walls
    walls.forEach(w => {
      const glow = 0.4 + Math.sin(t*0.018 + w.phase)*0.25;
      const sz = 12 + 10*ease;
      const rr = lerp(120, w.r, ease);
      const x = W/2 + Math.cos(w.a)*rr;
      const y = H/2 + Math.sin(w.a)*rr;
      cx.beginPath(); cx.arc(x,y,sz,0,Math.PI*2);
      cx.fillStyle = `rgba(220,190,110,${glow*ease})`; cx.fill();
    });

    const g = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,180);
    g.addColorStop(0, `rgba(255,240,180,${ease*0.28})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g; cx.fillRect(0,0,W,H);
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 02 · DICHOTOMY OF CONTROL
// ─────────────────────────────────────────────────────
function scene02() {
  const cx = ctx(1); let t = 0;
  const externals = Array.from({length:220}, () => ({
    a: Math.random()*Math.PI*2, r: rnd(50,220), speed: rnd(0.04,0.14)
  }));
  const internals = Array.from({length:140}, () => ({
    a: Math.random()*Math.PI*2, r: rnd(30,140), speed: rnd(0.004,0.014), ph: Math.random()*Math.PI*2
  }));

  function draw() {
    rafs[1] = requestAnimationFrame(draw); if (active !== 1) return; t++;
    const p = (t % 2100)/2100;
    const sep = Math.min(1, Math.max(0, (p-0.25)/0.5));
    const ease = sep < 0.5 ? 2*sep*sep : 1 - Math.pow(-2*sep+2,2)/2;

    cx.fillStyle = 'rgba(0,0,0,0.15)'; cx.fillRect(0,0,W,H);

    const lx = lerp(W*0.36, W*0.18, ease);
    const rx = lerp(W*0.64, W*0.82, ease);

    // external / chaos
    externals.forEach(p => {
      p.a += p.speed * (1 - ease*0.85);
      const jitter = (1-ease) * (Math.random()-0.5)*8;
      const x = lx + Math.cos(p.a)*p.r + jitter;
      const y = H/2 + Math.sin(p.a)*p.r*0.75 + jitter;
      cx.beginPath(); cx.arc(x,y,2.8,0,Math.PI*2);
      cx.fillStyle = `rgba(240,90,50,${0.6*(1-ease*0.7)})`; cx.fill();
    });

    // internal / choice
    internals.forEach(p => {
      p.a += p.speed + Math.sin(t*0.007 + p.ph)*0.003;
      const x = rx + Math.cos(p.a)*p.r;
      const y = H/2 + Math.sin(p.a)*p.r*0.7;
      const b = 200 + Math.sin(t*0.03 + p.ph)*55;
      cx.beginPath(); cx.arc(x,y,2.2,0,Math.PI*2);
      cx.fillStyle = `rgba(160,220,${b},${0.55 + ease*0.35})`; cx.fill();
    });
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 03 · VIEW FROM ABOVE
// ─────────────────────────────────────────────────────
function scene03() {
  const cx = ctx(2); let t = 0;
  const stars = Array.from({length:180}, () => ({
    x: rnd(0,W), y: rnd(0,H), s: rnd(0.4,1.8), p: Math.random()*Math.PI*2
  }));
  let zoom = 0;

  function draw() {
    rafs[2] = requestAnimationFrame(draw); if (active !== 2) return; t++;
    const p = (t % 3000)/3000;
    zoom = Math.min(1, Math.max(0, (p-0.15)/0.7));
    const ease = zoom < 0.5 ? 2*zoom*zoom : 1 - Math.pow(-2*zoom+2,2)/2;

    cx.fillStyle = 'rgba(0,0,0,0.08)'; cx.fillRect(0,0,W,H);

    const scale = 0.15 + ease*3.8;
    const ox = W/2 - (W/2)*ease*0.8;
    const oy = H/2 - (H/2)*ease*0.6;

    stars.forEach(s => {
      const ss = s.s * (1 + ease*1.5);
      const alpha = 0.3 + Math.sin(t*0.04 + s.p)*0.4;
      cx.fillStyle = `rgba(255,255,255,${alpha*(1-zoom*0.3)})`;
      cx.fillRect(ox + (s.x-W/2)*scale, oy + (s.y-H/2)*scale, ss, ss);
    });

    // tiny blue marble
    if (ease > 0.4) {
      const g = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,90);
      g.addColorStop(0, `rgba(80,180,255,${(ease-0.4)*0.9})`);
      g.addColorStop(0.7, `rgba(40,100,220,${(ease-0.4)*0.4})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = g; cx.fillRect(0,0,W,H);
    }
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 04 · IMPERMANENCE (sand mandala being erased)
// ─────────────────────────────────────────────────────
function scene04() {
  const cx = ctx(3); let t = 0; const CYCLE = 3600;
  let phase = 0; // 0 build, 1 hold, 2 erase

  function drawMandala(alpha) {
    const ox = W/2, oy = H/2;
    const rings = [60,120,190,270,360];
    rings.forEach((r, i) => {
      const a = t * (0.008 - i*0.003);
      for (let k = 0; k < 24 + i*4; k++) {
        const ang = a + k / (24+i*4) * Math.PI*2;
        const x = ox + Math.cos(ang)*r;
        const y = oy + Math.sin(ang)*r;
        cx.beginPath(); cx.arc(x,y,2.5,0,Math.PI*2);
        cx.fillStyle = `rgba(255,210,90,${alpha*0.6})`; cx.fill();
      }
    });
  }

  function draw() {
    rafs[3] = requestAnimationFrame(draw); if (active !== 3) return; t++;
    const p = (t % CYCLE)/CYCLE;

    let alpha = 1;
    if (p < 0.35) phase = 0, alpha = p/0.35;
    else if (p < 0.6) phase = 1;
    else phase = 2, alpha = 1 - (p-0.6)/0.4;

    cx.fillStyle = 'rgba(6,4,0,0.18)'; cx.fillRect(0,0,W,H);
    drawMandala(alpha);

    if (phase === 2) {
      const wind = (p-0.6)*6;
      cx.fillStyle = `rgba(40,30,10,${0.5*(p-0.6)})`;
      cx.fillRect(0,0,W,H);
    }

    const g = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,500);
    g.addColorStop(0, `rgba(80,50,0,${alpha*0.07})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g; cx.fillRect(0,0,W,H);
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 05 · INNER FIRE
// ─────────────────────────────────────────────────────
function scene05() {
  const cx = ctx(4); let t = 0;
  const sparks = Array.from({length:80}, () => ({life:0}));

  function addSpark() {
    const i = sparks.findIndex(s => s.life <= 0);
    if (i >= 0) {
      sparks[i] = {
        x: W/2 + rnd(-30,30),
        y: H*0.7 + rnd(-20,20),
        vx: rnd(-1.2,1.2),
        vy: -rnd(2.5,5.5),
        life: rnd(50,140)
      };
    }
  }

  function draw() {
    rafs[4] = requestAnimationFrame(draw); if (active !== 4) return; t++;
    cx.fillStyle = 'rgba(0,0,0,0.12)'; cx.fillRect(0,0,W,H);

    if (t % 8 === 0) addSpark();

    sparks.forEach(s => {
      if (s.life <= 0) return;
      s.life--;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.04;
      const a = s.life / 120;
      cx.beginPath(); cx.arc(s.x, s.y, 3 + a*5, 0, Math.PI*2);
      cx.fillStyle = `rgba(255,${Math.floor(180 + a*75)},${Math.floor(40 + a*40)},${a*0.9})`;
      cx.fill();
    });

    // steady core
    const g = cx.createRadialGradient(W/2,H*0.65,0,W/2,H*0.65,160);
    g.addColorStop(0, 'rgba(255,220,80,0.35)');
    g.addColorStop(0.5, 'rgba(255,120,30,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g; cx.fillRect(0,0,W,H);
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 06 · AMOR FATI  (chaos → golden harmony)
// ─────────────────────────────────────────────────────
function scene06() {
  const cx = ctx(5); let t = 0;
  const parts = Array.from({length:300}, () => ({
    x: rnd(W*0.2,W*0.8), y: rnd(H*0.2,H*0.8),
    vx: rnd(-1.5,1.5), vy: rnd(-1.5,1.5), hue: rnd(20,60)
  }));

  function draw() {
    rafs[5] = requestAnimationFrame(draw); if (active !== 5) return; t++;
    const p = (t % 2800)/2800;
    const trans = Math.min(1, Math.max(0, (p-0.3)/0.6));
    const ease = trans < 0.5 ? 2*trans*trans : 1 - Math.pow(-2*trans+2,2)/2;

    cx.fillStyle = `rgba(${Math.floor(lerp(10,2,ease))},${Math.floor(lerp(10,4,ease))},${Math.floor(lerp(20,8,ease))},0.14)`;
    cx.fillRect(0,0,W,H);

    parts.forEach(pt => {
      pt.x += pt.vx * (1 - ease*0.92) + Math.sin(t*0.03 + pt.x)*0.4*ease;
      pt.y += pt.vy * (1 - ease*0.92) + Math.cos(t*0.03 + pt.y)*0.4*ease;
      if (pt.x < 0 || pt.x > W) pt.vx *= -1;
      if (pt.y < 0 || pt.y > H) pt.vy *= -1;

      const sat = lerp(40, 220, ease);
      cx.beginPath(); cx.arc(pt.x, pt.y, 2.5, 0, Math.PI*2);
      cx.fillStyle = `hsla(${pt.hue + ease*180}, ${sat}%, ${lerp(30,70,ease)}%, ${0.5 + ease*0.4})`;
      cx.fill();
    });

    const center = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,300);
    center.addColorStop(0, `rgba(255,220,100,${ease*0.25})`);
    center.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = center; cx.fillRect(0,0,W,H);
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 07 · DISCIPLINE  (stones forming arch)
// ─────────────────────────────────────────────────────
function scene07() {
  const cx = ctx(6); let t = 0;
  const blocks = [];
  const layers = [0,60,120,180,240];
  layers.forEach((y,i) => {
    const cnt = 13 - i*2;
    const ww = 110 + i*8;
    const start = (W - cnt*ww)/2;
    for (let j=0; j<cnt; j++) {
      blocks.push({x:start + j*ww, baseY: H*0.7 - y - 55, w:ww-4, h:52, rise:0});
    }
  });

  function draw() {
    rafs[6] = requestAnimationFrame(draw); if (active !== 6) return; t++;
    const p = (t % 3200)/3200;
    const prog = Math.min(1, p/0.65);

    cx.fillStyle = 'rgba(0,0,0,0.15)'; cx.fillRect(0,0,W,H);

    blocks.forEach((b,i) => {
      const delay = Math.floor(i/8)*0.06;
      b.rise = Math.max(0, Math.min(1, (prog - delay)/0.4));
      const e = b.rise < 0.5 ? 2*b.rise*b.rise : 1 - Math.pow(-2*b.rise+2,2)/2;
      const yy = lerp(H + 100, b.baseY, e);
      const sh = Math.floor(60 + i*2 + Math.sin(t*0.02 + i)*6);
      cx.fillStyle = `rgb(${sh},${sh-8},${sh-20})`;
      cx.fillRect(b.x, yy, b.w, b.h);
      cx.fillStyle = `rgba(220,200,140,${e*0.15})`;
      cx.fillRect(b.x, yy, b.w, 3);
    });

    if (prog > 0.7) {
      const g = cx.createRadialGradient(W/2, H*0.45, 0, W/2, H*0.45, 280);
      g.addColorStop(0, `rgba(255,210,90,${(prog-0.7)*0.22})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = g; cx.fillRect(0,0,W,H);
    }
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 08 · TRANQUIL RIVER
// ─────────────────────────────────────────────────────
function scene08() {
  const cx = ctx(7); let t = 0;
  const flow = Array.from({length:140}, (_,i) => ({
    x: (i/140)*W*1.4 - W*0.2, y: H*0.3 + Math.sin(i*0.4)*80,
    phase: i*0.7 + Math.random()*Math.PI*2
  }));

  function draw() {
    rafs[7] = requestAnimationFrame(draw); if (active !== 7) return; t++;
    const p = (t % 2800)/2800;
    const calm = Math.min(1, Math.max(0, (p-0.25)/0.6));
    const ease = calm < 0.5 ? 2*calm*calm : 1 - Math.pow(-2*calm+2,2)/2;

    cx.fillStyle = `rgb(${Math.floor(lerp(4,10,ease))},${Math.floor(lerp(10,30,ease))},${Math.floor(lerp(20,60,ease))})`;
    cx.fillRect(0,0,W,H);

    flow.forEach(f => {
      const sway = Math.sin(t*0.03 + f.phase)* (30 * (1-calm));
      const y = f.y + Math.sin(t*0.015 + f.phase)*12*(1-calm);
      cx.beginPath();
      cx.moveTo(f.x - 40, y - 20);
      cx.quadraticCurveTo(f.x + sway, y, f.x + 40, y + 20);
      cx.strokeStyle = `rgba(120,200,255,${0.4 + ease*0.35})`;
      cx.lineWidth = 14 * (0.6 + ease*0.4); cx.stroke();
    });

    // reflection glow
    const rg = cx.createLinearGradient(0, H*0.4, 0, H);
    rg.addColorStop(0, `rgba(80,180,255,${ease*0.12})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = rg; cx.fillRect(0,0,W,H);
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 09 · PREMEDITATION OF EVILS
// ─────────────────────────────────────────────────────
function scene09() {
  const cx = ctx(8); let t = 0;
  const shadows = Array.from({length:40}, () => ({
    x: rnd(W*0.1,W*0.9), y: rnd(H*0.1,H*0.5),
    size: rnd(60,160), life: 0, max: rnd(120,300)
  }));

  function draw() {
    rafs[8] = requestAnimationFrame(draw); if (active !== 8) return; t++;
    const p = (t % 3600)/3600;
    const fade = Math.min(1, Math.max(0, (p-0.4)/0.5));

    cx.fillStyle = 'rgba(0,0,0,0.14)'; cx.fillRect(0,0,W,H);

    shadows.forEach(s => {
      if (t % 180 === 0 && s.life <= 0) {
        s.life = s.max; s.x = rnd(W*0.1,W*0.9); s.y = rnd(80, H*0.45);
      }
      if (s.life > 0) {
        s.life--;
        const a = s.life / s.max;
        const ea = a < 0.5 ? 2*a*a : 1 - Math.pow(-2*a+2,2)/2;
        const g = cx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.size);
        g.addColorStop(0, `rgba(80,20,0,${ea*0.4*(1-fade)})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        cx.fillStyle = g; cx.fillRect(s.x-s.size,s.y-s.size,s.size*2,s.size*2);
      }
    });

    if (fade > 0.1) {
      const calm = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,400);
      calm.addColorStop(0, `rgba(200,220,255,${fade*0.18})`);
      calm.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = calm; cx.fillRect(0,0,W,H);
    }
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 10 · MEMENTO MORI
// ─────────────────────────────────────────────────────
function scene10() {
  const cx = ctx(9); let t = 0;
  let sand = 0.8;

  function draw() {
    rafs[9] = requestAnimationFrame(draw); if (active !== 9) return; t++;
    const p = (t % 4000)/4000;
    sand = 0.85 - p*0.65;

    cx.fillStyle = 'rgba(0,0,0,0.12)'; cx.fillRect(0,0,W,H);

    // upper hourglass
    cx.beginPath();
    cx.moveTo(W/2-60, H*0.2);
    cx.lineTo(W/2+60, H*0.2);
    cx.lineTo(W/2+30, H*0.45);
    cx.lineTo(W/2-30, H*0.45);
    cx.closePath();
    cx.fillStyle = 'rgba(60,50,40,0.4)'; cx.fill();

    // sand
    const sandH = H*0.45 - (H*0.25 * sand);
    cx.fillStyle = 'rgba(240,220,140,0.8)';
    cx.fillRect(W/2-28, sandH, 56, H*0.45 - sandH + 10);

    // lower part
    cx.beginPath();
    cx.moveTo(W/2-30, H*0.55);
    cx.lineTo(W/2+30, H*0.55);
    cx.lineTo(W/2+60, H*0.8);
    cx.lineTo(W/2-60, H*0.8);
    cx.closePath();
    cx.fillStyle = 'rgba(60,50,40,0.4)'; cx.fill();

    // faint skull shape pulse
    const pulse = Math.sin(t*0.025)*0.15 + 0.5;
    if (pulse > 0.4) {
      const g = cx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 220);
      g.addColorStop(0, `rgba(220,200,180,${pulse*0.12})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = g; cx.fillRect(0,0,W,H);
    }
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 11 · VIRTUE COMPASS
// ─────────────────────────────────────────────────────
function scene11() {
  const cx = ctx(10); let t = 0;
  const shakes = Array.from({length:40}, () => rnd(-1,1));

  function draw() {
    rafs[10] = requestAnimationFrame(draw); if (active !== 10) return; t++;
    cx.fillStyle = 'rgba(0,0,0,0.13)'; cx.fillRect(0,0,W,H);

    const shake = Math.sin(t*0.07)*0.8 + Math.sin(t*0.13)*0.5;

    // circle
    cx.beginPath(); cx.arc(W/2, H/2, 220, 0, Math.PI*2);
    cx.strokeStyle = 'rgba(180,180,220,0.3)'; cx.lineWidth = 2; cx.stroke();

    // needle
    const ang = shake * 0.06;
    const len = 180;
    const nx = W/2 + Math.cos(ang)*len;
    const ny = H/2 + Math.sin(ang)*len;
    cx.beginPath(); cx.moveTo(W/2, H/2);
    cx.lineTo(nx, ny);
    cx.strokeStyle = 'rgba(255,240,100,0.9)'; cx.lineWidth = 6; cx.stroke();

    // center glow
    const g = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,80);
    g.addColorStop(0, 'rgba(255,240,140,0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g; cx.fillRect(0,0,W,H);
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 12 · ANCHOR
// ─────────────────────────────────────────────────────
function scene12() {
  const cx = ctx(11); let t = 0;
  const waves = Array.from({length:60}, (_,i) => i*0.12);

  function draw() {
    rafs[11] = requestAnimationFrame(draw); if (active !== 11) return; t++;
    const p = (t % 3000)/3000;
    const calm = Math.min(1, Math.max(0, (p-0.3)/0.6));
    const ease = calm < 0.5 ? 2*calm*calm : 1 - Math.pow(-2*calm+2,2)/2;

    cx.fillStyle = `rgb(${Math.floor(lerp(6,14,ease))},${Math.floor(lerp(12,40,ease))},${Math.floor(lerp(30,80,ease))})`;
    cx.fillRect(0,0,W,H);

    // waves
    waves.forEach(w => {
      const amp = (1-ease) * (18 + Math.sin(t*0.02 + w)*12);
      const y = H*0.6 + Math.sin(t*0.03 + w*2)*amp;
      cx.beginPath();
      cx.moveTo(0, y);
      for (let x=0; x<=W; x+=40) {
        const yy = y + Math.sin(t*0.04 + x*0.008 + w)*amp*0.6;
        cx.lineTo(x, yy);
      }
      cx.lineTo(W, H); cx.lineTo(0, H); cx.closePath();
      cx.fillStyle = `rgba(40,90,180,${0.25 + ease*0.15})`; cx.fill();
    });

    // chain & anchor
    const chainY = lerp(H*0.2, H*0.75, ease);
    cx.beginPath(); cx.moveTo(W/2, H*0.15);
    cx.lineTo(W/2 + Math.sin(t*0.06)*6, chainY);
    cx.strokeStyle = 'rgba(180,160,120,0.7)'; cx.lineWidth = 14; cx.stroke();

    // anchor
    cx.beginPath(); cx.arc(W/2, chainY+30, 24, 0, Math.PI*2);
    cx.fillStyle = 'rgba(140,120,80,0.9)'; cx.fill();
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 13 · MIRROR SOUL
// ─────────────────────────────────────────────────────
function scene13() {
  const cx = ctx(12); let t = 0;
  const ideal = {x:W/2, y:H*0.4, posture:0};

  function draw() {
    rafs[12] = requestAnimationFrame(draw); if (active !== 12) return; t++;
    const p = (t % 3400)/3400;
    const align = Math.min(1, Math.max(0, (p-0.2)/0.65));
    const ease = align < 0.5 ? 2*align*align : 1 - Math.pow(-2*align+2,2)/2;

    cx.fillStyle = 'rgba(0,0,0,0.14)'; cx.fillRect(0,0,W,H);

    // reflection line
    cx.beginPath(); cx.moveTo(0,H*0.5); cx.lineTo(W,H*0.5);
    cx.strokeStyle = 'rgba(120,180,255,0.25)'; cx.lineWidth = 2; cx.stroke();

    // real self (distorted)
    const realY = H*0.7 + Math.sin(t*0.03)*12*(1-ease);
    cx.beginPath(); cx.arc(W/2 + Math.sin(t*0.05)*30, realY, 50, 0, Math.PI*2);
    cx.fillStyle = `rgba(180,140,100,${0.6 + ease*0.3})`; cx.fill();

    // ideal self (clearer, straighter)
    const iy = lerp(H*0.7, H*0.3, ease);
    const ix = W/2 + Math.sin(t*0.02)*8*(1-ease);
    cx.beginPath(); cx.arc(ix, iy, 50 + 20*ease, 0, Math.PI*2);
    cx.fillStyle = `rgba(220,240,255,${0.4 + ease*0.6})`; cx.fill();

    // mirror glow
    if (ease > 0.5) {
      const g = cx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 400);
      g.addColorStop(0, `rgba(180,220,255,${(ease-0.5)*0.3})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = g; cx.fillRect(0,0,W,H);
    }
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 14 · ETERNAL NOW
// ─────────────────────────────────────────────────────
function scene14() {
  const cx = ctx(13); let t = 0;

  function draw() {
    rafs[13] = requestAnimationFrame(draw); if (active !== 13) return; t++;
    const p = (t % 2800)/2800;

    cx.fillStyle = 'rgba(0,0,0,0.1)'; cx.fillRect(0,0,W,H);

    // spinning clock hands → freeze
    const freeze = Math.min(1, Math.max(0, (p-0.4)/0.5));
    const speed = (1-freeze)*0.15;

    for (let i=0; i<12; i++) {
      const a = t * speed + i/12 * Math.PI*2;
      const len = 140 + Math.sin(t*0.04 + i)*20;
      const x = W/2 + Math.cos(a)*len;
      const y = H/2 + Math.sin(a)*len;
      cx.beginPath(); cx.moveTo(W/2, H/2);
      cx.lineTo(x, y);
      cx.strokeStyle = `rgba(220,240,255,${0.4*(1-freeze)})`;
      cx.lineWidth = 3; cx.stroke();
    }

    // central point
    const g = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,120);
    g.addColorStop(0, `rgba(255,240,180,${0.5 + freeze*0.5})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = g; cx.fillRect(0,0,W,H);
  }
  draw();
}

// ─────────────────────────────────────────────────────
// 15 · LOGOS FLAME
// ─────────────────────────────────────────────────────
function scene15() {
  const cx = ctx(14); let t = 0;
  const sparks = Array.from({length:180}, () => ({life:0}));

  function addSpark() {
    const i = sparks.findIndex(s => s.life <= 0);
    if (i>=0) {
      sparks[i] = {
        a: Math.random()*Math.PI*2,
        r: rnd(20,180),
        speed: rnd(0.02,0.09),
        life: rnd(80,220)
      };
    }
  }

  function draw() {
    rafs[14] = requestAnimationFrame(draw); if (active !== 14) return; t++;
    cx.fillStyle = 'rgba(0,0,0,0.11)'; cx.fillRect(0,0,W,H);

    if (t % 5 === 0) addSpark();

    sparks.forEach(s => {
      if (s.life <= 0) return;
      s.life--;
      s.a += s.speed;
      s.r += 0.4 + Math.sin(t*0.02)*0.3;
      const x = W/2 + Math.cos(s.a)*s.r;
      const y = H/2 + Math.sin(s.a)*s.r*0.6;
      const a = s.life / 180;
      cx.beginPath(); cx.arc(x,y,2 + a*6,0,Math.PI*2);
      cx.fillStyle = `rgba(255,${Math.floor(220 - a*100)},${Math.floor(80 + a*140)},${a*0.9})`;
      cx.fill();
    });

    const core = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,140);
    core.addColorStop(0, 'rgba(255,240,100,0.55)');
    core.addColorStop(0.6, 'rgba(255,140,40,0.25)');
    core.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = core; cx.fillRect(0,0,W,H);
  }
  draw();
}

const SCENES = [
  {name: '01 · Citadel', dur: 30}, scene01,
  {name: '02 · Dichotomy', dur: 30}, scene02,
  {name: '03 · View Above', dur: 30}, scene03,
  {name: '04 · Impermanence', dur: 30}, scene04,
  {name: '05 · Inner Fire', dur: 30}, scene05,
  {name: '06 · Amor Fati', dur: 30}, scene06,
  {name: '07 · Discipline', dur: 30}, scene07,
  {name: '08 · Tranquil River', dur: 30}, scene08,
  {name: '09 · Premeditation', dur: 30}, scene09,
  {name: '10 · Memento Mori', dur: 30}, scene10,
  {name: '11 · Virtue Compass', dur: 30}, scene11,
  {name: '12 · Anchor', dur: 30}, scene12,
  {name: '13 · Mirror Soul', dur: 30}, scene13,
  {name: '14 · Eternal Now', dur: 30}, scene14,
  {name: '15 · Logos Flame', dur: 30}, scene15
];

const SPEEDS = [1, 1.5, 2, 0.5];
let speedIdx = 0, cur = 0, playing = false, sT = 0, frameT = 0;
const FPS = 60;
const ctxs = [];

const wrapper = document.getElementById('wrapper');
wrapper.style.width = W + 'px'; wrapper.style.height = H + 'px';
// Canvas elements already exist in HTML, no need to create them
for (let i = 0; i < SCENES.length; i++) {
  ctxs.push(document.getElementById('c' + i).getContext('2d'));
}

// Generate scene strip thumbnails
const strip = document.getElementById('strip');
SCENES.forEach((sc, i) => {
  const d = document.createElement('div');
  d.className = 'thumb' + (i === 0 ? ' active' : ''); d.id = 'th' + i;
  d.innerHTML = `<div class="tnum">${String(i + 1).padStart(2, '0')}</div><div class="tname">${sc.name}</div><div class="tbar" id="tb${i}"></div>`;
  d.onclick = () => goTo(i); strip.appendChild(d);
});

function goTo(n) {
  cancelAnimationFrame(rafs[active]);
  if (active === n) return; // Prevent circular reference
  document.getElementById('c'+active).classList.remove('active');
  document.getElementById('btn'+active).classList.remove('active');
  active = n;
  document.getElementById('c' + n).classList.add('active');
  document.getElementById('btn' + n).classList.add('active');
  document.getElementById('scene-name').textContent = SCENES[n].name || 'Scene ' + (n+1);
  document.getElementById('scene-sub').textContent = 'Cinematic Series IV · 1920×1080';
  document.getElementById('btn' + n).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  if (SCENES[n]) SCENES[n]();
}

function prev() { if (cur > 0) goTo(cur - 1); }
function next() { if (cur < SCENES.length - 1) goTo(cur + 1); }
function togglePlay() { 
  playing = !playing; 
  document.getElementById('playbtn').innerHTML = playing ? '&#9646;&#9646;' : '&#9654;'; 
  speedIdx = (speedIdx + 1) % SPEEDS.length; 
  document.getElementById('speed-btn').textContent = SPEEDS[speedIdx] + '×'; 
}
function cycleSpeed() {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  document.getElementById('speed-btn').textContent = SPEEDS[speedIdx] + '×';
}
function seekClick(e) {
const rect = e.currentTarget.getBoundingClientRect();
const pct = (e.clientX - rect.left) / rect.width;
const tot = SCENES.reduce((a, s) => a + (s.dur || 30), 0);
let acc = 0, tgt = pct * tot;
for (let i = 0; i < SCENES.length; i++) { 
if (acc + (SCENES[i].dur || 30) >= tgt) { 
goTo(i); 
sT = Math.floor((tgt - acc) * FPS / SPEEDS[speedIdx]); 
break; 
} 
acc += (SCENES[i].dur || 30); 
} 
}
function fmt(s) { return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }

function masterLoop() {
requestAnimationFrame(masterLoop); frameT++;
const sc = SCENES[cur]; const tot = (sc.dur || 30) * FPS / SPEEDS[speedIdx];
if (playing) { 
sT++; 
if (sT >= tot) { 
if (cur < SCENES.length - 1) goTo(cur + 1); 
else { 
playing = false; 
document.getElementById('playbtn').innerHTML = '&#9654;'; 
} 
} 
}
SCENES[cur](frameT, sT, tot);
const pct = Math.min(1, sT / tot) * 100;
document.getElementById('tb' + cur).style.width = pct + '%';
const el = Math.floor(sT / FPS * SPEEDS[speedIdx]);
document.getElementById('timer-display').textContent = fmt(el) + ' / ' + fmt(sc.dur || 30);
const totD = SCENES.reduce((a, s) => a + (s.dur || 30), 0);
const doneD = SCENES.slice(0, cur).reduce((a, s) => a + (s.dur || 30), 0);
document.getElementById('progress-fill').style.width = (doneD / totD * 100) + '%';
}

const R = [];

// Start with first scene
SCENES[0]();
