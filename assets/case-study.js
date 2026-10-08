// Case study page: reading progress, reveal on scroll, carousels and a full-size image view.
// Carousels and the full-size view work like the AI log (ai.paultinker.uk).
(() => {
  document.documentElement.classList.add('js');

  const bar = document.querySelector('.progress');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const io = 'IntersectionObserver' in window && new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach((el) => io ? io.observe(el) : el.classList.add('in'));

  // Carousels: arrows and arrow keys move one image; the counter follows swipes too.
  document.querySelectorAll('.carousel').forEach((c) => {
    const track = c.querySelector('.carousel-track');
    const slides = [...track.children];
    const prev = c.querySelector('.carousel-prev');
    const next = c.querySelector('.carousel-next');
    const count = c.querySelector('.carousel-count');
    const index = () => Math.round(track.scrollLeft / (track.clientWidth || 1));
    const go = (i) => track.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * track.clientWidth });
    const update = () => {
      const i = index();
      count.textContent = (i + 1) + ' / ' + slides.length;
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    };
    prev.addEventListener('click', () => go(index() - 1));
    next.addEventListener('click', () => go(index() + 1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
    });
    track.addEventListener('scroll', update, { passive: true });
    update();
  });

  // Back to top. The top bar is sticky, so linking to it would not scroll: go to the very top instead.
  document.querySelectorAll('.to-top').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    // Move focus to the page heading (not the skip link, which would pop into view),
    // so keyboard users carry on from the top.
    const h1 = document.querySelector('h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  }));

  // App tabs: arrow keys move between tabs; the carousel in the shown panel starts at its first slide.
  document.querySelectorAll('.app-tabs').forEach((box) => {
    const tabs = [...box.querySelectorAll('[role=tab]')];
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) { const tr = panel.querySelector('.carousel-track'); if (tr) { tr.scrollLeft = 0; tr.dispatchEvent(new Event('scroll')); } }
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); }
      });
    });
  });

  // Click an image to view it full size (Esc, or a click on the picture, closes it).
  const lightbox = document.createElement('dialog');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('aria-label', 'Enlarged image');
  lightbox.innerHTML = '<img alt="">'
    + '<div class="lightbox-nav">'
    + '<button type="button" class="lightbox-prev" aria-label="Previous image">&larr;</button>'
    + '<span class="lightbox-count" aria-live="polite"></span>'
    + '<button type="button" class="lightbox-next" aria-label="Next image">&rarr;</button>'
    + '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>'
    + '</div>';
  document.body.appendChild(lightbox);
  const big = lightbox.querySelector('img');
  const nav = lightbox.querySelector('.lightbox-nav');
  const lbCount = lightbox.querySelector('.lightbox-count');
  const lbPrev = lightbox.querySelector('.lightbox-prev');
  const lbNext = lightbox.querySelector('.lightbox-next');
  let group = [], at = 0;

  const show = (i) => {
    at = Math.max(0, Math.min(group.length - 1, i));
    const img = group[at];
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    const many = group.length > 1;
    lbPrev.hidden = lbNext.hidden = lbCount.hidden = !many;
    lbCount.textContent = (at + 1) + ' / ' + group.length;
    lbPrev.disabled = at === 0;
    lbNext.disabled = at === group.length - 1;
    const track = img.closest('.carousel-track');
    if (track) track.scrollTo({ left: at * track.clientWidth, behavior: 'auto' });
  };
  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); show(at - 1); });
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); show(at + 1); });
  nav.addEventListener('click', (e) => e.stopPropagation());
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
  });

  const open = (img) => {
    const track = img.closest('.carousel-track');
    group = track ? [...track.querySelectorAll('img.zoom')] : [img];
    show(group.indexOf(img));
    lightbox.showModal();
  };
  document.querySelectorAll('img.zoom').forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-haspopup', 'dialog');
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  });

  // Links that open an overlay on this page (the InVision article).
  document.querySelectorAll('[data-dialog]').forEach((a) => {
    const dlg = document.getElementById(a.dataset.dialog);
    if (!dlg) return;
    a.removeAttribute('target');
    a.addEventListener('click', (e) => { e.preventDefault(); dlg.showModal(); dlg.querySelector('.article-close').focus(); });
    dlg.querySelector('.article-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => a.focus());
  });

  // Looping videos: play when on screen, a button to pause (WCAG 2.2.2), no autoplay for reduced motion.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.loop-video').forEach((fig) => {
    const v = fig.querySelector('video'), btn = fig.querySelector('.video-toggle');
    let paused = still;
    const label = () => { btn.textContent = v.paused ? 'Play' : 'Pause'; btn.setAttribute('aria-label', v.paused ? 'Play animation' : 'Pause animation'); };
    btn.addEventListener('click', () => { paused = !v.paused; paused ? v.pause() : v.play(); });
    v.addEventListener('play', label); v.addEventListener('pause', label);
    const watch = 'IntersectionObserver' in window && new IntersectionObserver(([e]) => { if (e.isIntersecting && !paused) v.play().catch(() => {}); else if (!e.isIntersecting) v.pause(); }, { threshold: .35 });
    if (watch) watch.observe(v);
    label();
  });
})();
