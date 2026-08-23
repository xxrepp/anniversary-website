# 365 Days in Blue — Redesign Prototype

**Design direction: "Midnight Constellation"** — a dark, cinematic
vertical-scroll reimagining of the original powder-blue 3D scrapbook.

## What changed vs. the original

| | Original | This prototype |
|---|---|---|
| Metaphor | physical 3D page-flip book | vertical scroll story ("chapters") |
| Palette | morning powder blue, cream paper | midnight navy, glass panels, gold accent |
| Typography | Playfair / Lora / Caveat | Fraunces / Manrope / Ma Shan Zheng |
| Entry | tap-the-present gift box | press-&-hold breathing orb |
| Months | card grid + lightbox | vertical timeline + lightbox |
| Backdrop | animated flower garden | starfield canvas + film grain |
| Chrome | bottom page controls | top progress bar + equalizer music button |

Same heart: identical content (`js/content.js` is shared untouched),
same photo studio flow, same month lightbox data, same localStorage keys
(`anniv.yearTwoFrame`, `anniv.music`).

## Run locally

```bash
cd anniv-redesign
python3 -m http.server 8001
# open http://localhost:8001
```

## Structure

```
index.html     markup + studio dialog + lightbox + gate
css/main.css   the whole design system (single file)
js/content.js  ← SHARED with the original site (edit content here)
js/export.js   Year Two frame compositor (unchanged)
js/studio.js   camera + editor (unchanged — same DOM ids)
js/main.js     section builder + gate + starfield + reveals + lightbox
photos/        your photos
background.mp3 same music
```

## Prototype notes

- The gate is press-&-hold (~0.9s) by design — it makes opening feel
  deliberate. Enter/Space also works for keyboard users.
- The studio dialog HTML keeps the exact ids from the original, so
  `studio.js` / `export.js` needed zero changes.
- Reduced-motion users get a static starfield, instant reveals, and no
  grain animation.
