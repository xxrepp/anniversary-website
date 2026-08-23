/* ============================================================
   export.js — the Year Two frame compositor.
   REDESIGN: "Midnight Constellation" twibbon —
     · deep-space starfield backdrop with a soft moon
     · photo in a circular moon-crop, hugged by orbit rings
       (gold satellite dot on the outer ring)
     · glass text card with the Year Two copy
   Same public API (window.ExportEngine) and same geometry rules:
   all layout is relative to canvas W/H so the live preview and
   the full-res export draw identically. Pan/zoom view honored.
   ============================================================ */
(function () {
  'use strict';

  const PRESETS = {
    '16x9': { w: 1920, h: 1080, name: 'landscape-16x9', layout: 'landscape' },
    '4x5':  { w: 1080, h: 1350, name: 'feed-4x5',       layout: 'portrait'  },
    '9x16': { w: 1080, h: 1920, name: 'story-9x16',     layout: 'story'     }
  };

  const COPY = {
    cornerTop:    'a soft little memory',
    cornerBottom: 'to be continued',
    album:        'Museum of Us',
    big1:         'Year Two',
    big2:         'begins now',
    sub:          'our first photo of the next chapter',
    tail:         'volume ii · from august 30, 2026',
    caption:      'year two · photo one'
  };

  const PAL = {
    bg0: '#070B1A', bg1: '#0B1026',
    ink: '#EAF1FF', inkSoft: '#A9B8DC', inkFaint: '#66739B',
    blue: '#6D9BF5', blueSoft: '#A8C7FA', violet: '#8F7BF0',
    gold: '#E3B878', ring: 'rgba(168,199,250,.35)'
  };
  const FONT_HAND = '"Ma Shan Zheng", cursive';
  const FONT_DISPLAY = 'Fraunces, Georgia, serif';
  const FONT_BODY = 'Manrope, system-ui, sans-serif';

  /* -------- fonts: never draw before the webfonts exist -------- */
  let fontsPromise = null;
  function ensureFonts() {
    if (!fontsPromise) {
      const faces = [
        '400 64px "Ma Shan Zheng"',
        '300 64px Fraunces', '500 64px Fraunces', '600 64px Fraunces',
        'italic 300 64px Fraunces',
        '300 40px Manrope', '500 40px Manrope', '600 40px Manrope'
      ];
      fontsPromise = Promise.allSettled(faces.map(f => document.fonts.load(f)))
        .then(() => document.fonts.ready)
        .catch(() => {});
    }
    return fontsPromise;
  }

  /* -------- geometry --------
     Vertical space is budgeted so nothing overlaps:
       moon photo block  = photo circle + orbit rings + hand caption
       text card         = placed fully BELOW the photo block (portrait/story)
       companion moon    = centered in the clearance above the photo
     iw/ih keep their old meaning: the VISIBLE square side of the crop,
     which is what clampView/photoGeometry use for pan/zoom math. */
  function layoutFor(W, H, layout) {
    const min = Math.min(W, H);
    const landscape = layout === 'landscape';
    const story = layout === 'story';
    /* photo sized so circle + rings fit between the top clearance and the card:
       portrait: cy - 1.32r >= H*.10 (room for the companion moon above)
                 and cy + captionDy < cardTop */
    const photo = landscape
      ? { cx: W * .29, cy: H * .52, r: H * .27 }
      : story
        ? { cx: W * .50, cy: H * .315, r: W * .245 }
        : { cx: W * .50, cy: H * .345, r: W * .235 };
    const captionDy = photo.r * 1.58;              // hand caption baseline below center
    const text = landscape
      ? { cx: W * .735, cy: H * .52, cw: W * .35, ch: H * .56 }
      : story
        ? { cx: W * .50, cy: H * .825, cw: W * .82, ch: H * .185 }
        : { cx: W * .50, cy: H * .835, cw: W * .82, ch: H * .155 };
    /* companion moon placement per layout:
         story    — centered in the tall clearance band above the photo
         portrait — top-right quadrant, clear of both the rings and
                    the corner text (4:5 is too short above the photo)
         landscape — above the text card */
    const ringTop = photo.cy - photo.r * 1.32;
    const moon = landscape
      ? { x: text.cx, y: H * .16, r: min * .042 }
      : story
        ? { x: W * .50, y: Math.max(H * .075, ringTop * .52), r: min * .042 }
        : { x: W * .815, y: H * .14, r: min * .045 };
    photo.iw = photo.ih = photo.r * 2;
    return { photo, text, moon, min, captionDy };
  }

  /* -------- pan/zoom math (unchanged semantics) -------- */
  function photoGeometry(img, presetKey) {
    const p = PRESETS[presetKey] || PRESETS['4x5'];
    const { photo } = layoutFor(p.w, p.h, p.layout);
    const s0 = Math.max(photo.iw / img.width, photo.ih / img.height);
    return { s0, photo };
  }

  function clampView(img, presetKey, view) {
    view.scale = Math.min(4, Math.max(1, view.scale || 1));
    const { s0, photo } = photoGeometry(img, presetKey);
    const s = s0 * view.scale;
    const sw = photo.iw / s, sh = photo.ih / s;
    const maxX = Math.max(0, (img.width - sw) / 2);
    const maxY = Math.max(0, (img.height - sh) / 2);
    view.offsetX = Math.min(maxX, Math.max(-maxX, view.offsetX || 0));
    view.offsetY = Math.min(maxY, Math.max(-maxY, view.offsetY || 0));
    return view;
  }

  /* -------- deterministic starfield (same stars every render) -------- */
  function stars(count, seed) {
    let s = seed;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: count }, () => ({
      x: rand(), y: rand(), r: rand() * 1.6 + .5, a: rand() * .55 + .2,
      gold: rand() < .1
    }));
  }

  /* -------- drawing -------- */
  function renderComposite(canvas, img, presetKey, view) {
    const p = PRESETS[presetKey] || PRESETS['4x5'];
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const L = layoutFor(W, H, p.layout);
    ctx.clearRect(0, 0, W, H);

    drawBackdrop(ctx, W, H, L);
    drawMoonPhoto(ctx, img, L, view || { scale: 1, offsetX: 0, offsetY: 0 });
    drawTextCard(ctx, L.text, p.layout, L.min);

    /* corner whispers — kept clear of the moon and the frame */
    ctx.fillStyle = PAL.inkFaint;
    ctx.font = `${Math.round(L.min * .032)}px ${FONT_HAND}`;
    ctx.textAlign = 'left';
    ctx.fillText(COPY.cornerTop, W * .055, H * .078);
    ctx.textAlign = 'right';
    ctx.fillText(COPY.cornerBottom, W * .945, H * .93);

    /* thin constellation frame */
    ctx.strokeStyle = 'rgba(168,199,250,.22)';
    ctx.lineWidth = Math.max(1.5, L.min * .0022);
    ctx.setLineDash([L.min * .012, L.min * .014]);
    roundRect(ctx, W * .03, H * .04, W * .94, H * .90, L.min * .03);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawBackdrop(ctx, W, H, L) {
    const { min, moon, photo } = L;
    const layout = photo.cx < W * .4 ? 'landscape' : 'portrait';
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, PAL.bg0);
    grad.addColorStop(.5, PAL.bg1);
    grad.addColorStop(1, PAL.bg0);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* aurora washes */
    const glows = layout === 'landscape'
      ? [[.28, .5, .5, PAL.blue, .10], [.78, .2, .4, PAL.violet, .08], [.7, .9, .45, PAL.gold, .05]]
      : [[.5, .3, .55, PAL.blue, .12], [.15, .7, .4, PAL.violet, .08], [.85, .85, .4, PAL.gold, .05]];
    for (const [x, y, r, col, a] of glows) {
      const g = ctx.createRadialGradient(W * x, H * y, 0, W * x, H * y, min * r);
      g.addColorStop(0, hexA(col, a));
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    /* little companion moon, parked in its own clearance */
    const mx = moon.x, my = moon.y, mr = moon.r;
    const mg = ctx.createRadialGradient(mx - mr * .35, my - mr * .3, mr * .1, mx, my, mr);
    mg.addColorStop(0, '#E8F0FF');
    mg.addColorStop(.6, '#B9CCEE');
    mg.addColorStop(1, '#8FA8D8');
    ctx.save();
    ctx.shadowColor = 'rgba(180,205,255,.55)';
    ctx.shadowBlur = mr * .9;
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(90,110,150,.3)';   // craters
    [[-.25, -.15, .22], [.18, .25, .16], [0, .45, .11]].forEach(([dx, dy, dr]) => {
      ctx.beginPath(); ctx.arc(mx + mr * dx, my + mr * dy, mr * dr, 0, Math.PI * 2); ctx.fill();
    });

    /* stars */
    for (const s of stars(140, 20260830)) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = s.gold ? PAL.gold : PAL.blueSoft;
      ctx.beginPath(); ctx.arc(W * s.x, H * s.y, s.r * (min / 900), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* circular "moon" photo with orbit rings + gold satellite */
  function drawMoonPhoto(ctx, img, L, view) {
    const { cx, cy, r } = L.photo;

    /* halo */
    const halo = ctx.createRadialGradient(cx, cy, r * .6, cx, cy, r * 1.65);
    halo.addColorStop(0, 'rgba(109,155,245,.22)');
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.65, 0, Math.PI * 2); ctx.fill();

    /* orbit rings */
    ctx.strokeStyle = PAL.ring;
    ctx.lineWidth = Math.max(1.5, r * .012);
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(168,199,250,.18)';
    ctx.setLineDash([r * .05, r * .07]);
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.32, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    /* gold satellite parked on the inner ring */
    const satA = -Math.PI * .32;
    const sx = cx + Math.cos(satA) * r * 1.18, sy = cy + Math.sin(satA) * r * 1.18;
    ctx.save();
    ctx.shadowColor = PAL.gold;
    ctx.shadowBlur = r * .09;
    ctx.fillStyle = PAL.gold;
    ctx.beginPath(); ctx.arc(sx, sy, r * .045, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* the photo, clipped to a circle, pan/zoom honored */
    const iw = img.width, ih = img.height;
    const side = L.photo.iw;                   // visible square side
    const s0 = Math.max(side / iw, side / ih);
    const s = s0 * Math.min(4, Math.max(1, (view && view.scale) || 1));
    const sw = side / s, sh = side / s;
    let ox = (iw - sw) / 2 + ((view && view.offsetX) || 0);
    let oy = (ih - sh) / 2 + ((view && view.offsetY) || 0);
    ox = Math.min(iw - sw, Math.max(0, ox));
    oy = Math.min(ih - sh, Math.max(0, oy));

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img, ox, oy, sw, sh, cx - r, cy - r, r * 2, r * 2);
    /* cool blue glaze so the photo sits in the midnight palette */
    const glaze = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    glaze.addColorStop(0, 'rgba(109,155,245,.10)');
    glaze.addColorStop(1, 'rgba(11,16,38,.16)');
    ctx.fillStyle = glaze;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    /* bright rim */
    ctx.strokeStyle = 'rgba(200,220,255,.55)';
    ctx.lineWidth = Math.max(2, r * .016);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    /* hand caption under the moon — positioned by the layout budget
       so the text card always starts below it */
    ctx.fillStyle = PAL.gold;
    ctx.font = `${Math.round(r * .15)}px ${FONT_HAND}`;
    ctx.textAlign = 'center';
    ctx.fillText(COPY.caption, cx, cy + L.captionDy);
  }

  function drawTextCard(ctx, cfg, layout, min) {
    ctx.save();
    ctx.translate(cfg.cx, cfg.cy);

    /* glass card */
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = cfg.cw * .05;
    ctx.shadowOffsetY = cfg.ch * .03;
    ctx.fillStyle = 'rgba(148,178,235,.08)';
    roundRect(ctx, -cfg.cw / 2, -cfg.ch / 2, cfg.cw, cfg.ch, cfg.cw * .06);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(168,199,250,.28)';
    ctx.lineWidth = Math.max(1.5, cfg.cw * .004);
    roundRect(ctx, -cfg.cw / 2, -cfg.ch / 2, cfg.cw, cfg.ch, cfg.cw * .06);
    ctx.stroke();

    /* type scale derives from the card height so short cards never crush lines */
    const unit = Math.min(cfg.cw, cfg.ch * (layout === 'landscape' ? 1.45 : 2.35));
    ctx.textAlign = 'center';

    ctx.fillStyle = PAL.gold;
    ctx.font = `${Math.round(unit * .075)}px ${FONT_HAND}`;
    ctx.fillText(COPY.album, 0, -cfg.ch * .315);

    ctx.fillStyle = PAL.ink;
    ctx.font = `300 ${Math.round(unit * .115)}px ${FONT_DISPLAY}`;
    ctx.fillText(COPY.big1, 0, -cfg.ch * .10);
    ctx.font = `italic 300 ${Math.round(unit * .095)}px ${FONT_DISPLAY}`;
    ctx.fillStyle = PAL.blueSoft;
    ctx.fillText(COPY.big2, 0, cfg.ch * .05);

    ctx.fillStyle = PAL.inkSoft;
    ctx.font = `300 ${Math.round(unit * .043)}px ${FONT_BODY}`;
    ctx.fillText(COPY.sub, 0, cfg.ch * .20);

    /* gold rule + tail line */
    ctx.strokeStyle = 'rgba(227,184,120,.5)';
    ctx.lineWidth = Math.max(1, unit * .007);
    ctx.beginPath();
    ctx.moveTo(-unit * .3, cfg.ch * .26);
    ctx.lineTo(unit * .3, cfg.ch * .26);
    ctx.stroke();

    ctx.fillStyle = PAL.inkFaint;
    ctx.font = `${Math.round(unit * .056)}px ${FONT_HAND}`;
    ctx.fillText(COPY.tail, 0, cfg.ch * .345);

    /* tiny star on the card corner */
    ctx.fillStyle = PAL.gold;
    const sx = cfg.cw * .44, sy = -cfg.ch * .38, sr = unit * .02;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* -------- full-res export → PNG download -------- */
  async function exportPNG(img, presetKey, view) {
    await ensureFonts();
    const p = PRESETS[presetKey] || PRESETS['4x5'];
    const canvas = document.createElement('canvas');
    canvas.width = p.w;
    canvas.height = p.h;
    renderComposite(canvas, img, presetKey, view);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `year-two-${p.name}.png`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  window.ExportEngine = { PRESETS, COPY, ensureFonts, renderComposite, exportPNG, clampView, photoGeometry };
})();
