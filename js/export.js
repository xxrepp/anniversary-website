/* ============================================================
   export.js — Photobox Polaroid Compositor (9:16 IG Story).
   Aesthetic Photobox Polaroid card in full 9:16 Instagram Story format:
     · Dimension: 1080 x 1920 (Native 9:16)
     · Deep midnight navy background with subtle grain & starfield glow
     · Seamless edges (no transparent border / white outline)
     · Dynamic harmonious grid for photos (1-10 photos) with film borders
     · Minimal celestial theme artwork: subtle glowing crescent moon,
       sparkling stars & constellations, elegant Fraunces serif typography
     · High-res export for download & responsive pinned preview
   ============================================================ */
(function () {
  'use strict';

  // Base canvas dimension: 9:16 Story format
  const CARD_WIDTH = 1080;
  const CARD_HEIGHT = 1920;

  const COPY = {
    album: 'Museum of Us',
    big1: 'Year Two',
    sub: 'the first moments of our second year',
    tail: 'AUGUST 30, 2026'
  };

  const PAL = {
    bg0: '#060918',
    bg1: '#0B1026',
    bg2: '#121838',
    cardBorder: 'rgba(227, 184, 120, 0.3)',
    photoBg: '#050712',
    photoBorder: 'rgba(168, 199, 250, 0.25)',
    ink: '#EAF1FF',
    inkSoft: '#A9B8DC',
    inkFaint: '#6B7A9F',
    gold: '#E3B878',
    goldGlow: 'rgba(227, 184, 120, 0.25)',
    blueSoft: '#A8C7FA',
    star: 'rgba(234, 241, 255, 0.85)'
  };

  const FONT_DISPLAY = 'Fraunces, Georgia, serif';
  const FONT_BODY = 'Manrope, system-ui, sans-serif';

  let fontsPromise = null;
  function ensureFonts() {
    if (!fontsPromise) {
      const faces = [
        '300 64px Fraunces', '500 64px Fraunces', 'italic 300 64px Fraunces',
        '300 40px Manrope', '500 40px Manrope', '600 40px Manrope'
      ];
      fontsPromise = Promise.allSettled(faces.map(f => document.fonts.load(f)))
        .then(() => document.fonts.ready)
        .catch(() => {});
    }
    return fontsPromise;
  }

  // Pre-calculated fixed celestial stars for consistent aesthetic
  const FIXED_STARS = [
    { x: 0.12, y: 0.05, r: 1.6, alpha: 0.8, sparkle: true },
    { x: 0.24, y: 0.08, r: 1.0, alpha: 0.5 },
    { x: 0.82, y: 0.04, r: 1.8, alpha: 0.9, sparkle: true },
    { x: 0.92, y: 0.09, r: 1.2, alpha: 0.6 },
    { x: 0.06, y: 0.48, r: 1.4, alpha: 0.6, sparkle: true },
    { x: 0.95, y: 0.52, r: 1.5, alpha: 0.7, sparkle: true },
    { x: 0.08, y: 0.88, r: 1.8, alpha: 0.85, sparkle: true },
    { x: 0.20, y: 0.93, r: 1.0, alpha: 0.45 },
    { x: 0.80, y: 0.94, r: 1.2, alpha: 0.5 },
    { x: 0.90, y: 0.89, r: 1.6, alpha: 0.8, sparkle: true },
    { x: 0.50, y: 0.03, r: 1.1, alpha: 0.4 }
  ];

  // Dynamic grid layouts for 1 to 10 photos
  const LAYOUT_CONFIGS = {
    1: [1],
    2: [1, 1],
    3: [2, 1],
    4: [2, 2],
    5: [2, 3],
    6: [2, 2, 2],
    7: [2, 3, 2],
    8: [2, 2, 2, 2],
    9: [3, 3, 3],
    10: [2, 3, 3, 2]
  };

  function getGridSlots(count, gridRect) {
    const { x, y, w, h } = gridRect;
    const n = Math.max(1, Math.min(10, count || 1));
    const rowCounts = LAYOUT_CONFIGS[n] || [1];
    const rows = rowCounts.length;

    // Scale gap according to number of rows
    const gap = rows <= 2 ? Math.round(w * 0.026) : (rows <= 3 ? Math.round(w * 0.020) : Math.round(w * 0.016));
    const cellH = (h - (rows - 1) * gap) / rows;
    const slots = [];

    let currY = y;
    for (let r = 0; r < rows; r++) {
      const cols = rowCounts[r];
      const cellW = (w - (cols - 1) * gap) / cols;
      const rowW = cols * cellW + (cols - 1) * gap;
      const startX = x + (w - rowW) / 2;

      for (let c = 0; c < cols; c++) {
        slots.push({
          x: Math.round(startX + c * (cellW + gap)),
          y: Math.round(currY),
          w: Math.round(cellW),
          h: Math.round(cellH)
        });
      }
      currY += cellH + gap;
    }

    return slots;
  }

  function drawSparkle(ctx, cx, cy, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();

    // inner core dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFullMoon(ctx, cx, cy, r) {
    ctx.save();

    // Soft radial moon glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.2);
    glow.addColorStop(0, 'rgba(244, 219, 168, 0.4)');
    glow.addColorStop(0.5, 'rgba(227, 184, 120, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Moon base sphere
    const moonGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    moonGrad.addColorStop(0, '#FFF6E0');
    moonGrad.addColorStop(0.7, '#E8C58C');
    moonGrad.addColorStop(1, '#C79D5C');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = moonGrad;
    ctx.fill();

    // Subtle maria / crater textures
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(168, 128, 70, 0.22)';
    [
      [cx - r * 0.3, cy + r * 0.15, r * 0.32],
      [cx + r * 0.25, cy - r * 0.2, r * 0.24],
      [cx + r * 0.1, cy + r * 0.35, r * 0.28],
      [cx - r * 0.1, cy - r * 0.4, r * 0.18]
    ].forEach(([mx, my, mr]) => {
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Crisp subtle rim
    ctx.strokeStyle = 'rgba(255, 246, 224, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw one image with cover crop inside a given slot with rounded corners
  function drawCoverImage(ctx, img, slot, radius, scale) {
    if (!img) return;
    const { x, y, w, h } = slot;
    const imgW = img.width || img.videoWidth || 1;
    const imgH = img.height || img.videoHeight || 1;

    const imgScale = Math.max(w / imgW, h / imgH);
    const sw = w / imgScale;
    const sh = h / imgScale;
    const sx = (imgW - sw) / 2;
    const sy = (imgH - sh) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.clip();

    // Dark photo placeholder background
    ctx.fillStyle = PAL.photoBg;
    ctx.fillRect(x, y, w, h);

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);

    // Inner subtle film vignette
    const grad = ctx.createRadialGradient(
      x + w / 2, y + h / 2, Math.min(w, h) * 0.35,
      x + w / 2, y + h / 2, Math.max(w, h) * 0.8
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.restore();

    // Subtle crisp inner frame line
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.strokeStyle = PAL.photoBorder;
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function renderComposite(canvas, sources) {
    const imgs = Array.isArray(sources) ? sources.filter(Boolean) : (sources ? [sources] : []);
    const count = Math.min(10, Math.max(1, imgs.length));

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const scale = W / CARD_WIDTH;

    // 1. Full Canvas Background: NO outer margin, NO transparent gap, NO white borders
    ctx.save();
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, PAL.bg0);
    bgGrad.addColorStop(0.3, PAL.bg1);
    bgGrad.addColorStop(0.7, PAL.bg2);
    bgGrad.addColorStop(1, PAL.bg0);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Soft celestial ambient glow (top & bottom)
    ctx.save();
    const topGlow = ctx.createRadialGradient(W * 0.5, H * 0.08, 0, W * 0.5, H * 0.08, W * 0.7);
    topGlow.addColorStop(0, 'rgba(109, 155, 245, 0.12)');
    topGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, W, H * 0.4);

    const bottomGlow = ctx.createRadialGradient(W * 0.5, H * 0.92, 0, W * 0.5, H * 0.92, W * 0.65);
    bottomGlow.addColorStop(0, 'rgba(227, 184, 120, 0.1)');
    bottomGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);
    ctx.restore();

    // 2. Minimal Background Stars & Constellations
    ctx.save();
    FIXED_STARS.forEach(st => {
      const sx = st.x * W;
      const sy = st.y * H;
      const sr = st.r * scale;

      ctx.fillStyle = PAL.star;
      ctx.globalAlpha = st.alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();

      if (st.sparkle) {
        drawSparkle(ctx, sx, sy, 8 * scale, PAL.gold);
      }
    });
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // 3. Elegant Subtle Frame Inset (Aesthetic Thin Gold/Blue lines)
    const inset = 36 * scale;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(inset, inset, W - inset * 2, H - inset * 2, 28 * scale);
    ctx.strokeStyle = PAL.cardBorder;
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();

    // Corner decorative mini crosses
    const cSize = 6 * scale;
    const cOffset = inset + 12 * scale;
    [
      [cOffset, cOffset],
      [W - cOffset, cOffset],
      [cOffset, H - cOffset],
      [W - cOffset, H - cOffset]
    ].forEach(([cx, cy]) => {
      drawSparkle(ctx, cx, cy, cSize, PAL.gold);
    });
    ctx.restore();

    // 4. Header Section: Title & Full Moon
    const headerY = 124 * scale;
    ctx.save();
    ctx.textAlign = 'center';

    // Full glowing moon above header
    drawFullMoon(ctx, W * 0.5, headerY - 32 * scale, 18 * scale);

    // Main album title
    ctx.font = `300 ${40 * scale}px ${FONT_DISPLAY}`;
    ctx.fillStyle = PAL.ink;
    ctx.letterSpacing = `${2 * scale}px`;
    ctx.fillText(COPY.album, W * 0.5, headerY + 46 * scale);
    ctx.restore();
    // 5. 2x2 Photo Grid Area
    const gridPadX = 64 * scale;
    const gridTop = 230 * scale;
    const footerHeight = 280 * scale;
    const gridW = W - gridPadX * 2;
    const gridH = H - gridTop - footerHeight;
    const gridRect = {
      x: gridPadX,
      y: gridTop,
      w: gridW,
      h: gridH
    };

    const photoRadius = Math.max(8 * scale, (count <= 4 ? 18 : (count <= 7 ? 14 : 10)) * scale);
    const slots = getGridSlots(count, gridRect);

    for (let i = 0; i < slots.length; i++) {
      const img = imgs[i];
      if (img) {
        drawCoverImage(ctx, img, slots[i], photoRadius, scale);
      } else {
        // Empty slot placeholder
        const slot = slots[i];
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(slot.x, slot.y, slot.w, slot.h, photoRadius);
        ctx.fillStyle = 'rgba(11, 16, 38, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(168, 199, 250, 0.18)';
        ctx.lineWidth = 1.2 * scale;
        ctx.setLineDash([8 * scale, 6 * scale]);
        ctx.stroke();

        ctx.font = `italic 300 ${22 * scale}px ${FONT_DISPLAY}`;
        ctx.fillStyle = PAL.inkFaint;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+ photo ${i + 1}`, slot.x + slot.w / 2, slot.y + slot.h / 2);
        ctx.restore();
      }
    }

    // 6. Photobox Footer: Year Two & Date
    const footerCenterY = gridTop + gridH + footerHeight / 2 - 8 * scale;

    ctx.save();
    ctx.textAlign = 'center';

    // Sparkle star ornaments flanking the title
    drawSparkle(ctx, W * 0.5 - 145 * scale, footerCenterY - 6 * scale, 9 * scale, PAL.gold);
    drawSparkle(ctx, W * 0.5 + 145 * scale, footerCenterY - 6 * scale, 9 * scale, PAL.gold);

    // Big Script / Serif Title: Year Two
    ctx.font = `italic 300 ${52 * scale}px ${FONT_DISPLAY}`;
    ctx.fillStyle = PAL.ink;
    ctx.fillText(COPY.big1, W * 0.5, footerCenterY);

    // Subtitle
    ctx.font = `300 ${18 * scale}px ${FONT_BODY}`;
    ctx.fillStyle = PAL.inkSoft;
    ctx.letterSpacing = `${1 * scale}px`;
    ctx.fillText(COPY.sub, W * 0.5, footerCenterY + 44 * scale);

    // Bottom Date Tag with Infinity Sign (∞)
    ctx.font = `500 ${15 * scale}px ${FONT_BODY}`;
    ctx.fillStyle = PAL.gold;
    ctx.letterSpacing = `${3.5 * scale}px`;
    ctx.fillText(`${COPY.tail} · ∞`, W * 0.5, footerCenterY + 84 * scale);

    ctx.restore();
  }

  async function exportPNG(sources) {
    await ensureFonts();
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    renderComposite(canvas, sources);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `museum-of-us-story-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return blob;
  }

  window.ExportEngine = {
    CARD_WIDTH,
    CARD_HEIGHT,
    ensureFonts,
    renderComposite,
    exportPNG
  };
})();
