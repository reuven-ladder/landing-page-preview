// Why Ladder: the whole story as one GSAP timeline, played by scrolling.
// The desk is drawn into a single canvas from three pre-rendered layers; the monitors' screens are drawn
// live. The chapter text scrolls natively beside the scene (in a band below it on phones) and each
// chapter's start is pinned to the moment its text settles, so text and scene never drift apart.
// The playhead glides toward the scroll position (~1s), so a fast flick still plays as one motion.
// Lenis smooths the mouse wheel only; touch scrolling stays native. No scroll hijacking, no snapping.
(function () {
  if (!window.gsap) return;
  const W = 1600, H = 1000, TOP = 68;
  const stage = document.getElementById('stage'), story = document.getElementById('story');
  const canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => stage.querySelector(s), $$ = s => [...stage.querySelectorAll(s)];

  /* ---------- the desk: three layers, each with its place in the world and its parallax depth ---------- */
  const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const base = document.querySelector('link[href*="why.css"]').href.replace(/why\.css.*$/, 'lab/');
  let layers = [];
  Promise.all(['room', 'desk', 'person'].map(n => load(base + n + '.webp'))).then(([room, desk, person]) => {
    layers = [
      { img: room, x: 0, y: 0, w: 1600, h: 1000, d: 1 },
      { img: desk, x: 0, y: 440, w: 1600, h: 560, d: 1.05 },
      { img: person, x: 440, y: 600, w: 680, h: 400, d: 1.32 },
    ];
    dirty = true;
  });

  /* ---------- camera shots, in scene coordinates ---------- */
  const SHOT = {
    WIDE: { x: 100, y: 40, w: 1400, h: 960 }, JOB: { x: 40, y: 90, w: 1520, h: 900 },
    DEAD: { x: 600, y: 230, w: 820, h: 480 }, BIAS: { x: 290, y: 250, w: 1010, h: 420 },
    MON: { x: 690, y: 200, w: 640, h: 520 }, ENG: { x: 430, y: 300, w: 900, h: 700 },
    SIGN: { x: 560, y: 180, w: 860, h: 680 }, LOG: { x: 250, y: 110, w: 900, h: 560 },
  };
  const cam = r => ({ cx: r.x, cy: r.y, cw: r.w, ch: r.h });

  // everything the timeline animates; render() reads it
  const u = { ...cam(SHOT.WIDE), spec: 1, xl: 1, app: 0, night: 0,
    t0: 0, t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, n0: 0, n1: 0, n2: 0, q0: 0, q1: 0, q2: 0, q3: 0, b0: 0, b1: 0, b2: 0,
    dA: 0, dB: 0, link: 0, flag: 0, bub: 0, type: 0, reply: 0, num: 0, count: 0, by: 0, sig: 0, k0: 0, k1: 0, k2: 0, stamp: 0,
    log: 0, l0: 0, l1: 0, l2: 0, l3: 0, l4: 0, next: 0 };
  const pop = (k, at, d = .35, ease = 'back.out(1.6)') => tl.to(u, { [k]: 1, duration: d, ease }, at);
  const out = (ks, at) => tl.to(u, Object.assign({ duration: .3, ease: 'power1.in' }, ...ks.map(k => ({ [k]: 0 }))), at);
  const move = (r, at, d = .8, extra = {}) => tl.to(u, { ...cam(r), duration: d, ...extra }, at);

  // the story, in timeline seconds. Each chapter starts at its section's data-t.
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  // 01 · the job: a dozen sources around one desk
  move(SHOT.JOB, 1.2);
  ['t0', 't1', 't2', 't3', 't4', 't5'].forEach((k, i) => pop(k, 1.7 + i * .18));
  // 02 · under deadline: the day runs out, the documents keep coming
  out(['t0', 't1', 't2', 't3', 't4', 't5'], 3.4);
  move(SHOT.DEAD, 3.45, .75);
  tl.to(u, { night: .35, duration: 2, ease: 'none' }, 3.4);
  pop('n0', 4.0); pop('n1', 4.15); pop('n2', 4.3);
  ['q0', 'q1', 'q2', 'q3'].forEach((k, i) => pop(k, 4.4 + i * .3, .3, 'power3.out'));
  // 03 · the human limit
  out(['n0', 'n1', 'n2', 'q0', 'q1', 'q2', 'q3'], 5.6);
  move(SHOT.BIAS, 5.65, .7);
  tl.to(u, { night: .6, duration: 1.8, ease: 'none' }, 5.6);
  pop('b2', 6.3); pop('b0', 6.6); pop('b1', 6.9);
  // 04 · one finding, start to finish
  out(['b0', 'b1', 'b2'], 7.6);
  move(SHOT.MON, 7.65, .75);
  tl.to(u, { night: 0, duration: .8 }, 7.7)
    .to(u, { xl: 0, duration: .3 }, 7.8).to(u, { app: 1, duration: .4 }, 8.0).to(u, { spec: 0, duration: .5 }, 7.8);
  pop('dA', 8.4, .5, 'back.out(1.4)'); pop('dB', 8.6, .5, 'back.out(1.4)');
  pop('link', 9.6, .45, 'power2.out'); pop('flag', 9.95, .35, 'power2.out');
  out(['dA', 'dB', 'link', 'flag'], 10.9);
  move(SHOT.ENG, 11.0);
  pop('bub', 11.6, .4); tl.to(u, { type: 1, duration: 1.1, ease: 'none' }, 11.9); pop('reply', 13.3);
  out(['bub', 'reply'], 14.0);
  move(SHOT.MON, 14.05, .7);
  pop('num', 14.6, .45, 'power3.out'); tl.to(u, { count: 1, duration: .8, ease: 'power1.inOut' }, 14.9); pop('by', 15.75, .3, 'power2.out');
  out(['num', 'by'], 16.3);
  move(SHOT.SIGN, 16.3, .7);
  pop('sig', 16.7, .45, 'power3.out'); pop('k0', 17.0, .3, 'power2.out'); pop('k1', 17.15, .3, 'power2.out'); pop('k2', 17.3, .3, 'power2.out');
  pop('stamp', 17.6, .3, 'back.out(2.2)');
  // 05 · what carries forward
  out(['sig', 'k0', 'k1', 'k2', 'stamp'], 18.4);
  move(SHOT.LOG, 18.45, .75);
  pop('log', 19.0, .45, 'power3.out');
  ['l0', 'l1', 'l2', 'l3', 'l4'].forEach((k, i) => pop(k, 19.3 + i * .17, .3, 'power2.out'));
  pop('next', 20.3, .4);
  // 06 · working with Ladder: back to the whole desk
  out(['log', 'l0', 'l1', 'l2', 'l3', 'l4', 'next'], 20.8);
  move(SHOT.WIDE, 20.85, .9);
  tl.to({}, { duration: .8 }, 21.8);
  const STEPS = [7.6, 9.6, 11.0, 14.0, 16.3];
  const MOVE = .45;

  /* ---------- elements ---------- */
  const el = {
    toasts: $$('.toast'), wt: $$('.wt').map(n => ({ n, x: +n.dataset.x, y: +n.dataset.y, sx: 0, sy: 0 })),
    dA: $('.ldoc.a'), dB: $('.ldoc.b'), link: $('.link i'), linkB: $('.link b'), flag: $('.flag'), bub: $('.bubble'), type: $('.bubble span'), reply: $('.reply'),
    num: $('.num'), n: $('.num .n'), by: $('.num-by'), zero: $('.num-v s'), sig: $('.sig'), kv: $$('.sig .kv'), stamp: $('.stamp'),
    log: $('.log'), lg: $$('.lg'), next: $('.next'), steps: [...document.querySelectorAll('.fsteps li')],
  };
  // which timeline value shows each pinned thing
  let ti = 0, ni = 0, bi = 0;
  el.wt.forEach(w => { const c = w.n.classList; w.k = c.contains('tag') ? 't' + ti++ : c.contains('note') ? 'n' + ni++ : c.contains('bias') ? 'b' + bi++ : null; });
  const secs = [...story.querySelectorAll('.ch')].map(n => ({ n, tx: n.querySelector('.tx'), t: +n.dataset.t }));

  // style writes only when a value changes
  const put = (n, k, v) => { const c = n._c || (n._c = {}); if (c[k] !== v) { c[k] = v; n.style[k] = v; } };
  const show = (n, t, dy = 10, x = '') => {
    put(n, 'opacity', t.toFixed(3));
    put(n, 'visibility', t > .001 ? 'visible' : 'hidden');
    put(n, 'transform', `translate3d(0,${(dy * (1 - t)).toFixed(1)}px,0)${x}`);
  };

  /* ---------- layout: px from innerHeight; only a width change (or fonts arriving) re-lays out ---------- */
  let vw = 0, vh = 0, mobile = false, dpr = 1, sref = 1, lastW = -1, dirty = true, A = { x: 0, y: TOP, w: 1, h: 1 };
  let anchors = [], T = tl.duration();
  function layout(force) {
    if (!force && innerWidth === lastW) return;
    lastW = vw = innerWidth; vh = innerHeight; mobile = vw <= 760;
    dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    stage.style.height = vh + 'px';
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';

    // the text: sizes first, then section heights proportional to each chapter's time
    const k = vh * (mobile ? .55 : .5);
    secs.forEach(s => { s.n.style.height = ''; s.n.style.paddingTop = ''; s.tx.style.top = s.tx.style.bottom = ''; });
    secs.forEach(s => { s.th = s.tx.offsetHeight; });
    let band = 0;
    // Each section = its text + a hold. While the text is held in place, the chapter plays; while one
    // text hands over to the next, the camera makes its move (the first MOVE seconds of each chapter).
    secs.forEach((s, i) => {
      s.end = i + 1 < secs.length ? secs[i + 1].t : T;
      s.hold = Math.max(0, s.end - s.t - (i ? MOVE : 0)) * k;
      if (mobile) {
        // pinned to the bottom of the screen; the next chapter's text pushes it up
        s.pin = vh - 12 - s.th;
        s.tx.style.bottom = '12px';
        // the intro fills the first screen, so its text is in place from the start
        s.n.style.height = Math.round((i ? s.th : Math.max(s.th, vh - TOP - 12)) + s.hold) + 'px';
        if (i > 0 && i < secs.length - 1) band = Math.max(band, s.th + 24);
      } else {
        // held at the middle of the screen
        s.pin = Math.max(TOP + 24, TOP + (vh - TOP - s.th) / 2);
        s.tx.style.top = s.pin + 'px';
        s.n.style.paddingTop = (s.pin - TOP) + 'px';
        s.n.style.height = Math.round(s.pin - TOP + s.th + s.hold) + 'px';
      }
    });
    const y0 = scrollY;
    anchors = [];
    secs.forEach((s, i) => {
      s.top = s.n.getBoundingClientRect().top + y0; s.h = s.n.offsetHeight;
      const at = i ? (mobile ? s.top - s.pin : s.top - TOP) : 0;    // the moment its text settles
      anchors.push([at, i ? s.t + MOVE : 0], [at + s.hold, s.end]);
    });

    // where the scene sits: right of the text on desktop, above the text band on phones
    const col = mobile ? 0 : secs[0].n.offsetWidth;
    A = mobile ? { x: 0, y: TOP, w: vw, h: vh - TOP - Math.min(band, vh * .4) } : { x: col, y: TOP, w: vw - col - 16, h: vh - TOP };
    sref = Math.min(A.w / W, A.h / H);
    stage.style.setProperty('--ax', A.x + 'px'); stage.style.setProperty('--aw', A.w + 'px'); stage.style.setProperty('--ah', A.h + 'px');
    dirty = true;
  }

  // scroll position → story time, piecewise between the chapter anchors
  function timeAt(y) {
    if (y <= anchors[0][0]) return 0;
    for (let i = 1; i < anchors.length; i++) {
      const [a, ta] = anchors[i - 1], [b, tb] = anchors[i];
      if (y < b) return ta + (tb - ta) * (b > a ? (y - a) / (b - a) : 1);
    }
    return T;
  }

  // story time → scroll position (for tests and links)
  window.__whyY = t => { for (let i = 1; i < anchors.length; i++) { const [a, ta] = anchors[i - 1], [b, tb] = anchors[i]; if (t <= tb) return a + (b - a) * (tb > ta ? (t - ta) / (tb - ta) : 0); } return anchors[anchors.length - 1][0]; };

  /* ---------- render ---------- */
  let last = '', step = -1, cur = -1;
  function render(time, dt) {
    const y = scrollY, target = timeAt(y);
    cur = cur < 0 || reduce ? target : cur + (target - cur) * (1 - Math.exp(-(dt || 16) / 260));
    if (Math.abs(target - cur) < .001) cur = target;
    tl.time(cur);

    const key = [u.cx, u.cy, u.cw, u.ch, u.spec, u.xl, u.app, u.night].map(v => v.toFixed(3)).join();
    const moved = dirty || key !== last;
    if (moved) { draw(); last = key; dirty = false; }

    // things pinned in the room follow the camera
    if (moved) {
      const S = scale(), cx = u.cx + u.cw / 2, cy = u.cy + u.ch / 2, ax = A.x + A.w / 2, ay = A.y + A.h / 2;
      el.wt.forEach(w => { w.sx = ax + (w.x - cx) * S; w.sy = ay + (w.y - cy) * S; });
    }
    el.wt.forEach(w => {
      const t = w.k ? u[w.k] : 1;
      put(w.n, 'opacity', t.toFixed(3));
      put(w.n, 'visibility', t > .001 ? 'visible' : 'hidden');
      put(w.n, 'transform', `translate3d(${w.sx.toFixed(1)}px,${(w.sy + 8 * (1 - t)).toFixed(1)}px,0)`);
    });
    el.toasts.forEach((n, i) => show(n, u['q' + i], -10));

    show(el.dA, u.dA, 0, ` translateX(${(-40 * (1 - u.dA)).toFixed(1)}px)`);
    show(el.dB, u.dB, 0, ` translateX(${(40 * (1 - u.dB)).toFixed(1)}px)`);
    put(el.link, 'transform', mobile ? `scaleY(${u.link.toFixed(3)})` : `scaleX(${u.link.toFixed(3)})`);
    put(el.linkB, 'opacity', u.link.toFixed(3));
    show(el.flag, u.flag);
    show(el.bub, u.bub, 14);
    put(el.type, 'clipPath', `inset(0 ${(100 - 100 * u.type).toFixed(1)}% 0 0)`);
    show(el.reply, u.reply, -10);
    show(el.num, u.num, 16);
    const n = String(Math.round(8 * u.count)); if (el.n.textContent !== n) el.n.textContent = n;
    put(el.zero, 'opacity', Math.min(1, u.count * 3).toFixed(3));
    show(el.by, u.by, 6);
    show(el.sig, u.sig, 16);
    el.kv.forEach((n, i) => show(n, u['k' + i], 8));
    put(el.stamp, 'opacity', u.stamp.toFixed(3));
    put(el.stamp, 'transform', `rotate(-8deg) scale(${(1.6 - .6 * u.stamp).toFixed(3)})`);
    show(el.log, u.log, 16);
    el.lg.forEach((n, i) => show(n, u['l' + i], 6));
    show(el.next, u.next, 14);

    // the steps list follows the playhead
    const t = tl.time(), s = t < STEPS[0] - .01 ? -1 : STEPS.reduce((a, c, i) => (t >= c ? i : a), 0);
    if (s !== step) { step = s; el.steps.forEach((li, i) => { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); }); }

    // chapter text: fades as it leaves its place
    secs.forEach(c => {
      let top;
      if (mobile) top = Math.max(c.top - y, Math.min(c.top + c.h - c.th - y, c.pin));
      else top = Math.min(Math.max(c.pin, c.top + c.pin - TOP - y), c.top + c.h - c.th - y);
      const off = c.pin - top, o = off > 0 ? 1 - off / (mobile ? c.th * .8 : vh * .3) : 1 - (-off) / (mobile ? vh : vh * .6);
      put(c.tx, 'opacity', Math.max(0, Math.min(1, o)).toFixed(2));
    });
  }

  const scale = () => Math.min(A.w / u.cw, A.h / u.ch);
  function draw() {
    const S = scale(), cx = u.cx + u.cw / 2, cy = u.cy + u.ch / 2, ax = A.x + A.w / 2, ay = A.y + A.h / 2;
    const z = S / sref;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#fafaf7'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    layers.forEach((L, i) => {
      const k = S * Math.pow(Math.max(z, 1), L.d - 1), px = cx + (cx - 800) * (L.d - 1) * .6, py = cy + (cy - 640) * (L.d - 1) * .6;
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (ax - px * k), dpr * (ay - py * k));
      ctx.drawImage(L.img, L.x, L.y, L.w, L.h);
      if (i === 0) { screens(); }
    });
    // evening: the room dims, the screens stay lit
    if (u.night > .002) {
      ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * (ax - cx * S), dpr * (ay - cy * S));
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(120,132,180,${(u.night * .45).toFixed(3)})`;
      ctx.beginPath(); ctx.rect(-2000, -2000, 6000, 5000); ctx.rect(744, 304, 532, 302); ctx.rect(312, 342, 376, 246); ctx.fill('evenodd');
      ctx.globalCompositeOperation = 'source-over';
    }
    // desktop: the scene fades out under the text column
    if (!mobile && A.x > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(A.x - 120, 0, A.x + 80, 0);
      g.addColorStop(0, 'rgba(250,250,247,1)'); g.addColorStop(1, 'rgba(250,250,247,0)');
      ctx.fillStyle = '#fafaf7'; ctx.fillRect(0, 0, A.x - 120, vh);
      ctx.fillStyle = g; ctx.fillRect(A.x - 120, 0, 200, vh);
    }
  }

  /* ---------- the monitors, drawn in scene coordinates ---------- */
  const MONO = '"JetBrains Mono", ui-monospace, monospace', DISP = '"Wix Madefor Display", sans-serif';
  function screens() {
    // left: the spec, page 900, until the agents' marked-up drawings take over
    if (u.spec > .002) {
      ctx.globalAlpha = u.spec;
      ctx.fillStyle = '#f6f6f2'; ctx.fillRect(312, 342, 376, 246);
      ctx.fillStyle = '#2b2b29'; ctx.fillRect(312, 342, 376, 18);
      ctx.fillStyle = '#fff'; ctx.font = `600 8px ${MONO}`; ctx.fillText('Project_Manual_Vol2.pdf', 320, 354);
      ctx.fillStyle = '#bdbdb6'; ctx.fillText('Page 900 of 1,186', 600, 354);
      ctx.fillStyle = '#fff'; ctx.fillRect(352, 368, 296, 214);
      ctx.fillStyle = '#1d1d1b'; ctx.font = `700 8.5px ${MONO}`; ctx.fillText('SECTION 08 71 00 · DOOR HARDWARE', 366, 386);
      ctx.font = `600 8px ${MONO}`; ctx.fillText('2.4  HARDWARE SETS', 366, 402);
      ctx.fillStyle = '#e4e4de'; [[414, 260], [426, 240], [438, 252], [456, 200], [468, 262], [480, 230], [498, 256], [510, 190], [528, 244], [540, 262], [552, 210]].forEach(([yy, w]) => ctx.fillRect(366, yy, w, 6));
      ctx.globalAlpha = 1;
    }
    // main: the spreadsheet, then Ladder
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(744, 304, 532, 302);
    if (u.xl > .002) { ctx.globalAlpha = u.xl; sheet(); ctx.globalAlpha = 1; }
    if (u.app > .002) { ctx.globalAlpha = u.app; ladder(); ctx.globalAlpha = 1; }
  }
  const ROWS = [
    ['03 30 00', 'Cast-in-place concrete', '640', 'CY', '245.00', '156,800'],
    ['07 54 23', 'TPO roofing', '18,900', 'SF', '21.40', '404,460', 'anchor'],
    ['08 71 00', 'Door hardware', '?', 'EA', '', '#REF!', 'err'],
    ['09 29 00', 'Gypsum board', '46,000', 'SF', '3.10', '142,600'],
    ['22 00 00', 'Plumbing', '1', 'LS', 'allow.', '210,000'],
    ['23 00 00', 'HVAC', '54,000', 'SF', '8.40', '453,600'],
    ['', 'Contingency', '', '', '2%', '36,273', 'opt'],
    ['', 'Total', '', '', '', '1,849,933', 'tot'],
  ];
  const COLX = [752, 806, 960, 1004, 1046, 1112];
  function sheet() {
    ctx.fillStyle = '#e9e9e4'; ctx.fillRect(744, 304, 532, 18);
    ctx.fillStyle = '#1d1d1b'; ctx.font = `600 8.5px ${MONO}`; ctx.fillText('Estimate_v7_FINAL(3).xlsx', 752, 316);
    ctx.fillStyle = '#b5482a'; ctx.fillText('(Not Responding)', 900, 316);
    ctx.fillStyle = '#fff'; ctx.fillRect(744, 322, 532, 16);
    ctx.fillStyle = '#7a7a74'; ctx.font = `500 8px ${MONO}`; ctx.fillText("F4   fx   ='Last job rates'!F12", 752, 333);
    ctx.fillStyle = '#f1f1ec'; ctx.fillRect(744, 340, 532, 16);
    ctx.fillStyle = '#5b5b56'; ctx.font = `700 8px ${MONO}`;
    ['Code', 'Description', 'Qty', 'Unit', 'Rate', 'Total'].forEach((h, i) => ctx.fillText(h, COLX[i], 351));
    ROWS.forEach((r, j) => {
      const yy = 356 + j * 21;
      ctx.fillStyle = '#e6e6e0'; ctx.fillRect(744, yy + 20, 532, 1);
      if (r[6] === 'tot') { ctx.fillStyle = '#f1f1ec'; ctx.fillRect(744, yy, 532, 20); }
      ctx.font = `${r[6] === 'tot' ? 700 : 500} 9px ${MONO}`;
      r.slice(0, 6).forEach((c, i) => {
        ctx.fillStyle = (r[6] === 'err' && (i === 2 || i === 5)) ? '#d9480f' : '#2b2b29';
        ctx.fillText(c, COLX[i], yy + 14);
      });
      // the shortcuts, called out in chapter 03
      const hot = (r[6] === 'anchor' && u.b0) || (r[6] === 'opt' && u.b1) || 0;
      if (hot > .01) { ctx.strokeStyle = `rgba(217,72,15,${hot})`; ctx.lineWidth = 2; ctx.strokeRect(COLX[4] - 4, yy + 2, 56, 17); }
    });
    ctx.fillStyle = '#ecece6'; ctx.fillRect(744, 590, 532, 16);
    ctx.fillStyle = '#5b5b56'; ctx.font = `500 7.5px ${MONO}`; ctx.fillText('Estimate   Takeoff   Last job rates   Sheet4', 752, 601);
  }
  function ladder() {
    ctx.fillStyle = '#1d1d1b'; ctx.font = `700 15px ${DISP}`; ctx.fillText('Ladder', 756, 326);
    ctx.fillStyle = '#3F63D5'; ctx.fillText('.', 806, 326);
    ctx.fillStyle = '#8a8a84'; ctx.font = `500 8px ${MONO}`; ctx.fillText('Sample project · DD estimate', 830, 324);
    ctx.fillStyle = '#d6d6d0'; ctx.fillRect(756, 336, 508, 1);
    // trade packages
    ctx.font = `600 8px ${MONO}`;
    [['03–05 Structure', 1], ['07 Envelope', 1], ['08 Openings', .7], ['09 Finishes', .5], ['21–28 MEP', .4]].forEach(([n, p], i) => {
      const yy = 352 + i * 30;
      ctx.fillStyle = '#2b2b29'; ctx.fillText(n, 756, yy);
      ctx.fillStyle = '#ecece6'; ctx.fillRect(756, yy + 6, 120, 4);
      ctx.fillStyle = p === 1 ? '#1f9d55' : '#3F63D5'; ctx.fillRect(756, yy + 6, 120 * p, 4);
    });
    ctx.fillStyle = '#ecece6'; [[352, 340], [372, 300], [392, 360], [412, 250], [442, 330], [462, 290], [482, 350], [512, 270], [532, 320]].forEach(([yy, w]) => ctx.fillRect(900, yy, w, 8));
  }

  /* ---------- scroll: Lenis for the wheel (touch stays native) ---------- */
  const lenis = window.Lenis && !reduce ? new Lenis({ lerp: .12, smoothWheel: true, anchors: true }) : null;
  window.__lenis = lenis;
  gsap.ticker.lagSmoothing(0);
  if (lenis) gsap.ticker.add(t => lenis.raf(t * 1000));

  layout(true);
  if (document.fonts) document.fonts.ready.then(() => layout(true));
  addEventListener('resize', () => layout());
  gsap.ticker.add(render);

  // the stage hides once the story has scrolled away
  const io = new IntersectionObserver(([e]) => stage.classList.toggle('off', !e.isIntersecting));
  io.observe(story);
})();
