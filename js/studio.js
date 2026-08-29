/* ============================================================
   studio.js — Photobox Polaroid Studio (Multi-photo).
   Allows snapping up to 4 photos via camera or selecting multiple
   photos from the gallery, compositing them into a 2x2 Photobox Polaroid.
   ============================================================ */
(function () {
  'use strict';

  const E = window.ExportEngine;
  const $ = id => document.getElementById(id);
  const studio = $('studio');
  if (!studio || !E) return;

  const steps = { source: $('stepSource'), camera: $('stepCamera'), edit: $('stepEdit') };
  const video = $('cameraVideo');
  const canvas = $('editCanvas');
  const photoTray = $('photoTray');
  const KEY = 'anniv.yearTwoPhotos';
  const FRAME_KEY = 'anniv.yearTwoFrame';

  let stream = null;
  let sources = []; // Array of Image or Canvas objects (max 4)

  const camSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!camSupported) $('takePhotoBtn').hidden = true;

  /* ---------------- open / close ---------------- */

  function showStep(name) {
    Object.entries(steps).forEach(([k, el]) => { el.hidden = k !== name; });
    if (name !== 'camera') stopStream();
  }

  function open() {
    studio.hidden = false;
    document.body.classList.add('studio-open', 'no-scroll');
    E.ensureFonts().then(() => { if (sources.length && !steps.edit.hidden) draw(); });
    if (sources.length) enterEdit();
    else showStep('source');
  }

  function close() {
    stopStream();
    studio.hidden = true;
    document.body.classList.remove('studio-open', 'no-scroll');
  }

  /* ---------------- camera ---------------- */

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
      video.srcObject = null;
    }
  }

  function updateCameraCounter() {
    const counter = $('cameraCounter');
    const doneBtn = $('cameraDone');
    const current = sources.length + 1;
    if (counter) counter.textContent = `photo ${Math.min(4, current)} of 4`;
    if (doneBtn) doneBtn.hidden = sources.length === 0;
  }

  async function startCamera() {
    if (sources.length >= 4) {
      enterEdit();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('takePhotoBtn').hidden = true;
      $('sourceNote').textContent = "Camera is not supported on this browser or requires a secure HTTPS connection.";
      return;
    }

    const constraintSets = [
      { video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: true, audio: false }
    ];

    let lastErr = null;
    for (const constraints of constraintSets) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!stream) {
      stopStream();
      let msg = "Camera couldn't be accessed. Please check permissions or select from gallery.";
      if (lastErr && (lastErr.name === 'NotAllowedError' || lastErr.name === 'PermissionDeniedError')) {
        msg = "Camera permission was denied. Please allow camera access in your browser settings.";
      } else if (lastErr && lastErr.name === 'NotFoundError') {
        msg = "No camera found on this device. Please select photos from gallery.";
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        msg = "Camera requires HTTPS. Please access this website over HTTPS.";
      }
      $('sourceNote').textContent = msg;
      showStep('source');
      return;
    }

    try {
      video.srcObject = stream;
      await video.play().catch(() => {});
      updateCameraCounter();
      showStep('camera');
    } catch (err) {
      stopStream();
      $('sourceNote').textContent = "Could not start video stream. Please choose photos from gallery.";
      showStep('source');
    }
  }

  function shutter() {
    if (!video.videoWidth || sources.length >= 4) return;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);

    sources.push(c);
    updateCameraCounter();
    persist();

    if (sources.length >= 4) {
      stopStream();
      enterEdit();
    }
  }

  /* ---------------- gallery ---------------- */

  function handleFiles(fileList) {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList).slice(0, 4 - sources.length);
    if (!files.length) return;

    let loaded = 0;
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        sources.push(img);
        loaded++;
        if (loaded === files.length) {
          persist();
          enterEdit();
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        loaded++;
        if (loaded === files.length && sources.length) {
          persist();
          enterEdit();
        }
      };
      img.src = url;
    });
  }

  /* ---------------- edit & preview ---------------- */

  function enterEdit() {
    showStep('edit');
    sizeCanvas();
    renderTray();
    draw();
  }

  function sizeCanvas() {
    const box = $('editStage');
    const maxW = Math.max(200, box.clientWidth || 360);
    const maxH = Math.min(window.innerHeight * 0.54, 540);
    const k = Math.min(maxW / E.CARD_WIDTH, maxH / E.CARD_HEIGHT);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(E.CARD_WIDTH * k * dpr);
    canvas.height = Math.round(E.CARD_HEIGHT * k * dpr);
    canvas.style.width = Math.round(E.CARD_WIDTH * k) + 'px';
    canvas.style.height = Math.round(E.CARD_HEIGHT * k) + 'px';
  }

  let rafPending = false;
  function draw() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      E.renderComposite(canvas, sources);
    });
  }

  function renderTray() {
    if (!photoTray) return;
    photoTray.innerHTML = '';
    sources.forEach((src, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'tray-item';

      const imgPreview = document.createElement('img');
      imgPreview.src = src.toDataURL ? src.toDataURL('image/jpeg', 0.6) : src.src;

      const delBtn = document.createElement('button');
      delBtn.className = 'tray-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'remove photo';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sources.splice(idx, 1);
        persist();
        if (sources.length === 0) {
          showStep('source');
        } else {
          renderTray();
          draw();
        }
      });

      thumb.appendChild(imgPreview);
      thumb.appendChild(delBtn);
      photoTray.appendChild(thumb);
    });

    const addBtn = $('addPhotoBtn');
    if (addBtn) {
      addBtn.style.display = sources.length >= 4 ? 'none' : 'inline-flex';
    }
  }

  /* ---------------- persistence ---------------- */

  function persist() {
    try {
      const serialized = sources.map(src => {
        const w = src.width || src.videoWidth || 800;
        const h = src.height || src.videoHeight || 800;
        const k = Math.min(1, 1000 / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * k));
        c.height = Math.max(1, Math.round(h * k));
        c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.82);
      });
      localStorage.setItem(KEY, JSON.stringify(serialized));
    } catch (err) { /* localStorage quota guard */ }
    persistFrame();
  }
  async function persistFrame() {
    if (!sources.length) {
      localStorage.removeItem(FRAME_KEY);
      window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
      return;
    }
    try {
      await E.ensureFonts();
      const maxSide = 900;
      const k = Math.min(1, maxSide / Math.max(E.CARD_WIDTH, E.CARD_HEIGHT));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(E.CARD_WIDTH * k));
      c.height = Math.max(1, Math.round(E.CARD_HEIGHT * k));
      E.renderComposite(c, sources);
      localStorage.setItem(FRAME_KEY, c.toDataURL('image/jpeg', 0.85));
      window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
    } catch (err) {
      try {
        window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
      } catch (e2) {}
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) return;

      let loaded = 0;
      sources = [];
      list.slice(0, 4).forEach(dataUrl => {
        const img = new Image();
        img.onload = () => {
          sources.push(img);
          loaded++;
          if (loaded === list.length) {
            if (!studio.hidden && !steps.source.hidden) enterEdit();
            if (!localStorage.getItem(FRAME_KEY)) persistFrame();
            else window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
          }
        };
        img.src = dataUrl;
      });
    } catch (err) {}
  }

  /* ---------------- wiring ---------------- */

  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-studio]')) open();
  });
  $('studioClose').addEventListener('click', close);
  studio.addEventListener('click', e => { if (e.target === studio) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !studio.hidden) close();
  });

  $('takePhotoBtn').addEventListener('click', startCamera);
  $('shutterBtn').addEventListener('click', shutter);
  $('cameraDone').addEventListener('click', () => {
    stopStream();
    enterEdit();
  });
  $('cameraBack').addEventListener('click', () => {
    stopStream();
    if (sources.length) enterEdit();
    else showStep('source');
  });

  $('uploadBtn').addEventListener('click', () => $('photoInput').click());
  $('photoInput').addEventListener('change', e => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  $('addPhotoBtn').addEventListener('click', () => {
    $('photoInput').click();
  });

  $('changePhotoBtn').addEventListener('click', () => {
    sources = [];
    localStorage.removeItem(KEY);
    localStorage.removeItem(FRAME_KEY);
    window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
    $('sourceNote').textContent = '';
    showStep('source');
  });
  window.addEventListener('resetYearTwoStudio', () => {
    sources = [];
    localStorage.removeItem(KEY);
    localStorage.removeItem(FRAME_KEY);
    window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
    $('sourceNote').textContent = '';
    showStep('source');
  });

  window.addEventListener('resize', () => {
    if (!studio.hidden && !steps.edit.hidden) { sizeCanvas(); draw(); }
  });

  $('downloadBtn').addEventListener('click', async () => {
    if (!sources.length) return;
    const btn = $('downloadBtn');
    const note = $('downloadNote');
    btn.disabled = true;
    note.textContent = 'printing your polaroid…';
    try {
      await E.exportPNG(sources);
      await persistFrame();
      note.textContent = 'saved! check your downloads & see it pinned at the end.';
    } catch (err) {
      note.textContent = 'something went wrong — try again?';
    }
    btn.disabled = false;
  });

  restore();
})();
