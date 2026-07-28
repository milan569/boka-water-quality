# Project plan

## MVP objective

Create a simple map-based Progressive Web App that displays the latest official sea water quality status for monitored bathing locations in Boka Kotorska and nearby coastal areas.

## Phase 1: Mock UI skeleton

Status: completed in commit `570bb77`.

Tasks:

1. Create React/Vite project skeleton.
2. Add Leaflet map.
3. Create mock JSON data for 10-20 bathing locations.
4. Show color-coded markers by latest official classification.
5. Add responsive mobile layout.
6. Add detail panel; the later popup and tooltip were removed.
7. Add PWA manifest, icons and service worker.

## Phase 2: Official source discovery

Status: completed on 2026-07-27.

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

Result:

- public JSON endpoints identified;
- municipality and sampling-round identifiers documented;
- official class, sampling time, temperatures, salinity and WKT geometry verified;
- numeric E. coli and enterococci values are not present in the public JSON payloads;
- automated redistribution licence remains to be clarified.

## Phase 3: Real official data importer

Status: implemented for Kotor, Tivat, Herceg Novi and Budva, season 2026.

Implemented:

1. Node importer `scripts/import-morsko-dobro.mjs`.
2. Normalize official fields into:
   - `bathing_sites.json`
   - `measurements.json`
3. Preserve raw source URL, external IDs and representative raw payloads.
4. Add validation for required fields.
5. Add clear warnings for missing coordinates or old samples.

Next:

- clarify the source licence;
- verify all official site names and centroids manually;
- decide how to present non-official watch points without assigning them an
  official classification.

## Phase 4: Geometry import

Status: Morsko dobro WKT polygons are used to calculate official-site centroids.

Optional next tasks:

1. Test PORTODIMARE / GeoNode WMS/WFS/GeoJSON access.
2. Export geometry for bathing-water sites.
3. Match geometry to official source names.
4. Keep manual overrides for key watch points such as Muo and Prčanj.

## Phase 5: Weather context

Status: implemented with Open-Meteo and a 12-hour expiry.

Implemented:

1. Use Open-Meteo for rainfall and wind by site coordinate.
2. Calculate 24h, 48h and 72h rainfall.
3. Add wind speed and direction.
4. Generate conservative explanations.
5. Keep official quality and contextual risk visually separate.
6. Batch site coordinates into API requests of at most 25 locations.
7. Add CC BY 4.0 attribution and scheduled weather workflow.

## Phase 6: Optional extensions

- Local incident watcher for Radio Kotor, Radio Tivat, Boka News, Vijesti and municipal/water utility websites.
- Copernicus/Sentinel turbidity and chlorophyll layer.
- SQLite storage.
- Capacitor native iOS package.
