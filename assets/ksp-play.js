/* The mini Keystone prototype (see ksp-play.css). App, brand, theme and direction load the app with
   ?brand= &theme= &dir= &chrome=0 in a second frame, which fades in over the first once it has drawn.
   Screen size doesn't reload: the live frame is resized between desktop and phone widths, so the
   layout visibly responds on the way (Paul). */
(() => {
  const root = document.querySelector('.ksp-play');
  if (!root) return;
  const panel = root.querySelector('.ksp-panel');
  const stage = root.querySelector('.ksp-stage');
  const device = root.querySelector('.ksp-device');
  const phone = matchMedia('(max-width: 700px)');
  const st = { app: 'member', brand: 'smart', theme: 'light', dir: 'ltr', view: phone.matches ? 'mobile' : 'large' };
  const SIZE = { large: [1280, 800], mobile: [390, 844] };
  const NAMES = { smart: 'Smart', zurich: 'Zurich', niac: 'New Ireland', keystone: 'Keystone' };
  let frame = null, started = false;

  const RIM = 8;   // the device's border (ksp-play.css), outside the scaled screen
  let cur = SIZE[st.view].slice(), tween = 0;   // the frame's size in CSS px, as the app sees it
  const scaleFor = (view, w, h) => {
    const room = stage.clientWidth - 2 * RIM;
    return view === 'large' ? Math.min(1, Math.min(room, 1240) / w) : Math.min(1, room / w, (phone.matches ? 560 : 620) / h);
  };
  const apply = (w, h, s) => {
    device.style.width = Math.round(w * s) + 'px';
    device.style.height = Math.round(h * s) + 'px';
    device.querySelectorAll('iframe').forEach((f) => { f.style.width = w + 'px'; f.style.height = h + 'px'; f.style.transform = `scale(${s})`; });
  };
  // the stage keeps the taller of the two shapes, so switching never moves the page below it
  const hold = () => { stage.style.minHeight = Math.round(Math.max(...['large', 'mobile'].map((v) => SIZE[v][1] * scaleFor(v, ...SIZE[v])))) + 2 * RIM + 'px'; };
  const fit = () => { hold(); if (!tween) apply(cur[0], cur[1], scaleFor(st.view, cur[0], cur[1])); };
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const resizeTo = (view) => {
    cancelAnimationFrame(tween);
    const from = cur.slice(), to = SIZE[view];
    const s0 = parseFloat((device.querySelector('iframe') || {}).style?.transform?.slice(6)) || scaleFor(view, from[0], from[1]);
    const s1 = scaleFor(view, to[0], to[1]);
    const t0 = performance.now(), D = 750;
    const step = (now) => {
      const k = ease(Math.min(1, (now - t0) / D));
      cur = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k];
      apply(Math.round(cur[0]), Math.round(cur[1]), s0 + (s1 - s0) * k);
      tween = k < 1 ? requestAnimationFrame(step) : 0;
      if (!tween) { cur = to.slice(); fit(); }
    };
    tween = requestAnimationFrame(step);
  };
  const load = () => {
    const [w, h] = cur;
    const f = document.createElement('iframe');
    f.title = `Keystone prototype: ${st.app} app, ${NAMES[st.brand]}, ${st.theme}, ${st.dir === 'rtl' ? 'Arabic' : 'English'}, ${st.view === 'large' ? 'large screen' : 'mobile'}`;
    f.loading = 'eager';
    f.style.width = w + 'px'; f.style.height = h + 'px';
    f.src = `proto/apps/${st.app}/index.html?chrome=0&brand=${st.brand}&theme=${st.theme}&dir=${st.dir}`;
    const old = frame;
    frame = f;
    f.addEventListener('load', () => {
      if (frame !== f) { f.remove(); return; }
      // a still view: no scrollbars inside the frame (in RTL they sit on the left edge)
      try {
        const d = f.contentDocument, st = d.createElement('style');
        st.textContent = 'html,body{overflow:hidden!important;scrollbar-width:none}::-webkit-scrollbar{display:none}';
        d.head.appendChild(st);
      } catch (e) {}
      setTimeout(() => {   // a frame for React to draw
        f.classList.add('is-in');
        if (old) setTimeout(() => old.remove(), 380);
      }, 120);
    }, { once: true });
    device.appendChild(f);
    fit();
  };
  const sync = () => {
    panel.dataset.theme = st.theme;
    stage.dataset.view = st.view;
    root.querySelectorAll('.ksp-seg button').forEach((b) => b.setAttribute('aria-pressed', String(st[b.dataset.k] === b.dataset.v)));
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.ksp-seg button');
    if (!b || st[b.dataset.k] === b.dataset.v) return;
    st[b.dataset.k] = b.dataset.v;
    sync();
    if (b.dataset.k === 'view') { if (frame) resizeTo(st.view); else { cur = SIZE[st.view].slice(); fit(); } return; }
    load();
  });
  sync();
  fit();
  new ResizeObserver(fit).observe(stage);
  phone.addEventListener('change', () => { if (phone.matches && st.view !== 'mobile') { st.view = 'mobile'; sync(); resizeTo('mobile'); } else fit(); });
  // only start the app once the panel is near the screen
  new IntersectionObserver((es, io) => {
    if (es.some((x) => x.isIntersecting)) { io.disconnect(); started = true; load(); }
  }, { rootMargin: '600px 0px' }).observe(root);
})();
