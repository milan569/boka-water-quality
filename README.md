# Boka Water Quality MVP

Lightweight React/Vite + Leaflet MVP for a map-based sea water quality utility focused on Boka Kotorska and nearby coastal areas in Montenegro.

This first version uses **mock data only**. It does not scrape or import real JP Morsko dobro data yet.

## What is included

- Responsive map for desktop and iPhone-sized screens.
- 16 mock bathing locations around Kotor, Muo, Prčanj, Stoliv, Dobrota, Perast, Risan, Tivat, Donja Lastva, Porto Montenegro, Luštica, Herceg Novi, Meljine, Igalo and Budva.
- Color-coded official water quality status:
  - Excellent / Odličan
  - Good / Dobar
  - Satisfactory / Zadovoljavajući
  - Poor / Loš
  - Unknown
- Freshness indication by marker opacity.
- Detail panel with latest mock official measurement.
- Two-month mock history table.
- Conservative contextual explanation based on mock rain, wind, storm and incident flags.
- PWA manifest, icons and a simple service worker.

## Key limitation

Official bathing-water quality must remain the source of truth. Weather, wind, rain, storms, local incidents and future satellite turbidity layers are contextual indicators only. They must not be presented as proof of hygienic water quality.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
npm run preview
```

## Install on iPhone as PWA

1. Deploy the built app to HTTPS hosting.
2. Open it in Safari on iPhone.
3. Tap Share.
4. Choose **Add to Home Screen**.

Local non-HTTPS testing may not fully represent iOS PWA behavior.

## Data files

Mock data lives in:

- `src/data/bathing_sites.json`
- `src/data/measurements.json`
- `src/data/weather_context.json`

Risk thresholds live in:

- `src/config/riskThresholds.js`

## Next implementation steps

1. Validate the UI and mobile layout using mock data.
2. Create a separate technical spike for the JP Morsko dobro monitoring app:
   - open DevTools Network;
   - inspect XHR/fetch calls;
   - identify JSON/API endpoints if available;
   - save one raw payload for Kotor and one for Tivat.
3. Build `scripts/import_morsko_dobro.py` to output normalized JSON matching the current mock data shape.
4. Test PORTODIMARE WFS/GeoJSON geometry import.
5. Add Open-Meteo real weather context.
6. Add local incident monitoring later as a separate optional layer.

## Known limitations of this first version

- Coordinates are approximate demo coordinates, not validated official bathing-site geometries.
- Measurements are fabricated mock values for UI development.
- Map tiles require network access.
- The service worker is intentionally simple and caches responses opportunistically.
- Native iOS packaging via Capacitor is not included yet.
