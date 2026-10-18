// Why Ladder lab v3: reddgrow's recipe.
// One GSAP timeline holds the whole story as authored, eased moves. ScrollTrigger scrubs it with
// `scrub: 1`, so the playhead glides toward the scroll position (fast flicks still play as one fluid
// motion, on touch too). The desk is drawn into a single canvas; a few small cards sit on top.
// Lenis smooths the mouse wheel only; touch scrolling stays native. No pinning, no snapping.
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const W = 1600, H = 1000, TOP = 68;
  const stage = document.getElementById('stage3'), story = document.getElementById('story');
  const canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => stage.querySelector(s), $$ = s => [...stage.querySelectorAll(s)];

  /* ---------- the desk: three pre-rendered layers, each with its place in the world and its parallax depth ---------- */
  const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const base = canvas.closest('html').querySelector('link[href*="lab.css"]').href.replace(/lab\.css.*$/, '');
  let layers = [];
  Promise.all(['room', 'desk', 'person'].map(n => load(base + n + '.webp'))).then(([room, desk, person]) => {
    layers = [
      { img: room, x: 0, y: 0, w: 1600, h: 1000, d: 1 },
      { img: desk, x: 0, y: 440, w: 1600, h: 560, d: 1.05 },
      { img: person, x: 440, y: 600, w: 680, h: 400, d: 1.32 },
    ];
    dirty = true;
  });

  /* ---------- state the timeline animates; render() reads it ---------- */
  const WIDE = { x: 150, y: 40, w: 1300, h: 960 }, MON = { x: 690, y: 200, w: 640, h: 520 };
  const ENG = { x: 430, y: 300, w: 900, h: 700 }, SIGN = { x: 560, y: 180, w: 860, h: 680 };
  const u = { cx: WIDE.x, cy: WIDE.y, cw: WIDE.w, ch: WIDE.h, screen: 0,
    dA: 0, dB: 0, link: 0, flag: 0, bub: 0, type: 0, reply: 0, num: 0, count: 0, by: 0, sig: 0, k1: 0, k2: 0, k3: 0, stamp: 0 };
  const cam = r => ({ cx: r.x, cy: r.y, cw: r.w, ch: r.h });

  // the story, in timeline seconds; the scroll length is proportional
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  tl.to(u, { ...cam(MON), duration: 1 }, 1)                              // 0 → 1: from the desk to the monitor
    .to(u, { screen: 1, duration: .4 }, 1.6)
    .to(u, { dA: 1, duration: .5, ease: 'back.out(1.4)' }, 2)              // 1 · two documents disagree
    .to(u, { dB: 1, duration: .5, ease: 'back.out(1.4)' }, 2.15)
    .to(u, { link: 1, duration: .4, ease: 'power2.out' }, 2.55)
    .to(u, { flag: 1, duration: .35, ease: 'power2.out' }, 2.85)
    .to(u, { dA: 0, dB: 0, link: 0, flag: 0, screen: 0, duration: .35, ease: 'power1.in' }, 3.8)
    .to(u, { ...cam(ENG), duration: .9 }, 3.9)                             // 2 · the engineer asks
    .to(u, { bub: 1, duration: .4, ease: 'back.out(1.6)' }, 4.6)
    .to(u, { type: 1, duration: .9, ease: 'none' }, 4.8)
    .to(u, { reply: 1, duration: .35, ease: 'back.out(1.6)' }, 5.75)
    .to(u, { bub: 0, reply: 0, duration: .3, ease: 'power1.in' }, 6.4)
    .to(u, { ...cam(MON), screen: 1, duration: .8 }, 6.45)                 // 3 · the number changes
    .to(u, { num: 1, duration: .45, ease: 'power3.out' }, 7.05)
    .to(u, { count: 1, duration: .8, ease: 'power1.inOut' }, 7.35)
    .to(u, { by: 1, duration: .3 }, 8.05)
    .to(u, { num: 0, by: 0, duration: .3, ease: 'power1.in' }, 8.8)
    .to(u, { ...cam(SIGN), duration: .8 }, 8.8)                            // 4 · signed
    .to(u, { sig: 1, duration: .45, ease: 'power3.out' }, 9.2)
    .to(u, { k1: 1, duration: .3, ease: 'power2.out' }, 9.5)
    .to(u, { k2: 1, duration: .3, ease: 'power2.out' }, 9.65)
    .to(u, { k3: 1, duration: .3, ease: 'power2.out' }, 9.8)
    .to(u, { stamp: 1, duration: .3, ease: 'back.out(2.2)' }, 10.1)
    .to({}, { duration: .9 }, 10.4);                                       // a last beat to read it
  const CAPS = [0, 1.6, 3.8, 6.4, 8.8];                                    // where each caption line takes over

  /* ---------- layout: sizes in px from innerHeight; only a width change re-lays out ---------- */
  let vw = 0, vh = 0, mobile = false, dpr = 1, sref = 1, lastW = -1, dirty = true;
  function layout() {
    if (innerWidth === lastW) return;
    lastW = vw = innerWidth; vh = innerHeight; mobile = vw <= 760;
    dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    sref = mobile ? (vh - TOP) / H : Math.min(vw / W, (vh - TOP) / H);
    stage.style.height = vh + 'px';
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
    story.style.height = Math.round(vh * (mobile ? 6.5 : 6)) + 'px';
    dirty = true;
    ScrollTrigger.refresh();
  }

  /* ---------- render: the canvas only when the camera moved; cards from the same state ---------- */
  let last = '';
  const set = (n, t, dy = 10, extra = '') => { n.style.opacity = t.toFixed(3); n.style.transform = `translate3d(0,${(dy * (1 - t)).toFixed(1)}px,0)${extra}`; n.style.visibility = t > .001 ? 'visible' : 'hidden'; };
  const el = { dA: $('.ldoc.a'), dB: $('.ldoc.b'), link: $('.link i'), linkB: $('.link b'), flag: $('.flag'), bub: $('.bubble'), type: $('.bubble span'), reply: $('.reply'),
    num: $('.num'), n: $('.num .n'), by: $('.num-by'), zero: $('.num-v s'), sig: $('.sig'), kv: $$('.sig .kv'), stamp: $('.stamp'), dots: $$('.dots i'), lines: $$('.st p') };
  let line = -1;
  function render() {
    const key = [u.cx, u.cy, u.cw, u.ch, u.screen].map(v => v.toFixed(2)).join();
    if (dirty || key !== last) { draw(); last = key; dirty = false; }
    set(el.dA, u.dA, 0, ` translateX(${(-40 * (1 - u.dA)).toFixed(1)}px)`);
    set(el.dB, u.dB, 0, ` translateX(${(40 * (1 - u.dB)).toFixed(1)}px)`);
    el.link.style.transform = mobile ? `scaleY(${u.link.toFixed(3)})` : `scaleX(${u.link.toFixed(3)})`;
    el.linkB.style.opacity = u.link.toFixed(3);
    set(el.flag, u.flag);
    set(el.bub, u.bub, 14);
    el.type.style.clipPath = `inset(0 ${(100 - 100 * u.type).toFixed(1)}% 0 0)`;
    set(el.reply, u.reply, -10);
    set(el.num, u.num, 16);
    el.n.textContent = Math.round(8 * u.count);
    el.zero.style.opacity = Math.min(1, u.count * 3).toFixed(3);
    set(el.by, u.by, 6);
    set(el.sig, u.sig, 16);
    [u.k1, u.k2, u.k3].forEach((t, i) => set(el.kv[i], t, 8));
    el.stamp.style.opacity = u.stamp.toFixed(3);
    el.stamp.style.transform = `rotate(-8deg) scale(${(1.6 - .6 * u.stamp).toFixed(3)})`;
    // caption follows the playhead
    const t = tl.time(), now = CAPS.reduce((a, c, i) => (t >= c ? i : a), 0);
    if (now !== line) {
      line = now;
      el.lines.forEach((p, i) => p.classList.toggle('on', i === now));
      el.dots.forEach((d, i) => { d.classList.toggle('on', i + 1 === now); d.classList.toggle('done', i + 1 < now); });
    }
  }

  function draw() {
    const A = { x: 0, y: TOP, w: vw, h: vh - TOP - (mobile ? 140 : 0) };
    const S = Math.min(A.w / u.cw, A.h / u.ch), cx = u.cx + u.cw / 2, cy = u.cy + u.ch / 2, ax = A.x + A.w / 2, ay = A.y + A.h / 2;
    const z = S / sref;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#fafaf7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    layers.forEach((L, i) => {
      const k = S * Math.pow(Math.max(z, 1), L.d - 1), px = cx + (cx - 800) * (L.d - 1) * .6, py = cy + (cy - 640) * (L.d - 1) * .6;
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (ax - px * k), dpr * (ay - py * k));
      ctx.drawImage(L.img, L.x, L.y, L.w, L.h);
      if (i === 0) screen();
    });
  }
  // the main monitor's screen: Ladder, lit up while the cards sit on it
  function screen() {
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(744, 304, 532, 302);
    ctx.globalAlpha = .35 + .65 * u.screen;
    ctx.fillStyle = '#1d1d1b'; ctx.font = '700 15px "Wix Madefor Display", sans-serif'; ctx.fillText('Ladder', 756, 326);
    ctx.fillStyle = '#3F63D5'; ctx.fillText('.', 806, 326);
    ctx.fillStyle = '#d6d6d0'; ctx.fillRect(756, 336, 508, 1);
    ctx.fillStyle = '#ecece6'; [[350, 400], [368, 460], [386, 300], [404, 420]].forEach(([y, w]) => ctx.fillRect(756, y, w, 9));
    ctx.globalAlpha = 1;
  }

  /* ---------- scroll: Lenis for the wheel (touch stays native), ScrollTrigger scrubs with a 1s glide ---------- */
  const lenis = window.Lenis ? new Lenis({ lerp: .12, smoothWheel: true }) : null;
  if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); }
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;

  layout();
  ScrollTrigger.create({ trigger: story, start: 'top top', end: 'bottom bottom', animation: tl, scrub: reduce ? true : 1 });
  ScrollTrigger.create({ trigger: story, start: 'top bottom', end: 'bottom top', toggleClass: { targets: stage, className: 'on' } });
  gsap.ticker.add(render);
  addEventListener('resize', layout);
})();
