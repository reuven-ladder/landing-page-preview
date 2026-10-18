// Why Ladder lab: one finding, start to finish.
// Everything on screen is a pure function of scroll progress p (0 → 1): no thresholds that trigger
// timed transitions, no camera that chases a target. Lenis smooths the scroll itself, so the scene
// moves exactly with the finger and plays backwards cleanly.
(function () {
  const W = 1600, H = 1000, TOP = 68;
  const lab = document.getElementById('lab');
  if (!lab) return;
  const pin = lab.querySelector('.lab-pin');
  const layers = [...lab.querySelectorAll('.lw')].map(n => ({ n, d: +n.dataset.d }));
  const app = lab.querySelector('.la'), bubble = lab.querySelector('.lab-bubble'), screen = lab.querySelector('.lw-screen');
  const q = s => lab.querySelector(s), qa = s => [...lab.querySelectorAll(s)];
  const el = {
    sheets: q('.la-sheets'), est: q('.la-est'), x: qa('.sh.x'), g: q('.sh.g'),
    f1: q('.f1'), f2: q('.f2'), f3: q('.f3'), side: q('.la-side'),
    chg: q('.el-chg'), n: q('.el-chg .n'), by: q('.el-by'), kv: qa('.kv'), tr: q('.el-tr'), stamp: q('.stamp'),
    bubbleText: q('.lab-bubble span'), dots: qa('.lab-cap .dots i'), st: qa('.lab-cap .st p'),
  };

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sm = t => t * t * (3 - 2 * t);
  const ramp = (p, a, b) => sm(clamp((p - a) / (b - a)));          // 0 before a, 1 after b
  const win = (p, a, b, c, d) => Math.min(ramp(p, a, b), 1 - ramp(p, c, d)); // in over a→b, out over c→d
  const lerp = (a, b, t) => a + (b - a) * t;
  const track = (keys, p) => {                                      // eased piecewise track: [[p, value], …]
    if (p <= keys[0][0]) return keys[0][1];
    for (let k = 1; k < keys.length; k++) if (p <= keys[k][0]) {
      const [p0, v0] = keys[k - 1], [p1, v1] = keys[k], t = sm((p - p0) / (p1 - p0));
      return typeof v0 === 'number' ? lerp(v0, v1, t) : Object.fromEntries(Object.keys(v0).map(key => [key, lerp(v0[key], v1[key], t)]));
    }
    return keys[keys.length - 1][1];
  };

  /* ---------- the script: camera, the app window, and each element, all keyed to p ---------- */
  const WIDE = { x: 150, y: 40, w: 1300, h: 960 }, MON = { x: 690, y: 200, w: 640, h: 520 }, MON2 = { x: 705, y: 220, w: 610, h: 490 };
  const ENG = { x: 430, y: 300, w: 900, h: 700 }, ENG2 = { x: 460, y: 320, w: 840, h: 660 };
  const CAM = [[0, WIDE], [.12, MON], [.45, MON2], [.53, ENG], [.61, ENG2], [.69, MON], [.95, MON2], [1, WIDE]];
  const LIFT = [[0, 0], [.1, 0], [.17, 1], [.46, 1], [.52, 0], [.62, 0], [.69, 1], [.96, 1], [1, 0]];
  const STEPS = [.14, .30, .46, .66, .82, .97];                       // step k runs STEPS[k-1] → STEPS[k]
  const SCREEN = { x: 744, y: 304, w: 532, h: 302 };                 // the main monitor, in world units
  const HEAD = { x: 790, y: 610 };                                    // where the bubble points from

  /* ---------- layout ---------- */
  let vw = 0, vh = 0, mobile = false, sref = 1, lastW = -1;
  function layout() {
    // phones change innerHeight as the address bar moves: only a width change re-lays out
    if (innerWidth === lastW && vh) return;
    lastW = innerWidth; vw = innerWidth; vh = innerHeight; mobile = vw <= 760;
    sref = mobile ? (vh - TOP) / H : Math.min(vw / W, (vh - TOP) / H);
    pin.style.height = vh + 'px';
    lab.style.height = Math.round(vh * (mobile ? 7.5 : 6.5)) + 'px';
    render(true);
  }
  // the app window when lifted out of the monitor: a readable size for the device
  const target = () => mobile
    ? { w: vw - 24, h: Math.min(500, vh * .6), x: 12, y: TOP + 12 }
    : { w: Math.min(780, vw * .58), h: Math.min(450, (vh - TOP) * .66) };

  /* ---------- frame ---------- */
  let lastP = -1;
  function render(force) {
    const r = lab.getBoundingClientRect();
    const p = clamp(-r.top / (lab.offsetHeight - vh));
    if (!force && Math.abs(p - lastP) < 1e-5) return;
    lastP = p;

    // camera: fit the current world rect into the viewport below the header
    const c = track(CAM, p);
    const A = { x: 0, y: TOP, w: vw, h: vh - TOP - (mobile ? 150 : 0) };
    const S = Math.min(A.w / c.w, A.h / c.h), cx = c.x + c.w / 2, cy = c.y + c.h / 2, ax = A.x + A.w / 2, ay = A.y + A.h / 2;
    const z = S / sref;
    layers.forEach(L => {
      const k = S * Math.pow(Math.max(z, 1), L.d - 1), px = cx + (cx - 800) * (L.d - 1) * .6, py = cy + (cy - 640) * (L.d - 1) * .6;
      L.n.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0) scale(${k.toFixed(4)}) translate3d(${-px.toFixed(1)}px,${-py.toFixed(1)}px,0)`;
    });
    const toScreen = (x, y) => ({ x: ax + (x - cx) * S, y: ay + (y - cy) * S });

    // the app window: from the monitor's screen to its lifted rect
    const lift = track(LIFT, p), T = target(), m0 = toScreen(SCREEN.x, SCREEN.y);
    const M = { x: m0.x, y: m0.y, w: SCREEN.w * S };
    if (!mobile) { // desktop: the window grows out of the monitor's centre, kept inside the viewport
      const mc = toScreen(SCREEN.x + SCREEN.w / 2, SCREEN.y + SCREEN.h / 2);
      T.x = clamp(mc.x - T.w / 2, 16, vw - T.w - 16); T.y = clamp(mc.y - T.h / 2, TOP + 12, vh - T.h - 16);
    }
    const x = lerp(M.x, T.x, lift), y = lerp(M.y, T.y, lift), sc = lerp(M.w / T.w, 1, lift);
    app.style.width = T.w + 'px'; app.style.height = T.h + 'px';
    app.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
    app.style.opacity = ramp(lift, 0, .35).toFixed(3);
    screen.style.opacity = (1 - ramp(lift, .3, .8)).toFixed(3); // the monitor's own screen hides behind the lifted window
    app.style.boxShadow = `${(6 * lift).toFixed(1)}px ${(6 * lift).toFixed(1)}px 0 var(--ink)`;

    // 1 · the two sources turn red
    const red = ramp(p, .17, .26);
    el.x.forEach(n => n.style.setProperty('--red', red.toFixed(3)));
    // 2 · the finding slides in with both sources
    set(el.f1, ramp(p, .31, .38));
    // 3 · the engineer asks (bubble at the desk), the agents check G-101, the answer lands
    const ask = win(p, .52, .55, .63, .66);
    const hp = toScreen(HEAD.x, HEAD.y);
    bubble.style.opacity = ask.toFixed(3);
    const bx = Math.min(hp.x, vw - bubble.offsetWidth - 12); // stays on screen on phones
    bubble.style.transform = `translate3d(${bx.toFixed(1)}px,${(hp.y - 8 * (1 - ask)).toFixed(1)}px,0)`;
    el.bubbleText.style.clipPath = `inset(0 ${(100 - 100 * ramp(p, .54, .61)).toFixed(1)}% 0 0)`;
    set(el.f2, ramp(p, .60, .66));
    el.g.style.setProperty('--blue', ramp(p, .62, .68).toFixed(3));
    set(el.f3, ramp(p, .68, .73));
    // 4 · the estimate: the closers count up from 0 to 8 as you scroll
    const est = ramp(p, .70, .74);
    el.sheets.style.opacity = (1 - est).toFixed(3);
    el.est.style.opacity = est.toFixed(3);
    el.est.style.transform = `translateY(${(10 * (1 - est)).toFixed(1)}px)`;
    el.side.style.opacity = mobile ? (1 - est).toFixed(3) : '1'; // phones: the estimate takes the findings' space
    const cnt = ramp(p, .74, .80);
    el.n.textContent = Math.round(8 * cnt);
    el.chg.style.setProperty('--hot', win(p, .73, .76, .82, .86).toFixed(3));
    set(el.by, ramp(p, .79, .82));
    // 5 · the basis, the four treatments, the signature
    el.kv.forEach((n, k) => set(n, ramp(p, .83 + k * .03, .86 + k * .03)));
    set(el.tr, ramp(p, .92, .95));
    const st = ramp(p, .95, .975);
    el.stamp.style.opacity = st.toFixed(3);
    el.stamp.style.transform = `rotate(-8deg) scale(${(1.5 - .5 * st).toFixed(3)})`;

    // caption: dots and the step line follow the same p
    const step = STEPS.findIndex((s, k) => k > 0 && p < s);
    const cur = step < 0 ? 5 : Math.max(1, step);
    el.dots.forEach((d, k) => { d.classList.toggle('on', k + 1 === cur); d.classList.toggle('done', k + 1 < cur); });
    el.st.forEach((n, k) => {
      const a = STEPS[k], b = STEPS[k + 1], o = k === 0 ? 1 - ramp(p, b - .015, b + .015) : k === 4 ? ramp(p, a - .015, a + .015) : win(p, a - .015, a + .015, b - .015, b + .015);
      n.style.opacity = o.toFixed(3);
      n.style.transform = `translateY(${(6 * (1 - o)).toFixed(1)}px)`;
    });
  }
  // scrubbed in/out: opacity and a small rise
  function set(n, t) { n.style.opacity = t.toFixed(3); n.style.transform = `translateY(${(8 * (1 - t)).toFixed(1)}px)`; }

  /* ---------- smooth scroll (as on reddgrow) + one render loop ---------- */
  const lenis = window.Lenis ? new Lenis({ lerp: .1, smoothWheel: true }) : null;
  window.__lenis = lenis; // lets a test jump straight to a scroll position
  function loop(t) { if (lenis) lenis.raf(t); render(false); requestAnimationFrame(loop); }
  addEventListener('resize', layout);
  layout();
  requestAnimationFrame(loop);
})();
