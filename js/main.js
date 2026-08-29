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
      let bodyContent = '';
      if (Array.isArray(p.body)) {
        bodyContent = p.body.map(para => `<p>${esc(para)}</p>`).join('');
      } else if (p.body) {
        const lines = String(p.body).split(/\n\n+/);
        bodyContent = lines.map(line => `<p>${esc(line)}</p>`).join('');
      }
      return `
      <section class="chapter">
        <div class="prose-panel reveal">
          <p class="lead">${esc(p.heading)}</p>
          ${bodyContent}
          ${p.quote ? `<blockquote class="prose-quote">${esc(p.quote)}</blockquote>` : ''}
          ${p.highlight ? `<div class="prose-highlight"><p class="highlight-text">${esc(p.highlight)}</p></div>` : ''}
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
      let paras = [];
      if (Array.isArray(p.body)) {
        paras = p.body;
      } else if (p.body) {
        paras = String(p.body).split(/\n\n+/);
      }
      const parasHtml = paras.map((t, idx) => {
        if (typeof t === 'object' && t !== null && t.quote) {
          return `<blockquote class="letter-quote" style="--idx:${idx}">${esc(t.quote)}</blockquote>`;
        }
        const str = String(t).trim();
        if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'")) || (str.startsWith('“') && str.endsWith('”'))) {
          const unquoted = str.replace(/^["'“]|["'”]$/g, '').trim();
          return `<blockquote class="letter-quote" style="--idx:${idx}">“${esc(unquoted)}”</blockquote>`;
        }
        return `<p style="--idx:${idx}">${esc(t)}</p>`;
      }).join('');
      const signHtml = p.sign ? `<p class="sign" style="--idx:${paras.length}">${esc(p.sign)}</p>` : '';
      return `
      <section class="chapter">
        ${chapterHead(p)}
        <div class="letter-stage reveal">
          <div class="envelope" id="envelope" role="button" tabindex="0" aria-label="break the seal and read the letter">
            <div class="seal" aria-hidden="true">&hearts;</div>
            <p class="seal-hint" id="sealHint">tap the seal to read</p>
            <div class="letter-body" id="letterBody" hidden>
              ${parasHtml}
              ${signHtml}
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
    },

    gallery(p) {
      const id = `sphere-${chapterCount}`;
      return `
      <section class="chapter" data-gallery='${esc(JSON.stringify({ id, folder: p.folder, count: p.count, ext: p.ext }))}'>
        ${chapterHead(p)}
        <div class="sphere-stage reveal d3" id="${id}">
          <canvas class="sphere-canvas" id="${id}-canvas"></canvas>
        </div>
        <div class="sphere-zoom" id="${id}-zoom" hidden>
          <button class="sphere-zoom-close">&times;</button>
          <img id="${id}-img" alt="">
        </div>
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
     GALLERY SPHERE — photo cards forming a 3D globe
     ============================================================ */
  if (window.THREE) {
    $$('[data-gallery]').forEach(el => {
      const cfg = JSON.parse(el.dataset.gallery);
      initGallerySphere(cfg);
    });
  }

  function fibonacciSphere(n) {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      pts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
    }
    return pts;
  }

  function initGallerySphere(cfg) {
    const container = document.getElementById(cfg.id);
    if (!container) return;
    const canvas = document.getElementById(`${cfg.id}-canvas`);
    const zoom = document.getElementById(`${cfg.id}-zoom`);
    const zoomImg = document.getElementById(`${cfg.id}-img`);
    if (!canvas || !zoom || !zoomImg) return;

    const SPHERE_R = 4.5;
    const CARD_SIZE = 1.44;

    /* ---- scene ---- */
    const scene = new THREE.Scene();
    const W = container.clientWidth, H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, W / Math.max(H, 1), .1, 20);
    /* pull back until the entire sphere silhouette fits the narrower FOV */
    function frameCamera() {
      const fovY = THREE.MathUtils.degToRad(camera.fov);
      const fovX = 2 * Math.atan(Math.tan(fovY / 2) * camera.aspect);
      camera.position.z = SPHERE_R / (.86 * Math.tan(Math.min(fovX, fovY) / 2));
    }
    frameCamera();

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);

    /* starfield backdrop */
    const starsGeo = new THREE.BufferGeometry();
    const starsArr = new Float32Array(600 * 3);
    for (let i = 0; i < starsArr.length; i += 3) {
      starsArr[i] = (Math.random() - .5) * 16;
      starsArr[i + 1] = (Math.random() - .5) * 16;
      starsArr[i + 2] = (Math.random() - .5) * 10;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsArr, 3));
    const stars = new THREE.Points(starsGeo,
      new THREE.PointsMaterial({ color: 0xA8C7FA, size: .028, transparent: true, opacity: .55, depthWrite: false }));
    scene.add(stars);

    /* ---- photo cards ---- */
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    /* shared rounded-disc alpha */
    const alphaC = document.createElement('canvas'); alphaC.width = 256; alphaC.height = 256;
    const actx = alphaC.getContext('2d');
    const ag = actx.createRadialGradient(128, 128, 98, 128, 128, 128);
    ag.addColorStop(0, 'rgba(255,255,255,1)');
    ag.addColorStop(.82, 'rgba(255,255,255,1)');
    ag.addColorStop(1, 'rgba(255,255,255,0)');
    actx.fillStyle = ag; actx.fillRect(0, 0, 256, 256);
    const alphaTex = new THREE.CanvasTexture(alphaC);
    alphaTex.minFilter = THREE.LinearFilter; alphaTex.magFilter = THREE.LinearFilter;

    /* shared placeholder — bright pin with subtle ring, visible against dark bg */
    const ph = (() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      /* subtle gradient background */
      const bg = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      bg.addColorStop(0, '#1E2A4A'); bg.addColorStop(1, '#0D1226');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 256);
      /* outer ring */
      ctx.strokeStyle = 'rgba(168,199,250,.3)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(128, 128, 64, 0, Math.PI * 2); ctx.stroke();
      /* star icon */
      ctx.fillStyle = 'rgba(168,199,250,.9)'; ctx.font = '48px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u2606', 128, 128);
      return new THREE.CanvasTexture(c);
    })();

    const sharedGeo = new THREE.PlaneGeometry(CARD_SIZE, CARD_SIZE);
    const cards = [];
    const loader = new THREE.TextureLoader();
    const v3 = new THREE.Vector3();
    const q = new THREE.Quaternion();

    fibonacciSphere(cfg.count).forEach((pt, i) => {
      const mat = new THREE.MeshBasicMaterial({
        map: ph, alphaMap: alphaTex, color: 0xffffff,
        transparent: true, opacity: .82, depthWrite: true, alphaTest: .2,
        side: THREE.DoubleSide
      });
      const card = new THREE.Mesh(sharedGeo, mat);

      /* position on sphere + orient outward */
      v3.set(pt.x * SPHERE_R, pt.y * SPHERE_R, pt.z * SPHERE_R);
      card.position.copy(v3);
      /* outward normal = normalize(position) = pt itself */
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v3.clone().normalize());
      card.setRotationFromQuaternion(q);

      card.userData = { src: `${cfg.folder}/${i + 1}.${cfg.ext}`, idx: i + 1, baseScale: 1, mat };
      cardGroup.add(card);
      cards.push(card);

      loader.load(card.userData.src, tex => {
        tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
        mat.map = tex; mat.opacity = 1; mat.needsUpdate = true;
      }, undefined,
        () => { mat.opacity = .15; mat.needsUpdate = true; }
      );
    });

    /* ---- interaction state ---- */
    let dragging = false, px = 0, py = 0;
    let vx = 0, vy = 0;          /* angular velocity */
    let rotX = 0, rotY = 0;      /* accumulated rotation */
    let hovered = null;
    let autoSpin = true;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function pointerPos(e) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function doHover() {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(cards);
      const hit = hits.length ? hits[0].object : null;
      if (hovered === hit) return;
      if (hovered) {
        hovered.scale.setScalar(1);
        hovered.userData.mat.opacity = .82;
        hovered.userData.mat.needsUpdate = true;
      }
      hovered = hit;
      if (hovered) {
        hovered.scale.setScalar(1.18);
        hovered.userData.mat.opacity = 1;
        hovered.userData.mat.needsUpdate = true;
        container.style.cursor = 'pointer';
      } else if (!dragging) {
        container.style.cursor = 'grab';
      }
    }

    function onDown(e) {
      dragging = true; autoSpin = false; vx = 0; vy = 0;
      px = e.clientX; py = e.clientY;
      container.style.cursor = 'grabbing';
    }

    const DRAG_GAIN = .0009;     /* rad per pixel of drag */
    const MAX_V    = .015;        /* per-frame velocity cap (fling limit) */
    function clampV(v) { return Math.max(-MAX_V, Math.min(MAX_V, v)); }

    function onMove(e) {
      pointerPos(e);
      if (dragging) {
        const dx = e.clientX - px, dy = e.clientY - py;
        vy = clampV(vy + dx * DRAG_GAIN);
        vx = clampV(vx + dy * DRAG_GAIN);
        vx = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, vx));
        px = e.clientX; py = e.clientY;
      }
      doHover();
    }
    function onUp(e) {
      if (!dragging) return;
      const dx = Math.abs(e.clientX - px);
      const dy = Math.abs(e.clientY - py);
      dragging = false;
      if (dx < 4 && dy < 4 && hovered) tryClick(hovered);
      /* restart auto-spin after 2s idle if velocity is near zero */
      clearTimeout(container._ar);
      container._ar = setTimeout(() => {
        if (Math.abs(vx) < .0003 && Math.abs(vy) < .0003) autoSpin = true;
      }, 2000);
    }

    function tryClick(card) {
      zoomImg.src = card.userData.src;
      zoomImg.alt = `selfie #${card.userData.idx}`;
      zoom.hidden = false;
      document.body.classList.add('locked');
    }

    function closeZoom() {
      zoom.hidden = true;
      if (opened) document.body.classList.remove('locked');
    }

    zoom.querySelector('.sphere-zoom-close').addEventListener('click', closeZoom);
    zoom.addEventListener('click', e => { if (e.target === zoom) closeZoom(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !zoom.hidden) { closeZoom(); e.stopPropagation(); }
    }, true);

    container.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    /* also do hover on mousemove without drag */
    window.addEventListener('pointerleave', () => {
      if (hovered) {
        hovered.scale.setScalar(1);
        hovered.userData.mat.opacity = .82;
        hovered.userData.mat.needsUpdate = true;
        hovered = null;
      }
    });
    container.style.cursor = 'grab';

    /* ---- render loop ---- */
    (function loop() {
      requestAnimationFrame(loop);

      /* auto-spin: subtle constant drift */
      if (autoSpin && !dragging) vy += .00035;

      /* integrate velocity + friction (stiffer after release so drag flings die quickly) */
      const friction = dragging ? 1 : .88;
      rotX += vx; rotY += vy;
      vx *= friction; vy *= friction;
      /* snap tiny velocities to zero */
      if (!dragging && Math.abs(vx) < .00025) vx = 0;
      if (!dragging && Math.abs(vy) < .00025) vy = 0;

      cardGroup.rotation.set(rotX, rotY, 0);
      stars.rotation.y -= .0003;
      stars.rotation.x += .0002;

      renderer.render(scene, camera);
    })();

    /* ---- resize ---- */
    new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      frameCamera();
    }).observe(container);
  }

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
    stars = Array.from({ length: reduceMotion ? 70 : Math.round(W * H / 12000) }, () => {
      const sparkle = Math.random() < 0.22;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: (sparkle ? Math.random() * 1.5 + 1.2 : Math.random() * 1.1 + 0.5) * dpr,
        a: Math.random() * 0.4 + (sparkle ? 0.6 : 0.35),
        tw: Math.random() * Math.PI * 2,
        twSpeed: Math.random() * 2 + 1.5,
        sp: (Math.random() * 0.25 + 0.05) * dpr,
        gold: Math.random() < 0.25,
        sparkle: sparkle,
        sparkleSize: (Math.random() * 7 + 5) * dpr
      };
    });
  }

  function drawSky(t) {
    sctx.clearRect(0, 0, W, H);
    const timeSec = t * 0.001;

    for (const s of stars) {
      const pulse = reduceMotion ? 1 : (0.65 + 0.35 * Math.sin(timeSec * s.twSpeed + s.tw));
      const alpha = Math.min(1, s.a * pulse);
      const color = s.gold ? '#F4DBA8' : '#D0E2FF';

      sctx.save();
      sctx.globalAlpha = alpha;

      // Soft glow aura for brighter stars
      if (s.sparkle || s.r > 1.2) {
        const glowRad = s.r * 2.8;
        const glow = sctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowRad);
        glow.addColorStop(0, s.gold ? 'rgba(227, 184, 120, 0.45)' : 'rgba(168, 199, 250, 0.45)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sctx.fillStyle = glow;
        sctx.beginPath();
        sctx.arc(s.x, s.y, glowRad, 0, Math.PI * 2);
        sctx.fill();
      }

      // Star core
      sctx.fillStyle = color;
      sctx.beginPath();
      sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sctx.fill();

      // 4-point diffraction sparkle like the polaroid
      if (s.sparkle) {
        const size = s.sparkleSize * pulse;
        sctx.strokeStyle = s.gold ? '#E3B878' : '#A8C7FA';
        sctx.lineWidth = 1;
        sctx.beginPath();
        sctx.moveTo(s.x - size, s.y);
        sctx.lineTo(s.x + size, s.y);
        sctx.moveTo(s.x, s.y - size);
        sctx.lineTo(s.x, s.y + size);
        sctx.stroke();

        // White hot center
        sctx.fillStyle = '#FFFFFF';
        sctx.beginPath();
        sctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2);
        sctx.fill();
      }

      sctx.restore();

      if (!reduceMotion) {
        s.y -= s.sp;
        if (s.y < -10) {
          s.y = H + 10;
          s.x = Math.random() * W;
        }
      }
    }
    if (!reduceMotion) raf = requestAnimationFrame(drawSky);
  }

  sizeSky();
  drawSky(0);
  addEventListener('resize', sizeSky);

  /* ============================================================
     3 · GATE — press & hold the moon orb with full asset preloading
     ============================================================ */

  const gate = $('#gate');
  const orb = $('#gateOrb');
  const orbFill = $('#orbProgress');
  const gateLine = $('#gateLine') || $('.gate-line');
  const audio = $('#bgMusic');
  const musicBtn = $('#musicBtn');
  const HOLD_MS = 900;
  const RING_LEN = 351.86;   /* 2πr, r=56 in the SVG viewBox */

  let holdStart = 0, holdRaf = null, opened = false;
  let isPageLoaded = false;

  /* Preload all images and assets before user can unlock */
  function preloadAllAssets() {
    orb.classList.add('is-loading');
    orb.setAttribute('aria-disabled', 'true');
    const urls = new Set();

    // 1. Gather all photos and images from scrapbook data
    (window.SCRAPBOOK_PAGES || []).forEach(p => {
      if (p.src) urls.add(p.src);
      if (p.items && Array.isArray(p.items)) {
        p.items.forEach(it => {
          if (it.src) urls.add(it.src);
          if (it.thumb) urls.add(it.thumb);
          if (it.photos && Array.isArray(it.photos)) {
            it.photos.forEach(ph => { if (ph.src) urls.add(ph.src); });
          }
        });
      }
      if (p.folder && p.count) {
        for (let i = 1; i <= p.count; i++) {
          urls.add(`${p.folder}/${i}.${p.ext || 'jpeg'}`);
        }
      }
    });

    // 2. Also collect any image elements rendered in the DOM
    $$('img').forEach(img => {
      if (img.src && !img.src.startsWith('data:')) urls.add(img.src);
    });

    const assetList = Array.from(urls);
    let loadedCount = 0;
    const total = assetList.length;

    const onAssetLoaded = () => {
      loadedCount++;
      if (gateLine && !isPageLoaded) {
        const pct = Math.round((loadedCount / Math.max(total, 1)) * 100);
        gateLine.textContent = `preparing the stars... ${pct}%`;
      }
      if (loadedCount >= total) {
        finishLoading();
      }
    };

    if (total === 0) {
      finishLoading();
      return;
    }

    // Load each image
    assetList.forEach(url => {
      const img = new Image();
      img.onload = onAssetLoaded;
      img.onerror = onAssetLoaded; // don't block forever if a photo 404s
      img.src = url;
    });

    // Fallback safety timeout (12s maximum) so gate never permanently freezes on slow networks
    setTimeout(() => {
      if (!isPageLoaded) finishLoading();
    }, 12000);
  }

  // Also wait for document fonts and window load
  const fontsPromise = document.fonts ? document.fonts.ready : Promise.resolve();
  const windowLoadPromise = new Promise(resolve => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });

  Promise.all([fontsPromise, windowLoadPromise]).then(() => {
    preloadAllAssets();
  });

  function finishLoading() {
    if (isPageLoaded) return;
    isPageLoaded = true;
    orb.classList.remove('is-loading');
    orb.removeAttribute('aria-disabled');
    if (gateLine) {
      gateLine.classList.remove('is-loading');
      gateLine.textContent = 'press & hold the moon';
    }
  }

  function holdTick() {
    if (!isPageLoaded) return;
    const pct = Math.min(1, (performance.now() - holdStart) / HOLD_MS);
    orbFill.style.strokeDashoffset = String(RING_LEN * (1 - pct));
    if (pct >= 1) { openGate(); return; }
    holdRaf = requestAnimationFrame(holdTick);
  }
  function holdDown(e) {
    if (opened || !isPageLoaded) return;
    e.preventDefault();
    orb.classList.add('holding');          /* rings whirl */
    holdStart = performance.now();
    holdRaf = requestAnimationFrame(holdTick);
  }
  function holdUp() {
    if (opened || !isPageLoaded) return;
    cancelAnimationFrame(holdRaf);
    orb.classList.remove('holding');
    orbFill.style.strokeDashoffset = String(RING_LEN);
  }

  orb.addEventListener('pointerdown', holdDown);
  addEventListener('pointerup', holdUp);
  addEventListener('pointercancel', holdUp);
  /* keyboard: Enter/Space opens immediately when loaded */
  orb.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !opened && isPageLoaded) {
      e.preventDefault();
      openGate();
    }
  });

  function openGate() {
    if (opened || !isPageLoaded) return;
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
    slot.innerHTML = `<img src="${data}" alt="the first photo of year two">`;
  }

  window.addEventListener('yearTwoPhotoSaved', refreshFinale);
  refreshFinale();

})();
