# NS Creative Studio

[![Deploy to GitHub Pages](https://github.com/Kaizen-7/ns-creative-studio/actions/workflows/pages.yml/badge.svg)](https://github.com/Kaizen-7/ns-creative-studio/actions/workflows/pages.yml)
[![Live](https://img.shields.io/badge/live-kaizen--7.github.io-B0854A)](https://kaizen-7.github.io/ns-creative-studio/)
[![PWA](https://img.shields.io/badge/PWA-installable-3E2E21)](https://kaizen-7.github.io/ns-creative-studio/)

A little side project built with love for my girlfriend, to help her create
Instagram content for her lash & nails studio without fighting design tools.

Installable PWA that generates Instagram creatives (nude palette) for **@ns.lashandnails**.
Fully self-contained: 2D canvas, Mont fonts embedded as base64, no external dependencies.

## Structure

```
index.html            # the generator (original + PWA tags, mobile fixes, iOS-safe download)
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

## Deploy

Every push to `main` triggers the `Deploy to GitHub Pages` workflow, which
publishes the repo root to https://kaizen-7.github.io/ns-creative-studio/.

## Updates

When shipping a new version, **bump `CACHE` in `sw.js`**
(e.g. `ns-studio-v1` → `ns-studio-v2`) and push. The installed PWA fetches
the new service worker on the next launch and serves the new version from
the second launch onwards.

## Regenerating the icons

```bash
cd icons
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
rsvg-convert -w 180 -h 180 icon.svg -o apple-touch-icon.png
```
