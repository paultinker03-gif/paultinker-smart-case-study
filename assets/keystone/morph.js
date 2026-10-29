/* Three Keystone components, each morphing from Smart in English (left to right) to Zurich in
   Arabic (right to left), then flipping like a card to the next one, on a loop (after Koto's
   Rakbank page). Tablet and up only; phones and reduced motion keep the paired-phone carousel.

   The morph only ever moves things sideways: every text holds both languages stacked in one cell
   (so boxes keep their size), the layout is switched to the other direction, and each element
   with data-m is slid from where it was to where it now is (FLIP). Bar segments slide to their
   mirrored places like everything else. Text, colours and icons cross-fade as they go. */
(() => {
  const host = document.querySelector('[data-keystone-morph]');
  if (!host) return;
  if (matchMedia('(max-width: 700px), (max-height: 500px) and (orientation: landscape)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const I = window.KS_ICONS || {};

  const t = (en, ar, cls = '') => `<span class="t ${cls}" data-m><span class="en">${en}</span><span class="ar" lang="ar">${ar}</span></span>`;
  const tile = (icon, en, ar) => `<div class="ks-quick__item" data-m><span class="ks-quick__tile" data-surface="default">${(I[icon] || {}).en || ''}${(I[icon] || {}).ar || ''}</span><span class="ks-quick__label">${t(en, ar).replace(' data-m', '')}</span></div>`;
  const num = (size) => `<span class="ks-num" data-m>${t('£', 'USD', 'cur').replace(' data-m', '')}<span class="val">42,180</span><span class="dec">.00</span></span>`;
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3.5M7.5 4 3.5 8l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const COMPS = [
    {
      name: 'Dashboard hero',
      html: `<div class="ks-hero" data-surface="inverse">
        <span class="ks-eyebrow">${t('Total pot value', 'إجمالي قيمة الرصيد')}</span>
        <div class="ks-row">${num()}<span class="ks-badge inverse" data-m>${t('▲ £1,842.10 · +4.57%', '▲ USD 1,842.10 · +4.57%').replace(' data-m', '')}</span></div>
        <span class="ks-note">${t('As of 18 March 2026', 'بتاريخ 18 مارس 2026')}</span>
        <div class="ks-quick">${tile('money', 'Pay in more', 'ادفع المزيد')}${tile('calendar', 'Retirement age', 'سن التقاعد')}${tile('calculator', 'Calculator', 'الحاسبة')}${tile('transfer', 'Combine pensions', 'دمج المعاشات')}</div>
      </div>`,
    },
    {
      name: 'Metric card',
      html: `<div class="ks-metric" data-surface="default">
        <span class="ks-eyebrow">${t('Total pot value', 'إجمالي قيمة الرصيد')}</span>
        <div class="ks-row">${num()}<span class="ks-badge subtle" data-m>+4.57%</span></div>
        <span class="ks-note">${t('As of 18 March 2026', 'بتاريخ 18 مارس 2026')}</span>
        <div class="ks-split">
          <div class="ks-bar" data-bar><span data-m style="--w:34.7%;background:var(--data-1)"></span><span data-m style="--w:46.2%;background:var(--data-2)"></span><span data-m style="--w:19.1%;background:var(--data-3)"></span></div>
          <div class="ks-legend">
            <span data-m><i style="background:var(--data-1)"></i>${t('You 35%', 'دفعتَ 35%').replace(' data-m', '')}</span>
            <span data-m><i style="background:var(--data-2)"></i>${t('Employer 46%', 'صاحب العمل 46%').replace(' data-m', '')}</span>
            <span data-m><i style="background:var(--data-3)"></i>${t('Investment growth 19%', 'نمو الاستثمار 19%').replace(' data-m', '')}</span>
          </div>
        </div>
      </div>`,
    },
    {
      name: 'Page heading and progress',
      html: `<div class="ks-page" data-surface="default">
        <span class="ks-step">${t('Step 1 of 2', 'الخطوة 1 من 2')}</span>
        <div class="ks-track" data-bar><span data-m style="--w:50%"></span></div>
        <span class="ks-back" data-m>${arrow}${t('Dashboard', 'لوحة التحكم').replace(' data-m', '')}</span>
        <span class="ks-h1">${t('Contributions', 'المساهمات', 'disp')}</span>
        <span class="ks-lede">${t('Change how much you pay in.', 'غيّر المبلغ الذي تدفعه.')}</span>
      </div>`,
    },
  ];

  host.innerHTML = `
    <div class="km-panel"><button class="km-pause" type="button" aria-label="Pause the animation"></button><div class="km-card"><div class="km-scale"><div class="font-keystone ks-root" data-theme="smart-light" data-brand="smart" dir="ltr" aria-hidden="true"></div></div></div></div>`;
  const root = host.querySelector('.ks-root');
  const card = host.querySelector('.km-card');
  const pauseBtn = host.querySelector('.km-pause');
  const PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7.5-4.5z" fill="currentColor"/></svg>';
  pauseBtn.innerHTML = PAUSE;

  // the carousel this stands in for (phones keep it)
  const old = host.previousElementSibling && host.previousElementSibling.matches('figure.carousel') ? host.previousElementSibling : null;
  if (old) old.style.display = 'none';
  host.hidden = false;

  const MS = 900;
  let paused = false, visible = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // waits `ms` of unpaused, on-screen time
  const hold = async (ms) => {
    let left = ms;
    while (left > 0) { await sleep(100); if (!paused && visible) left -= 100; }
  };
  const ready = async () => { while (paused || !visible) await sleep(120); };

  // each two-language text takes the width of the language showing, so there are no gaps where the
  // other one is longer; the hidden one just overflows its cell, invisibly
  const fitTexts = (lang) => root.querySelectorAll('.t').forEach((el) => {
    const s = el.querySelector(':scope > .' + lang);
    el.style.width = s.scrollWidth + 'px';
  });
  const setBars = (on) => root.querySelectorAll('[data-bar] > span').forEach((s) => { s.style.width = on ? s.style.getPropertyValue('--w').trim() : '0%'; });

  const show = (i) => {
    host.classList.remove('is-ar');
    root.setAttribute('dir', 'ltr'); root.dataset.theme = 'smart-light'; root.dataset.brand = 'smart';
    root.innerHTML = COMPS[i].html;
    setBars(true);
    fitTexts('en');
  };

  // English left to right <-> Arabic right to left
  const morph = async (toAr) => {
    const movers = [...root.querySelectorAll('[data-m]')];
    const before = movers.map((el) => el.getBoundingClientRect().left);
    host.classList.toggle('is-ar', toAr);
    root.setAttribute('dir', toAr ? 'rtl' : 'ltr');
    root.dataset.theme = toAr ? 'zurich-light' : 'smart-light';
    root.dataset.brand = toAr ? 'zurich' : 'smart';
    // each text box ends at the new language's width, but starts at the old one's and eases between
    // them while it slides, so the words never stick out past where they were or where they land
    const texts = [...root.querySelectorAll('.t')];
    const w0 = texts.map((el) => el.offsetWidth);
    fitTexts(toAr ? 'ar' : 'en');
    const w1 = texts.map((el) => el.style.width);
    // where things now sit is measured with the texts still at their old widths, so the slide starts
    // exactly where they were; the widths and the slide then ease together, so nothing doubles back
    texts.forEach((el, k) => { el.style.transition = 'none'; el.style.width = w0[k] + 'px'; });
    // the card is drawn larger than life (.km-scale), so screen pixels are divided back down
    const scale = root.getBoundingClientRect().width / root.offsetWidth || 1;
    const dxs = movers.map((el, k) => (before[k] - el.getBoundingClientRect().left) / scale);
    movers.forEach((el, k) => {
      el.style.transition = 'none';
      el.style.transform = `translateX(${dxs[k]}px)`;
    });
    root.getBoundingClientRect();
    const curve = `${MS}ms cubic-bezier(.65,0,.35,1)`;
    texts.forEach((el, k) => { el.style.transition = `width ${curve}`; el.style.width = w1[k]; });
    movers.forEach((el) => {
      el.style.transition = `transform ${curve}${el.classList.contains('t') ? `, width ${curve}` : ''}, opacity ${MS}ms, color ${MS}ms, background-color ${MS}ms`;
      el.style.transform = '';
    });
    await sleep(MS + 60);
    movers.forEach((el) => { el.style.transition = ''; });
    texts.forEach((el) => { el.style.transition = ''; });
  };

  // a card turn: edge-on at the midpoint, where the next component goes in
  const flip = async (next) => {
    const half = MS / 2;
    card.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: half, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' });
    await sleep(half);
    show(next);
    const a = card.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: half, easing: 'cubic-bezier(0,.55,.45,1)', fill: 'forwards' });
    await a.finished;
  };

  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.innerHTML = paused ? PLAY : PAUSE;
    pauseBtn.setAttribute('aria-label', paused ? 'Play the animation' : 'Pause the animation');
  });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .35 }).observe(host);

  (async () => {
    let i = 0;
    show(0);
    if (document.fonts) await Promise.race([document.fonts.ready, sleep(1500)]);
    fitTexts('en');
    for (;;) {
      await hold(2200); await ready();
      await morph(true);
      await hold(2600); await ready();
      i = (i + 1) % COMPS.length;
      await flip(i);
    }
  })();
})();
