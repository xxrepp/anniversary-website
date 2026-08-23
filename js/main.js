/* ============================================================
   main.js — Midnight Constellation redesign
   Builds scroll sections from SCRAPBOOK_PAGES, then drives:
     · press-&-hold gate → music starts
     · starfield canvas (stars + drifting petals of light)
     · IntersectionObserver scroll reveals
     · reading progress bar
     · month lightbox
     · sealed letter
     · finale photo (from studio, localStorage)
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  /* ============================================================
     1 · BUILD SECTIONS
     ============================================================ */

  const story = $('#story');
  const pages = window.SCRAPBOOK_PAGES || [];
  let chapterCount = 0;

  const builders = {
    cover(p) {
      return `
      <section class="chapter hero" id="top">
        <p class="hero-eyebrow reveal">${esc(p.kicker)}</p>
        <h1 class="hero-title reveal d1">
          <span class="line">${esc(p.title)}</span>
          <span class="line italic">${esc(p.title2)}</span>
        </h1>
        <p class="hero-sub reveal d2">${esc(p.sub)}</p>
        <div class="hero-dates reveal d3">
          <span>aug 30 · 2025</span><span class="rule"></span><span>aug 30 · 2026</span>
        </div>
        <div class="scroll-cue">scroll</div>
      </section>`;
    },

    intro(p) {
      return `
      <section class="chapter">
        <div class="prose-panel reveal">
          <p class="lead">${esc(p.heading)}</p>
          <p>${esc(p.body)}</p>
          <p class="sign">${esc(p.sign)}</p>
        </div>
      </section>`;
    },

    polaroids(p) {
      const items = (p.items || []).map(it => `
        <figure class="polaroid reveal" style="--rot:${it.rotate || 0}deg">
          <img src="${esc(it.src)}" alt="${esc(it.caption)}" loading="lazy">
          <figcaption class="cap">
            <span class="t">${esc(it.caption)}</span>
            <span class="d">${esc(it.date)}</span>
          </figcaption>
        </figure>`).join('');
      return `
      <section class="chapter">
        ${chapterHead(p)}
        <div class="scatter">${items}</div>
      </section>`;
    },

    photo(p) {
      return `
      <section class="chapter">
        ${p.chapter ? chapterHead(p) : ''}
        <div class="feature reveal">
          <div class="frame"><img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy"></div>
          <p class="cap">${esc(p.caption)}</p>
        </div>
      </section>`;
    },

    months(p) {
      const rows = (p.items || []).map((m, i) => `
        <button class="t-month reveal" data-month='${esc(JSON.stringify({ m: m.m, y: m.y, note: m.note, photos: m.photos }))}'>
          <span class="t-dot" aria-hidden="true"></span>
          <span class="t-body">
            <img class="t-thumb" src="${esc(m.thumb)}" alt="" loading="lazy">
            <span class="t-text">
              <span class="m">${esc(m.m)} <small>${esc(m.y)}</small></span>
              <span class="n">${esc(m.note)}</span>
            </span>
            <span class="t-arrow" aria-hidden="true">&rarr;</span>
          </span>
        </button>`).join('');
      return `
      <section class="chapter">
        ${chapterHead(p)}
        <div class="timeline">${rows}</div>
      </section>`;
    },

    chat(p) {
      const rows = (p.items || []).map(c => `
        <div class="bubble-row ${c.from === 'me' ? 'me' : 'you'} reveal">
          <div class="bubble">
            ${esc(c.text)}
            <span class="time">${esc(c.time)}</span>
          </div>
        </div>`).join('');
      return `
      <section class="chapter">
        ${chapterHead(p)}
        <div class="chat-wrap">${rows}</div>
      </section>`;
    },

    notes(p) {
      const chips = (p.items || []).map(n => `
        <span class="chip reveal">${esc(n.text)}</span>`).join('');
      return `
      <section class="chapter">
        ${chapterHead(p)}
        <div class="chips">${chips}</div>
      </section>`;
    },

    letter(p) {
      const paras = (p.body || []).map(t => `<p>${esc(t)}</p>`).join('');
      return `
      <section class="chapter">
        ${chapterHead(p)}
        <div class="letter-stage reveal">
          <div class="envelope" id="envelope" role="button" tabindex="0" aria-label="break the seal and read the letter">
            <div class="seal" aria-hidden="true">&hearts;</div>
            <p class="seal-hint" id="sealHint">tap the seal to read</p>
            <div class="letter-body" id="letterBody" hidden>
              ${paras}
              <p class="sign">${esc(p.sign)}</p>
            </div>
          </div>
        </div>
      </section>`;
    },

    studio(p) {
      return `
      <section class="chapter">
        ${chapterHead(p)}
        <div class="studio-cta reveal">
          <p class="body">${esc(p.body)}</p>
          <button class="btn primary" data-open-studio>${esc(p.buttonLabel)}</button>
          <p class="after">${esc(p.after)}</p>
        </div>
      </section>`;
    },

    backcover(p) {
      return `
      <section class="chapter finale">
        <p class="chapter-num reveal">finale</p>
        <h2 class="finale-title reveal d1">${esc(p.title)}</h2>
        <p class="finale-sub reveal d2">${esc(p.sub)}</p>
        <div class="finale-photo empty reveal d3" id="finalePhoto">
          <div class="ph">${esc(p.scrapHint)}</div>
        </div>
        <p class="finale-foot reveal d3">made with love · volume i</p>
      </section>`;
    }
  };

  function chapterHead(p) {
    chapterCount += 1;
    const num = String(chapterCount).padStart(2, '0');
    return `
      <p class="chapter-num reveal">chapter ${num}</p>
      <h2 class="chapter-title reveal d1">${esc(p.chapter)}</h2>
      ${p.note ? `<p class="chapter-note reveal d2">${esc(p.note)}</p>` : ''}`;
  }

  story.innerHTML = pages.map(p => (builders[p.type] || (() => ''))(p)).join('');

  /* ============================================================
     2 · STARFIELD CANVAS
     ============================================================ */

  const sky = $('#sky');
  const sctx = sky.getContext('2d');
  let stars = [], W = 0, H = 0, raf = null;

  function sizeSky() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = sky.width = innerWidth * dpr;
    H = sky.height = innerHeight * dpr;
    stars = Array.from({ length: reduceMotion ? 60 : Math.round(W * H / 16000) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: (Math.random() * 1.3 + .4) * dpr,
      a: Math.random() * .5 + .18,
      tw: Math.random() * Math.PI * 2,
      sp: Math.random() * .35 + .06,
      gold: Math.random() < .12
    }));
  }

  function drawSky(t) {
    sctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const tw = reduceMotion ? 1 : (.72 + .28 * Math.sin(t * .001 * s.sp * 4 + s.tw));
      sctx.globalAlpha = s.a * tw;
      sctx.fillStyle = s.gold ? '#E3B878' : '#A8C7FA';
      sctx.beginPath();
      sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sctx.fill();
      if (!reduceMotion) {
        s.y -= s.sp;
        if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; }
      }
    }
    sctx.globalAlpha = 1;
    if (!reduceMotion) raf = requestAnimationFrame(drawSky);
  }

  sizeSky();
  drawSky(0);
  addEventListener('resize', sizeSky);

  /* ============================================================
     3 · GATE — press & hold the moon orb
     ============================================================ */

  const gate = $('#gate');
  const orb = $('#gateOrb');
  const orbFill = $('#orbProgress');
  const audio = $('#bgMusic');
  const musicBtn = $('#musicBtn');
  const HOLD_MS = 900;
  const RING_LEN = 351.86;   /* 2πr, r=56 in the SVG viewBox */

  let holdStart = 0, holdRaf = null, opened = false;

  function holdTick() {
    const pct = Math.min(1, (performance.now() - holdStart) / HOLD_MS);
    orbFill.style.strokeDashoffset = String(RING_LEN * (1 - pct));
    if (pct >= 1) { openGate(); return; }
    holdRaf = requestAnimationFrame(holdTick);
  }
  function holdDown(e) {
    if (opened) return;
    e.preventDefault();
    orb.classList.add('holding');          /* rings whirl */
    holdStart = performance.now();
    holdRaf = requestAnimationFrame(holdTick);
  }
  function holdUp() {
    if (opened) return;
    cancelAnimationFrame(holdRaf);
    orb.classList.remove('holding');
    orbFill.style.strokeDashoffset = String(RING_LEN);
  }

  orb.addEventListener('pointerdown', holdDown);
  addEventListener('pointerup', holdUp);
  addEventListener('pointercancel', holdUp);
  /* keyboard: Enter/Space opens immediately */
  orb.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !opened) { e.preventDefault(); openGate(); }
  });

  function openGate() {
    if (opened) return;
    opened = true;
    cancelAnimationFrame(holdRaf);
    orbFill.style.strokeDashoffset = '0';
    gate.classList.add('is-leaving');
    document.body.classList.remove('locked');
    document.body.classList.add('unlocked');
    playMusic();
    setTimeout(() => { gate.hidden = true; }, 950);
  }

  /* ============================================================
     4 · MUSIC
     ============================================================ */

  let musicOn = localStorage.getItem('anniv.music') !== 'off';
  audio.volume = 0;

  function playMusic() {
    if (!musicOn) { syncMusicBtn(); return; }
    audio.play().then(() => fadeAudio(0.5)).catch(() => { /* autoplay blocked — stays muted */ });
    syncMusicBtn();
  }

  function fadeAudio(target) {
    const step = () => {
      const d = target - audio.volume;
      if (Math.abs(d) < .03) { audio.volume = target; return; }
      audio.volume = Math.max(0, Math.min(1, audio.volume + d * .12));
      requestAnimationFrame(step);
    };
    step();
  }

  function syncMusicBtn() {
    musicBtn.setAttribute('aria-pressed', String(musicOn));
  }

  musicBtn.addEventListener('click', () => {
    musicOn = !musicOn;
    localStorage.setItem('anniv.music', musicOn ? 'on' : 'off');
    if (musicOn) { audio.play().then(() => fadeAudio(.5)).catch(() => {}); }
    else fadeAudio(0);
    syncMusicBtn();
  });
  syncMusicBtn();

  /* ============================================================
     5 · SCROLL REVEALS + PROGRESS
     ============================================================ */

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });

  $$('.reveal').forEach(el => io.observe(el));

  const progressBar = $('#chromeProgress i');
  const moonShadow = $('#moonShadow');
  const dayNum = $('#dayNum');
  let lastDay = 0;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? Math.min(1, scrollY / max) : 0;
    progressBar.style.transform = `scaleX(${pct})`;
    /* moon waxes new → full as the story unfolds (full on the last page) */
    if (moonShadow) moonShadow.style.setProperty('--phase', pct.toFixed(3));
    /* day counter ticks 1 → 365 with the scroll */
    if (dayNum) {
      const day = 1 + Math.round(pct * 364);
      if (day !== lastDay) {
        dayNum.textContent = day;
        dayNum.style.color = 'var(--gold)';
        clearTimeout(dayNum._t);
        dayNum._t = setTimeout(() => { dayNum.style.color = ''; }, 240);
        lastDay = day;
      }
    }
  }
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ============================================================
     6 · MONTH LIGHTBOX
     ============================================================ */

  const lightbox = $('#lightbox');

  story.addEventListener('click', e => {
    const btn = e.target.closest('[data-month]');
    if (!btn) return;
    const data = JSON.parse(btn.dataset.month);
    $('#lightboxTitle').textContent = `${data.m} ${data.y}`;
    $('#lightboxNote').textContent = data.note || 'photos from this month';
    $('#lightboxGrid').innerHTML = (data.photos || []).map(ph => `
      <figure tabindex="0" role="button" aria-label="view ${esc(ph.caption)} fullscreen">
        <img src="${esc(ph.src)}" alt="${esc(ph.caption)}">
        <figcaption>${esc(ph.caption)}</figcaption>
      </figure>`).join('');
    lightbox.hidden = false;
    document.body.classList.add('locked');
  });

  /* tap a lightbox photo → fullscreen zoom view */
  const zoomView = $('#zoomView');

  function openZoom(figure) {
    const img = $('img', figure);
    if (!img) return;
    $('#zoomImg').src = img.src;
    $('#zoomImg').alt = img.alt;
    $('#zoomCap').textContent = $('figcaption', figure).textContent;
    zoomView.hidden = false;
  }
  function closeZoom() { zoomView.hidden = true; }

  $('#lightboxGrid').addEventListener('click', e => {
    const fig = e.target.closest('figure');
    if (fig) openZoom(fig);
  });
  $('#lightboxGrid').addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('figure')) {
      e.preventDefault(); openZoom(e.target);
    }
  });
  zoomView.addEventListener('click', closeZoom);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !zoomView.hidden) { closeZoom(); e.stopPropagation(); }
  }, true);

  function closeLightbox() {
    lightbox.hidden = true;
    if (!opened) return;
    document.body.classList.remove('locked');
  }
  $('#lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  /* ============================================================
     7 · SEALED LETTER
     ============================================================ */

  const envelope = $('#envelope');
  if (envelope) {
    const breakSeal = () => {
      if (envelope.classList.contains('open')) return;
      envelope.classList.add('open');
      $('.seal', envelope).style.display = 'none';
      $('#sealHint').hidden = true;
      const body = $('#letterBody');
      body.hidden = false;
      body.classList.add('reveal-letter');
    };
    envelope.addEventListener('click', breakSeal);
    envelope.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); breakSeal(); }
    });
  }

  /* ============================================================
     8 · FINALE PHOTO (studio result pinned at the end)
     ============================================================ */

  const FRAME_KEY = 'anniv.yearTwoFrame';

  function refreshFinale() {
    const slot = $('#finalePhoto');
    if (!slot) return;
    const data = localStorage.getItem(FRAME_KEY);
    if (!data) return;
    slot.classList.remove('empty');
    slot.innerHTML = `
      <img src="${data}" alt="the first photo of year two">
      <p class="cap">year two, photo one</p>`;
  }

  window.addEventListener('yearTwoPhotoSaved', refreshFinale);
  refreshFinale();

})();
