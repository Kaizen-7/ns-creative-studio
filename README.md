# NS Creative Studio

[![Deploy to GitHub Pages](https://github.com/Kaizen-7/ns-creative-studio/actions/workflows/pages.yml/badge.svg)](https://github.com/Kaizen-7/ns-creative-studio/actions/workflows/pages.yml)
[![Open the app](https://img.shields.io/badge/%E2%86%97%20open%20the%20app-kaizen--7.github.io-B0854A?style=flat)](https://kaizen-7.github.io/ns-creative-studio/)
[![Latest release](https://img.shields.io/github/v/release/Kaizen-7/ns-creative-studio?color=3E2E21&label=release)](https://github.com/Kaizen-7/ns-creative-studio/releases)

![Vanilla](https://img.shields.io/badge/vanilla-HTML%20%C2%B7%20CSS%20%C2%B7%20JS-9E8871)
![No dependencies](https://img.shields.io/badge/dependencies-zero-C8A573)

> A little side project built with love 💛 for my girlfriend, to help her create
> Instagram content for her lash & nails studio without fighting design tools.

An installable PWA that generates on-brand Instagram creatives (nude palette) for
**[@ns.lashandnails](https://instagram.com/ns.lashandnails)**. Fill a form, see the
live preview on a 2D canvas, download the PNG (or share it straight to Photos on iOS).

Fully self-contained: single `index.html`, 2D canvas rendering, Mont fonts embedded
as base64, no build step, no npm, no external requests.

## Templates

The generator ships six creative types (the toggle at the top of the panel):

| Template       | What it makes |
|----------------|---------------|
| **Offerta**    | Promo/offer with eyebrow, title, struck-through price and CTA |
| **Listino**    | Single service + price + description (story format) |
| **Prima/Dopo** | Two stacked 16:9 before/after photos — drag to reframe, slider to zoom |
| **Risultato**  | One wide 16:9 result photo — drag to reframe, slider to zoom |
| **New Post**   | Repeated italic "new post" texture + corner-mark frame to tease a post |
| **Copertine**  | 1080×1080 highlight covers — one centered icon (26 to choose from) |

Two output formats where it makes sense: **Feed 1080×1350** and **Story 1080×1920**.

## Structure

```
index.html            # the whole app: <style> + HTML UI + <script> with all logic
manifest.webmanifest  # NS Creative Studio, standalone, portrait, cream theme
sw.js                 # cache-first service worker with versioning
icons/                # icon.svg source + 180/192/512 PNGs
.github/workflows/    # GitHub Pages deploy on every push to main
```

## Local development

```bash
python3 -m http.server 8765
# → http://localhost:8765
```

Quick JS syntax check (compiles the inline `<script>` block):

```bash
node -e "const fs=require('fs');const m=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/);require('vm').compileFunction(m[1]);console.log('JS OK')"
```

## Install on iPhone

1. Open the app in **Safari** (must be Safari).
2. Tap **Share** → **Add to Home Screen**.
3. It now lives on the home screen, opens full-screen, and works offline.

## Deploy

Every push to `main` triggers the `Deploy to GitHub Pages` workflow, which
publishes the repo root to https://kaizen-7.github.io/ns-creative-studio/.

## Updates

When shipping a new version, **bump `CACHE` in `sw.js`**
(e.g. `ns-studio-v3` → `ns-studio-v4`) and push. The installed PWA fetches
the new service worker on the next launch and serves the new version from
the second launch onwards.

## Regenerating the icons

```bash
cd icons
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
rsvg-convert -w 180 -h 180 icon.svg -o apple-touch-icon.png
```

---

<p align="center"><sub>Made with 💛 · nude palette · Montserrat · zero dependencies</sub></p>

