/* The screen wall as a drifting field (after Koto's Workday page), tablet and up.
   Three depths of member-app screens float upwards at different speeds: the far layer small and
   soft, the middle one sharp, the near one large and out of focus. Each column holds its cards
   twice, so moving it up by one set's height and wrapping round loops without a seam.
   Phones, reduced motion and no-JS keep the static wall image. Only transforms animate, and only
   while the wall is on screen. */
(() => {
  const fig = document.querySelector('[data-wall-drift]');
  if (!fig) return;
  if (matchMedia('(max-width: 700px), (max-height: 500px) and (orientation: landscape)').matches) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const S = 'images/screens/', N = 'images/native/';
  const SHOTS = [
    S + 'smart-dashboard.jpg', N + 'ios-smart-light-home.jpg', S + 'zurich-rtl-dashboard.jpg', S + 'niac-dark-dashboard.jpg',
    S + 'keystone-light-dashboard.jpg', N + 'android-zurich-rtl-dark-home.jpg', S + 'smart-contributions.jpg', S + 'zurich-dark-dashboard.jpg',
    N + 'ios-smart-light-pension.jpg', S + 'zurich-rtl-investments.jpg', S + 'keystone-dark-dashboard.jpg', S + 'smart-balance.jpg',
    N + 'android-zurich-rtl-dark-investments.jpg', S + 'niac-light-dashboard.jpg', S + 'smart-beneficiaries.jpg', N + 'ios-smart-light-investments.jpg',
    S + 'zurich-rtl-contributions.jpg', S + 'smart-dark-dashboard.jpg', N + 'android-zurich-rtl-dark-pension.jpg', S + 'smart-investments.jpg',
    S + 'zurich-light-dashboard.jpg', N + 'ios-smart-light-account.jpg', S + 'zurich-rtl-balance.jpg', S + 'smart-retirementOptions.jpg',
    N + 'android-zurich-rtl-dark-account.jpg', S + 'smart-light-dashboard.jpg', S + 'zurich-rtl-beneficiaries.jpg', N + 'ios-smart-light-sheet.jpg',
    N + 'android-zurich-rtl-dark-sheet.jpg', N + 'ios-smart-light-bio.jpg',
  ];
  // depth: card width (share of the stage's width), speed (px/s at 1000px wide), blur, columns (x centre, %)
  const LAYERS = [
    { w: .075, speed: 14, blur: 2.5, opacity: .75, cols: [9, 34, 58, 90], z: 1, drift: 6,  n: 3, gap: [150, 260] },
    { w: .12,  speed: 26, blur: 0,   opacity: 1,   cols: [21, 47, 76],    z: 2, drift: 14, n: 2, gap: [110, 200] },
    { w: .16,  speed: 44, blur: 7,   opacity: .95, cols: [4, 64],         z: 3, drift: 28, n: 1, gap: [260, 260] },
  ];

  const stage = document.createElement('div');
  stage.className = 'wd-stage';
  stage.setAttribute('aria-hidden', 'true');
  let k = 0;
  const cols = [];
  LAYERS.forEach((L, li) => {
    const layer = document.createElement('div');
    layer.className = 'wd-layer';
    layer.style.cssText = `z-index:${L.z};opacity:${L.opacity}`;
    L.cols.forEach((x, ci) => {
      const col = document.createElement('div');
      col.className = 'wd-col';
      col.style.left = x + '%';
      if (L.blur) col.style.filter = `blur(${L.blur}px)`;   // on the column's own GPU layer, so it isn't redrawn as it moves
      col.style.setProperty('--w', (L.w * 100) + '%');
      // a card or two a column, far apart, with uneven gaps, then the same again for the loop
      const n = L.n;
      const set = [];
      for (let i = 0; i < n; i++) set.push({ src: SHOTS[k++ % SHOTS.length], gap: L.gap[0] + ((ci * 37 + i * 53 + li * 19) % (L.gap[1] - L.gap[0] + 1)) });
      [0, 1].forEach(() => set.forEach((c) => {
        const card = document.createElement('div');
        card.className = 'wd-card';
        card.style.marginBottom = c.gap + '%';
        const img = document.createElement('img');
        img.src = c.src; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
        card.appendChild(img);
        col.appendChild(card);
      }));
      layer.appendChild(col);
      // columns in one layer start at different heights and move at slightly different speeds
      cols.push({ el: col, L, n, offset: ((ci * 0.37 + li * 0.21) % 1), speed: L.speed * (0.9 + ((ci * 7) % 5) * 0.05) });
    });
    stage.appendChild(layer);
  });

  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'wd-pause';
  pause.setAttribute('aria-label', 'Pause the moving screens');
  pause.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  fig.classList.add('wd-on');
  fig.appendChild(stage);
  fig.appendChild(pause);

  // each column's loop length is one set of cards; measured, since cards scale with the stage
  let W = 0, H = 0;
  const measure = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    cols.forEach((c) => {
      const cards = c.el.children;
      c.loop = cards[c.n].offsetTop - cards[0].offsetTop;
    });
  };

  let px = 0, py = 0, tx = 0, ty = 0;   // the pointer, eased: each layer leans a little with it
  stage.parentElement.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - .5;
    ty = (e.clientY - r.top) / r.height - .5;
  });
  stage.parentElement.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

  let t = 0, last = 0, running = false, visible = false, paused = reduced, raf = 0;
  const frame = (now) => {
    raf = 0;
    const dt = last ? Math.min(now - last, 50) / 1000 : 0;
    last = now;
    if (!paused) t += dt;
    px += (tx - px) * .06; py += (ty - py) * .06;
    const scale = W / 1000;
    for (const c of cols) {
      if (!c.loop) continue;
      const y = (c.offset * c.loop + t * c.speed * scale) % c.loop;
      c.el.style.transform = `translate3d(${(-px * c.L.drift).toFixed(2)}px, ${(-y - py * c.L.drift).toFixed(2)}px, 0)`;
    }
    if (visible && (!paused || Math.abs(tx - px) + Math.abs(ty - py) > .001)) raf = requestAnimationFrame(frame);
    else { running = false; last = 0; }
  };
  const start = () => { if (!running && visible) { running = true; raf = requestAnimationFrame(frame); } };

  pause.addEventListener('click', () => {
    paused = !paused;
    pause.classList.toggle('is-paused', paused);
    pause.setAttribute('aria-label', paused ? 'Play the moving screens' : 'Pause the moving screens');
    pause.innerHTML = paused
      ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7.5-4.5z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    start();
  });
  if (reduced) pause.hidden = true;
  stage.addEventListener('pointermove', start);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { measure(); start(); } }, { rootMargin: '100px 0px' }).observe(stage);
  addEventListener('resize', () => { measure(); start(); });
  // card heights are known up front (aspect-ratio), but re-measure once images have arrived anyway
  addEventListener('load', measure);
  measure();
  start();
})();
