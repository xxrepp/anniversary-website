/* ============================================================
   studio.js — the Year Two photo studio.
   Flow: source (camera or gallery) → edit (pan/zoom inside the
   frame) → download PNG in three sizes.
   Camera fails soft: any getUserMedia problem silently falls
   back to the gallery picker. The photo is persisted downscaled
   (≤1600px, JPEG) so localStorage never hits its quota.
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
  const zoom = $('zoomSlider');
  const KEY = 'anniv.yearTwoPhoto';
  const FRAME_KEY = 'anniv.yearTwoFrame';

  let stream = null;
  let source = null;          /* Image or canvas holding the chosen photo */
  let presetKey = '4x5';
  let view = { scale: 1, offsetX: 0, offsetY: 0 };

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
    E.ensureFonts().then(() => { if (source && !steps.edit.hidden) draw(); });
    if (source) enterEdit();
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

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1920 } },
        audio: false
      });
      video.srcObject = stream;
      await video.play().catch(() => {});
      showStep('camera');
    } catch (err) {
      /* denied / unavailable / in-app browser — fall back quietly */
      stopStream();
      $('takePhotoBtn').hidden = true;
      $('sourceNote').textContent = "The camera didn't open here — choose a photo from your gallery instead.";
      showStep('source');
    }
  }

  function shutter() {
    if (!video.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    /* preview is mirrored (selfie convention); the capture is not */
    c.getContext('2d').drawImage(video, 0, 0);
    setSource(c);
  }

  /* ---------------- gallery ---------------- */

  function handleFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); setSource(img); };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      $('sourceNote').textContent = "That file couldn't be read — try another photo.";
    };
    img.src = url;
  }

  /* ---------------- edit ---------------- */

  function setSource(imgLike) {
    source = imgLike;
    view = { scale: 1, offsetX: 0, offsetY: 0 };
    persist();
    enterEdit();
  }

  function enterEdit() {
    showStep('edit');
    syncTabs();
    zoom.value = view.scale;
    sizeCanvas();
    draw();
  }

  function sizeCanvas() {
    const p = E.PRESETS[presetKey];
    const box = $('editStage');
    const maxW = Math.max(200, box.clientWidth);
    const maxH = Math.min(window.innerHeight * 0.52, 520);
    const k = Math.min(maxW / p.w, maxH / p.h);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(p.w * k * dpr);
    canvas.height = Math.round(p.h * k * dpr);
    canvas.style.width = Math.round(p.w * k) + 'px';
    canvas.style.height = Math.round(p.h * k) + 'px';
  }

  let rafPending = false;
  function draw() {
    if (!source || rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      E.renderComposite(canvas, source, presetKey, view);
    });
  }

  /* drag to pan, pinch or slider to zoom */
  const pointers = new Map();
  let pinchStart = null;

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { d: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
    }
  });

  canvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 1) pan(dx, dy);
    else if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 0 && pinchStart.d > 0) setScale(pinchStart.scale * d / pinchStart.d);
    }
  });

  const lift = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
  };
  canvas.addEventListener('pointerup', lift);
  canvas.addEventListener('pointercancel', lift);

  function pan(dxCss, dyCss) {
    if (!source) return;
    const p = E.PRESETS[presetKey];
    const cssW = canvas.clientWidth || 1;
    const exportPerCss = p.w / cssW;
    const { s0 } = E.photoGeometry(source, presetKey);
    const f = exportPerCss / (s0 * view.scale);   /* source px per css px */
    view.offsetX -= dxCss * f;
    view.offsetY -= dyCss * f;
    E.clampView(source, presetKey, view);
    draw();
  }

  function setScale(z) {
    view.scale = Math.min(4, Math.max(1, z));
    zoom.value = view.scale;
    E.clampView(source, presetKey, view);
    draw();
  }

  function syncTabs() {
    document.querySelectorAll('#presetTabs [data-preset]').forEach(b => {
      const on = b.dataset.preset === presetKey;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  /* ---------------- persistence (downscaled, quota-safe) ---------------- */

  function persist() {
    try {
      const w = source.width, h = source.height;
      const k = Math.min(1, 1600 / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k));
      c.height = Math.max(1, Math.round(h * k));
      c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
      localStorage.setItem(KEY, c.toDataURL('image/jpeg', 0.85));
    } catch (err) { /* fine — the photo just won't survive a refresh */ }
    persistFrame();
  }

  /* framed composite for the back-cover scrapbook strap */
  async function persistFrame() {
    if (!source) return;
    try {
      await E.ensureFonts();
      const p = E.PRESETS['4x5'];
      const maxSide = 720;
      const k = Math.min(1, maxSide / Math.max(p.w, p.h));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(p.w * k));
      c.height = Math.max(1, Math.round(p.h * k));
      E.renderComposite(c, source, '4x5', view);
      localStorage.setItem(FRAME_KEY, c.toDataURL('image/jpeg', 0.82));
      window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
    } catch (err) {
      try {
        window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
      } catch (e2) { /* ignore */ }
    }
  }

  function restore() {
    try {
      const data = localStorage.getItem(KEY);
      if (!data) return;
      const img = new Image();
      img.onload = () => {
        source = img;
        view = { scale: 1, offsetX: 0, offsetY: 0 };
        /* if she's sitting on the picker when the photo loads, jump ahead */
        if (!studio.hidden && !steps.source.hidden) enterEdit();
        /* refresh framed back-cover scrap if missing */
        if (!localStorage.getItem(FRAME_KEY)) persistFrame();
        else window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
      };
      img.src = data;
    } catch (err) { /* ignore */ }
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
  $('cameraBack').addEventListener('click', () => showStep('source'));
  $('uploadBtn').addEventListener('click', () => $('photoInput').click());
  $('photoInput').addEventListener('change', e => handleFile(e.target.files && e.target.files[0]));
  $('changePhotoBtn').addEventListener('click', () => {
    $('sourceNote').textContent = '';
    showStep('source');
  });

  zoom.addEventListener('input', () => setScale(parseFloat(zoom.value)));

  document.querySelectorAll('#presetTabs [data-preset]').forEach(b => {
    b.addEventListener('click', () => {
      presetKey = b.dataset.preset;
      syncTabs();
      sizeCanvas();
      if (source) { E.clampView(source, presetKey, view); draw(); }
    });
  });

  window.addEventListener('resize', () => {
    if (!studio.hidden && !steps.edit.hidden) { sizeCanvas(); draw(); }
  });

  $('downloadBtn').addEventListener('click', async () => {
    if (!source) return;
    const btn = $('downloadBtn');
    const note = $('downloadNote');
    btn.disabled = true;
    note.textContent = 'making your picture…';
    try {
      await E.exportPNG(source, presetKey, view);
      await persistFrame();
      note.textContent = 'saved! check your downloads — and peek at the back cover.';
    } catch (err) {
      note.textContent = 'something went wrong — try again?';
    }
    btn.disabled = false;
  });

  restore();
})();
