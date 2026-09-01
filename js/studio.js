/* ============================================================
   studio.js — Photobox Polaroid Studio (Multi-photo).
   Allows snapping up to 10 photos via camera or selecting multiple
   photos from the gallery, compositing them into a Photobox Polaroid.
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
  const TRANSFORMS_KEY = 'anniv.yearTwoTransforms';
  const FRAME_KEY = 'anniv.yearTwoFrame';
  const RATIO_KEY = 'anniv.yearTwoRatio';

  const MAX_PHOTOS = 10;
  let stream = null;
  let sources = []; // Array of Image or Canvas objects (max 10)
  let transforms = []; // Array of { offsetX: 0, offsetY: 0, zoom: 1 }
  const camSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!camSupported) $('takePhotoBtn').hidden = true;

  let currentRatio = localStorage.getItem(RATIO_KEY) || '4:5';
  if (!E.FORMATS || !E.FORMATS[currentRatio]) currentRatio = '4:5';

  function getTransform(idx) {
    if (!transforms[idx]) {
      transforms[idx] = { offsetX: 0, offsetY: 0, zoom: 1 };
    }
    return transforms[idx];
  }

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
    if (counter) counter.textContent = `photo ${Math.min(MAX_PHOTOS, current)} of ${MAX_PHOTOS}`;
    if (doneBtn) doneBtn.hidden = sources.length === 0;
  }

  async function startCamera() {
    if (sources.length >= MAX_PHOTOS) {
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
    if (!video.videoWidth || sources.length >= MAX_PHOTOS) return;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);

    sources.push(c);
    transforms.push({ offsetX: 0, offsetY: 0, zoom: 1 });
    updateCameraCounter();
    persist();

    if (sources.length >= MAX_PHOTOS) {
      stopStream();
      enterEdit();
    }
  }

  /* ---------------- gallery ---------------- */

  function handleFiles(fileList) {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - sources.length);
    if (!files.length) return;
    let loaded = 0;
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        sources.push(img);
        transforms.push({ offsetX: 0, offsetY: 0, zoom: 1 });
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
    while (transforms.length < sources.length) {
      transforms.push({ offsetX: 0, offsetY: 0, zoom: 1 });
    }
    showStep('edit');
    updateRatioButtons();
    sizeCanvas();
    renderTray();
    draw();
  }

  function updateRatioButtons() {
    const buttons = studio.querySelectorAll('.ratio-btn');
    buttons.forEach(btn => {
      const r = btn.getAttribute('data-ratio');
      const isActive = r === currentRatio;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  function setRatio(ratioKey) {
    if (ratioKey !== '4:5' && ratioKey !== '9:16') return;
    if (currentRatio === ratioKey) return;
    currentRatio = ratioKey;
    try {
      localStorage.setItem(RATIO_KEY, currentRatio);
    } catch (e) {}
    updateRatioButtons();
    sizeCanvas();
    draw();
    persistFrame();
  }

  function sizeCanvas() {
    const box = $('editStage');
    const maxW = Math.max(200, box.clientWidth || 360);
    const maxH = Math.min(window.innerHeight * 0.54, 540);
    const format = (E.FORMATS && E.FORMATS[currentRatio]) || { width: 1080, height: 1350 };
    const cardW = format.width;
    const cardH = format.height;
    const k = Math.min(maxW / cardW, maxH / cardH);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(cardW * k * dpr);
    canvas.height = Math.round(cardH * k * dpr);
    canvas.style.width = Math.round(cardW * k) + 'px';
    canvas.style.height = Math.round(cardH * k) + 'px';
  }

  let rafPending = false;
  function draw() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      E.renderComposite(canvas, sources, currentRatio, { transforms });
    });
  }

  /* ---------------- photo tray (drag-to-reorder + remove) ---------------- */

  let dragSrcIdx = null;
  let touchDragIdx = null;
  let touchDragClone = null;
  let touchStartX = 0;
  let touchStartY = 0;

  function movePhoto(fromIdx, toIdx) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= sources.length || toIdx >= sources.length) return;
    const [movedSrc] = sources.splice(fromIdx, 1);
    const [movedTr] = transforms.splice(fromIdx, 1);
    sources.splice(toIdx, 0, movedSrc);
    transforms.splice(toIdx, 0, movedTr || { offsetX: 0, offsetY: 0, zoom: 1 });
    persist();
    renderTray();
    draw();
  }

  function renderTray() {
    if (!photoTray) return;
    photoTray.innerHTML = '';
    sources.forEach((src, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'tray-item';
      thumb.setAttribute('draggable', 'true');
      thumb.setAttribute('data-index', idx);
      thumb.setAttribute('title', 'drag to reorder');

      const numBadge = document.createElement('span');
      numBadge.className = 'tray-num';
      numBadge.textContent = idx + 1;

      const imgPreview = document.createElement('img');
      imgPreview.src = src.toDataURL ? src.toDataURL('image/jpeg', 0.6) : src.src;
      imgPreview.alt = `photo ${idx + 1}`;

      const delBtn = document.createElement('button');
      delBtn.className = 'tray-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'remove photo';
      delBtn.setAttribute('aria-label', `remove photo ${idx + 1}`);
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sources.splice(idx, 1);
        transforms.splice(idx, 1);
        persist();
        if (sources.length === 0) {
          showStep('source');
        } else {
          renderTray();
          draw();
        }
      });

      // Desktop HTML5 Drag and Drop
      thumb.addEventListener('dragstart', e => {
        dragSrcIdx = idx;
        thumb.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
      });

      thumb.addEventListener('dragend', () => {
        thumb.classList.remove('dragging');
        photoTray.querySelectorAll('.tray-item').forEach(el => el.classList.remove('drag-over', 'drag-before', 'drag-after'));
        dragSrcIdx = null;
      });

      thumb.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragSrcIdx === null || dragSrcIdx === idx) return;
        thumb.classList.add('drag-over');
      });

      thumb.addEventListener('dragleave', () => {
        thumb.classList.remove('drag-over');
      });

      thumb.addEventListener('drop', e => {
        e.preventDefault();
        thumb.classList.remove('drag-over');
        if (dragSrcIdx !== null && dragSrcIdx !== idx) {
          movePhoto(dragSrcIdx, idx);
        }
      });

      // Mobile Touch Drag and Drop
      thumb.addEventListener('touchstart', e => {
        if (e.target.closest('.tray-del')) return;
        const touch = e.touches[0];
        touchDragIdx = idx;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }, { passive: true });

      thumb.appendChild(numBadge);
      thumb.appendChild(imgPreview);
      thumb.appendChild(delBtn);
      photoTray.appendChild(thumb);
    });

    const addBtn = $('addPhotoBtn');
    if (addBtn) {
      addBtn.style.display = sources.length >= MAX_PHOTOS ? 'none' : 'inline-flex';
    }
  }

  // Global touchmove / touchend handlers for tray drag reordering on mobile
  document.addEventListener('touchmove', e => {
    if (touchDragIdx === null) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartX);
    const dy = Math.abs(touch.clientY - touchStartY);

    if (!touchDragClone && (dx > 8 || dy > 8)) {
      const itemEl = photoTray.querySelector(`.tray-item[data-index="${touchDragIdx}"]`);
      if (itemEl) {
        itemEl.classList.add('dragging');
        touchDragClone = itemEl.cloneNode(true);
        touchDragClone.classList.add('tray-drag-ghost');
        document.body.appendChild(touchDragClone);
      }
    }

    if (touchDragClone) {
      e.preventDefault();
      touchDragClone.style.left = `${touch.clientX - 26}px`;
      touchDragClone.style.top = `${touch.clientY - 26}px`;

      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const trayItem = targetEl ? targetEl.closest('.tray-item') : null;
      photoTray.querySelectorAll('.tray-item').forEach(el => el.classList.remove('drag-over'));
      if (trayItem && trayItem.getAttribute('data-index') !== String(touchDragIdx)) {
        trayItem.classList.add('drag-over');
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if (touchDragIdx === null) return;
    const changedTouch = e.changedTouches[0];
    if (touchDragClone) {
      touchDragClone.remove();
      touchDragClone = null;
      const targetEl = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
      const trayItem = targetEl ? targetEl.closest('.tray-item') : null;
      if (trayItem) {
        const targetIdx = parseInt(trayItem.getAttribute('data-index'), 10);
        if (!isNaN(targetIdx) && targetIdx !== touchDragIdx) {
          movePhoto(touchDragIdx, targetIdx);
        }
      }
    }
    if (photoTray) {
      photoTray.querySelectorAll('.tray-item').forEach(el => el.classList.remove('dragging', 'drag-over'));
    }
    touchDragIdx = null;
  });

  document.addEventListener('touchcancel', () => {
    if (touchDragClone) {
      touchDragClone.remove();
      touchDragClone = null;
    }
    if (photoTray) {
      photoTray.querySelectorAll('.tray-item').forEach(el => el.classList.remove('dragging', 'drag-over'));
    }
    touchDragIdx = null;
  });

  /* ---------------- in-frame photo panning & zooming (mouse/touch/wheel) ---------------- */

  let activePanSlotIndex = null;
  let panStartPoint = null;
  let panStartOffset = null;
  let pinchStartDistance = null;
  let pinchStartZoom = 1;

  function getSlotIndexAt(clientX, clientY) {
    if (!sources.length) return -1;
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return -1;

    // Map CSS px to canvas internal coordinate
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const metrics = E.getRenderMetrics(canvas, sources.length, currentRatio);
    const slots = metrics.slots;
    for (let i = 0; i < slots.length && i < sources.length; i++) {
      const s = slots[i];
      if (canvasX >= s.x && canvasX <= s.x + s.w && canvasY >= s.y && canvasY <= s.y + s.h) {
        return i;
      }
    }
    return -1;
  }

  canvas.addEventListener('mousedown', e => {
    const slotIdx = getSlotIndexAt(e.clientX, e.clientY);
    if (slotIdx === -1) return;
    e.preventDefault();
    activePanSlotIndex = slotIdx;
    panStartPoint = { x: e.clientX, y: e.clientY };
    const tr = getTransform(slotIdx);
    panStartOffset = { x: tr.offsetX, y: tr.offsetY };
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (activePanSlotIndex === null) {
      if (!studio.hidden && !steps.edit.hidden) {
        const overIdx = getSlotIndexAt(e.clientX, e.clientY);
        canvas.style.cursor = overIdx !== -1 ? 'grab' : 'default';
      }
      return;
    }
    const dx = e.clientX - panStartPoint.x;
    const dy = e.clientY - panStartPoint.y;

    const rect = canvas.getBoundingClientRect();
    const metrics = E.getRenderMetrics(canvas, sources.length, currentRatio);
    const slot = metrics.slots[activePanSlotIndex];
    const img = sources[activePanSlotIndex];
    if (!slot || !img) return;

    const imgW = img.width || img.videoWidth || 1;
    const imgH = img.height || img.videoHeight || 1;
    const tr = getTransform(activePanSlotIndex);
    const zoom = tr.zoom || 1.0;
    const baseScale = Math.max(slot.w / imgW, slot.h / imgH);
    const finalScale = baseScale * zoom;
    const sw = slot.w / finalScale;
    const sh = slot.h / finalScale;
    const maxSlackX = Math.max(1, (imgW - sw) / 2);
    const maxSlackY = Math.max(1, (imgH - sh) / 2);

    // Convert client px delta to canvas coordinate delta
    const scaleCanvasX = canvas.width / rect.width;
    const scaleCanvasY = canvas.height / rect.height;
    const canvasDx = dx * scaleCanvasX;
    const canvasDy = dy * scaleCanvasY;

    // Dragging right canvasDx > 0 means we want to show more left content -> increment offsetX
    const deltaOffsetX = (canvasDx / finalScale) / maxSlackX;
    const deltaOffsetY = (canvasDy / finalScale) / maxSlackY;

    tr.offsetX = Math.max(-1, Math.min(1, panStartOffset.x + deltaOffsetX));
    tr.offsetY = Math.max(-1, Math.min(1, panStartOffset.y + deltaOffsetY));
    draw();
  });

  window.addEventListener('mouseup', () => {
    if (activePanSlotIndex !== null) {
      activePanSlotIndex = null;
      panStartPoint = null;
      panStartOffset = null;
      canvas.style.cursor = 'grab';
      persist();
    }
  });

  // Touch Pan and Pinch-to-zoom on Canvas
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const slotIdx = getSlotIndexAt(touch.clientX, touch.clientY);
      if (slotIdx !== -1) {
        activePanSlotIndex = slotIdx;
        panStartPoint = { x: touch.clientX, y: touch.clientY };
        const tr = getTransform(slotIdx);
        panStartOffset = { x: tr.offsetX, y: tr.offsetY };
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const slotIdx = getSlotIndexAt(midX, midY);
      if (slotIdx !== -1) {
        activePanSlotIndex = slotIdx;
        const tr = getTransform(slotIdx);
        pinchStartDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartZoom = tr.zoom || 1.0;
      }
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    if (activePanSlotIndex === null) return;
    e.preventDefault();
    const tr = getTransform(activePanSlotIndex);

    if (e.touches.length === 1 && panStartPoint && panStartOffset) {
      const touch = e.touches[0];
      const dx = touch.clientX - panStartPoint.x;
      const dy = touch.clientY - panStartPoint.y;

      const rect = canvas.getBoundingClientRect();
      const metrics = E.getRenderMetrics(canvas, sources.length, currentRatio);
      const slot = metrics.slots[activePanSlotIndex];
      const img = sources[activePanSlotIndex];
      if (!slot || !img) return;

      const imgW = img.width || img.videoWidth || 1;
      const imgH = img.height || img.videoHeight || 1;
      const zoom = tr.zoom || 1.0;
      const baseScale = Math.max(slot.w / imgW, slot.h / imgH);
      const finalScale = baseScale * zoom;
      const sw = slot.w / finalScale;
      const sh = slot.h / finalScale;
      const maxSlackX = Math.max(1, (imgW - sw) / 2);
      const maxSlackY = Math.max(1, (imgH - sh) / 2);

      const scaleCanvasX = canvas.width / rect.width;
      const scaleCanvasY = canvas.height / rect.height;
      const canvasDx = dx * scaleCanvasX;
      const canvasDy = dy * scaleCanvasY;

      const deltaOffsetX = (canvasDx / finalScale) / maxSlackX;
      const deltaOffsetY = (canvasDy / finalScale) / maxSlackY;

      tr.offsetX = Math.max(-1, Math.min(1, panStartOffset.x + deltaOffsetX));
      tr.offsetY = Math.max(-1, Math.min(1, panStartOffset.y + deltaOffsetY));
      draw();
    } else if (e.touches.length === 2 && pinchStartDistance) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = dist / pinchStartDistance;
      tr.zoom = Math.max(1.0, Math.min(3.5, pinchStartZoom * factor));
      draw();
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
      activePanSlotIndex = null;
      panStartPoint = null;
      panStartOffset = null;
      pinchStartDistance = null;
      persist();
    }
  });

  // Mouse wheel to zoom in/out on specific photo slot
  canvas.addEventListener('wheel', e => {
    const slotIdx = getSlotIndexAt(e.clientX, e.clientY);
    if (slotIdx === -1) return;
    e.preventDefault();
    const tr = getTransform(slotIdx);
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    tr.zoom = Math.max(1.0, Math.min(3.5, (tr.zoom || 1.0) + zoomDelta));
    draw();
    persist();
  }, { passive: false });

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
      localStorage.setItem(TRANSFORMS_KEY, JSON.stringify(transforms));
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
      const format = (E.FORMATS && E.FORMATS[currentRatio]) || { width: 1080, height: 1350 };
      const cardW = format.width;
      const cardH = format.height;
      const maxSide = 900;
      const k = Math.min(1, maxSide / Math.max(cardW, cardH));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(cardW * k));
      c.height = Math.max(1, Math.round(cardH * k));
      E.renderComposite(c, sources, currentRatio, { transforms });
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
      const rawTr = localStorage.getItem(TRANSFORMS_KEY);
      if (rawTr) {
        try { transforms = JSON.parse(rawTr) || []; } catch (e) { transforms = []; }
      }
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) return;

      let loaded = 0;
      sources = [];
      const targetList = list.slice(0, MAX_PHOTOS);
      targetList.forEach((dataUrl, i) => {
        const img = new Image();
        img.onload = () => {
          sources[i] = img;
          loaded++;
          if (loaded === targetList.length) {
            sources = sources.filter(Boolean);
            while (transforms.length < sources.length) {
              transforms.push({ offsetX: 0, offsetY: 0, zoom: 1 });
            }
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
    transforms = [];
    localStorage.removeItem(KEY);
    localStorage.removeItem(TRANSFORMS_KEY);
    localStorage.removeItem(FRAME_KEY);
    window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
    $('sourceNote').textContent = '';
    showStep('source');
  });
  window.addEventListener('resetYearTwoStudio', () => {
    sources = [];
    transforms = [];
    localStorage.removeItem(KEY);
    localStorage.removeItem(TRANSFORMS_KEY);
    localStorage.removeItem(FRAME_KEY);
    window.dispatchEvent(new CustomEvent('yearTwoPhotoSaved'));
    $('sourceNote').textContent = '';
    showStep('source');
  });

  studio.addEventListener('click', e => {
    const ratioBtn = e.target.closest('.ratio-btn');
    if (ratioBtn) {
      const r = ratioBtn.getAttribute('data-ratio');
      if (r) setRatio(r);
    }
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
      await E.exportPNG(sources, currentRatio, { transforms });
      await persistFrame();
      note.textContent = 'saved! check your downloads & see it pinned at the end.';
    } catch (err) {
      note.textContent = 'something went wrong — try again?';
    }
    btn.disabled = false;
  });

  restore();
})();
