# Project plan

## MVP objective

Create a simple map-based Progressive Web App that displays the latest official sea water quality status for monitored bathing locations in Boka Kotorska and nearby coastal areas.

## Phase 1: Mock UI skeleton

Status: implemented in this package.

Tasks:

1. Create React/Vite project skeleton.
2. Add Leaflet map.
3. Create mock JSON data for 10-20 bathing locations.
4. Show color-coded markers by latest official classification.
5. Add responsive mobile layout.
6. Add basic location popup and detail panel.
7. Add PWA manifest, icons and service worker.

## Phase 2: Official source discovery

Do not implement scraping before this phase is completed.

Tasks:

1. Open the JP Morsko dobro monitoring application in a browser.
2. Use DevTools Network to inspect XHR/fetch requests.
3. Test filters for season, municipality and bathing site.
4. Determine whether the app exposes JSON endpoints.
5. Save representative raw payloads for Kotor, Tivat and Herceg Novi.
6. Document field names and classification values.

Expected output:

- `docs/MORSKO_DOBRO_API_SPIKE.md`
- one or more raw sample payload files under `raw/morsko_dobro/`

## Phase 3: Real official data importer

Tasks:

1. Create a small Python importer.
2. Normalize official fields into:
   - `bathing_sites.json`
   - `measurements.json`
3. Preserve raw source URL and raw payload hash.
4. Add validation for required fields.
5. Add clear warnings for missing coordinates or old samples.

## Phase 4: Geometry import

Tasks:

1. Test PORTODIMARE / GeoNode WMS/WFS/GeoJSON access.
2. Export geometry for bathing-water sites.
3. Match geometry to official source names.
4. Keep manual overrides for key watch points such as Muo and Prčanj.

## Phase 5: Weather context

Tasks:

1. Use Open-Meteo for rainfall and wind by site coordinate.
2. Calculate 24h, 48h and 72h rainfall.
3. Add wind speed and direction.
4. Generate conservative explanations.
5. Keep official quality and contextual risk visually separate.

## Phase 6: Optional extensions

- Local incident watcher for Radio Kotor, Radio Tivat, Boka News, Vijesti and municipal/water utility websites.
- Copernicus/Sentinel turbidity and chlorophyll layer.
- SQLite storage.
- Capacitor native iOS package.
