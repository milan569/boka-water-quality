# Data model

The MVP uses static JSON files. A database can be added later if needed.

## `bathing_sites.json`

Represents a monitored bathing location.

Fields:

- `site_id`: stable internal identifier.
- `name`: display name.
- `municipality`: municipality, for example Kotor, Tivat, Herceg Novi or Budva.
- `area`: local area or settlement.
- `lat`: latitude.
- `lon`: longitude.
- `source_ids`: optional external identifiers.
- `active`: whether the site is active in the MVP.

Future fields:

- `geometry`: optional point, polygon or GeoJSON geometry.
- `geometry_source`: Morsko dobro, PORTODIMARE, manual override, etc.
- `official_site_name`: exact original name from the official source.

## `measurements.json`

Represents an official or mock official measurement.

Fields:

- `measurement_id`: stable internal identifier.
- `site_id`: link to bathing site.
- `sample_date`: date of sampling.
- `published_at`: date when the result was published or imported.
- `official_class`: one of `excellent`, `good`, `satisfactory`, `poor`, `unknown`.
- `ecoli`: E. coli value, if available.
- `enterococci`: intestinal enterococci value, if available.
- `sea_temperature`: sea temperature in Celsius, if available.
- `air_temperature`: air temperature in Celsius, if available.
- `salinity`: salinity, if available.
- `ph`: pH, if available.
- `notes`: free text notes.
- `source_url`: URL to the source.
- `raw_source`: `mock`, `morsko_dobro`, etc.

## `weather_context.json`

Represents contextual weather/risk data for a site.

Fields:

- `site_id`: link to bathing site.
- `calculated_at`: datetime of context calculation.
- `rain_24h_mm`: rainfall over 24 hours.
- `rain_48h_mm`: rainfall over 48 hours.
- `rain_72h_mm`: rainfall over 72 hours.
- `wind_speed`: wind speed in km/h.
- `wind_direction`: cardinal wind direction.
- `storm_flag`: boolean storm/heavy-rain indicator.
- `wave_height_optional`: wave height if available.
- `local_incident_flag`: temporary mock flag for future incident monitoring.
- `source`: source name.

## Contextual risk

Risk is calculated in the frontend for the mock MVP using thresholds from `src/config/riskThresholds.js`.

Initial provisional rules:

- Sample older than 14 days increases uncertainty.
- Rainfall above 20 mm in 24h sets elevated contextual risk.
- Rainfall above 50 mm in 72h sets high contextual risk.
- Local pollution/sewage incident flag sets high contextual risk.
- Official poor status remains poor official status regardless of weather.

Contextual risk must remain separate from official status.
