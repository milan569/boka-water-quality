# Data model

The MVP uses static JSON files. A database can be added later if needed.

## `dataset_metadata.json`

Describes the complete published dataset.

Fields:

- `dataset_type`: `mock` or `real`.
- `generated_at`: ISO datetime when the dataset was generated.
- `measurements_through`: latest included sample date.
- `source_name`: user-facing source name.
- `source_url`: canonical source URL, if available.
- `microbiology_units`: units used for microbiological values.
- `disclaimer_cs`: Czech data-status message displayed in the UI.

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
- `imported_at`: ISO datetime of ingestion for real source records.
- `official_class`: one of `excellent`, `good`, `satisfactory`, `poor`, `unknown`.
- `official_class_original`: original source label.
- `official_class_weight`: source class 1–4, if available.
- `ecoli`: E. coli value, if available.
- `ecoli_unit`: unit supplied by the source.
- `enterococci`: intestinal enterococci value, if available.
- `enterococci_unit`: unit supplied by the source.
- `sea_temperature`: sea temperature in Celsius, if available.
- `air_temperature`: air temperature in Celsius, if available.
- `salinity`: salinity, if available.
- `ph`: pH, if available.
- `notes`: free text notes.
- `source_url`: URL to the source.
- `source_site_id`: external monitoring-site identifier.
- `source_measurement_id`: external measurement identifier.
- `raw_source`: `mock`, `morsko_dobro`, etc.

The current Morsko dobro JSON endpoint does not expose numeric `ecoli` or
`enterococci` values. Both fields are therefore `null`; the official class is
copied directly from the source.

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
- `source_url`: attribution link.
- `attribution`: required source/licence credit.
- `weather_reference_time`: local reference time returned by the API.
- `wind_direction_degrees`: original numeric direction before conversion.
- `weather_code`: current WMO weather code.

## Contextual risk

Risk is calculated in the frontend for the mock MVP using thresholds from `src/config/riskThresholds.js`.

Initial provisional rules:

- Sample older than 14 days increases uncertainty.
- Rainfall above 20 mm in 24h sets elevated contextual risk.
- Rainfall above 50 mm in 72h sets high contextual risk.
- Local pollution/sewage incident flag sets high contextual risk.
- Official poor status remains poor official status regardless of weather.

Contextual risk must remain separate from official status.
