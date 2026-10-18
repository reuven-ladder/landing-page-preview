// Why Ladder lab v2: one finding, told in a few strong frames.
// Scroll chooses the frame; the camera moves only between frames. Each frame plays its own short
// arrival once you reach it (time-based), so a fast scroll still shows every moment. When scrolling
// stops between two frames, the page settles on the nearer one (?snap=0 turns that off).
(function () {
  const W = 1600, H = 1000, TOP = 68;
  const lab = document.getElementById('lab');
  if (!lab) return;
  const pin = lab.querySelector('.lab-pin');
  const layers = [...lab.querySelectorAll('.lw')].map(n => ({ n, d: +n.dataset.d }));
  const frames = [...lab.querySelectorAll('.fr')];
  const screen = lab.querySelector('.lw-screen'), counter = lab.querySelector('.fr-3 .n');
  const dots = [...lab.querySelectorAll('.lab-cap .dots i')], lines = [...lab.querySelectorAll('.lab-cap .st p')];
  const snapOn = !/[?&]snap=0/.test(location.search);

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sm = t => t * t * (3 - 2 * t);
  const ramp = (v, a, b) => sm(clamp((v - a) / (b - a)));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- the frames: where the camera looks (world units) ---------- */
  const N = 5;                                         // 0 intro + 4 moments
  const CAM = [
    { x: 150, y: 40, w: 1300, h: 960 },                // 0 the desk
    { x: 690, y: 200, w: 640, h: 520 },                // 1 the monitor: two documents disagree
    { x: 430, y: 300, w: 900, h: 700 },                // 2 the engineer at the desk asks
    { x: 700, y: 215, w: 620, h: 500 },                // 3 the monitor: the number changes
    { x: 560, y: 180, w: 860, h: 680 },                // 4 signed
  ];
  const HOLD = .6, MOVE = .95;                         // within a frame's stretch: hold, then move to the next

  /* ---------- layout ---------- */
  let vw = 0, vh = 0, mobile = false, sref = 1, lastW = -1, span = 0;
  function layout() {
    if (innerWidth === lastW && vh) return;            // phones resize height as the address bar moves
    lastW = innerWidth; vw = innerWidth; vh = innerHeight; mobile = vw <= 760;
    sref = mobile ? (vh - TOP) / H : Math.min(vw / W, (vh - TOP) / H);
    pin.style.height = vh + 'px';
    lab.style.height = Math.round(vh * (N * 1.05 + .2)) + 'px';
    span = lab.offsetHeight - vh;
    render(true);
  }

  /* ---------- frame ---------- */
  let lastF = -1, cur = -1;
  function render(force) {
    const top = lab.getBoundingClientRect().top;
    const p = clamp(-top / span), f = p * (N - 1), k = Math.min(N - 2, Math.floor(f)), local = f - k;
    const fpos = p >= 1 ? N - 1 : k + ramp(local, HOLD, MOVE);
    if (!force && Math.abs(fpos - lastF) < 1e-5) return;
    lastF = fpos;

    // camera: between the two frames' shots
    const i = Math.min(N - 2, Math.floor(fpos)), t = fpos - i, a = CAM[i], b = CAM[i + 1];
    const c = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
    const A = { x: 0, y: TOP, w: vw, h: vh - TOP - (mobile ? 140 : 0) };
    const S = Math.min(A.w / c.w, A.h / c.h), cx = c.x + c.w / 2, cy = c.y + c.h / 2, ax = A.x + A.w / 2, ay = A.y + A.h / 2;
    const z = S / sref;
    layers.forEach(L => {
      const s = S * Math.pow(Math.max(z, 1), L.d - 1), px = cx + (cx - 800) * (L.d - 1) * .6, py = cy + (cy - 640) * (L.d - 1) * .6;
      L.n.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0) scale(${s.toFixed(4)}) translate3d(${-px.toFixed(1)}px,${-py.toFixed(1)}px,0)`;
    });

    // the current frame switches half-way through a move; its arrival then plays on its own
    const now = Math.round(fpos);
    if (now !== cur) enter(now);
  }

  let countT = 0;
  function enter(n) {
    cur = n;
    frames.forEach(fr => fr.classList.toggle('on', +fr.dataset.f === n));
    screen.classList.toggle('dim', n === 1 || n === 3);
    dots.forEach((d, j) => { d.classList.toggle('on', j + 1 === n); d.classList.toggle('done', j + 1 < n); });
    lines.forEach((l, j) => l.classList.toggle('on', j === n));
    // the closers count up once, 0 → 8, as the frame arrives
    cancelAnimationFrame(countT);
    counter.textContent = '0';
    if (n === 3) {
      const t0 = performance.now() + 450;
      const tick = t => { const q = clamp((t - t0) / 700); counter.textContent = Math.round(8 * sm(q)); if (q < 1) countT = requestAnimationFrame(tick); };
      countT = requestAnimationFrame(tick);
    }
  }

  /* ---------- smooth scroll, and settling on the nearer frame ---------- */
  const lenis = window.Lenis ? new Lenis({ lerp: .1, smoothWheel: true }) : null;
  window.__lenis = lenis; // lets a test jump straight to a scroll position
  const frameY = n => lab.offsetTop + span * (n === N - 1 ? 1 : (n + HOLD / 2) / (N - 1));
  let idle = 0;
  function settle() {
    const y = scrollY, a = lab.offsetTop, b = lab.offsetTop + span;
    if (y <= a + 4 || y >= b - 4) return;               // only inside the scene, never at its edges
    let best = 0, d = Infinity;
    for (let n = 0; n < N; n++) { const dd = Math.abs(frameY(n) - y); if (dd < d) { d = dd; best = n; } }
    if (d > 6) lenis ? lenis.scrollTo(frameY(best), { duration: .7 }) : scrollTo({ top: frameY(best), behavior: 'smooth' });
  }
  const onScroll = () => { clearTimeout(idle); if (snapOn) idle = setTimeout(settle, 180); };
  if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });

  function loop(t) { if (lenis) lenis.raf(t); render(false); requestAnimationFrame(loop); }
  addEventListener('resize', layout);
  layout();
  requestAnimationFrame(loop);
})();
