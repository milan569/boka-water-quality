import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OFFICIAL_CLASSES = new Set(['excellent', 'good', 'satisfactory', 'poor', 'unknown']);
const errors = [];
const warnings = [];

async function readJson(name) {
  const filePath = path.join(DATA_DIR, name);
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${name}: nelze načíst platný JSON (${error.message}).`);
    return null;
  }
}

function requireArray(value, name) {
  if (!Array.isArray(value)) {
    errors.push(`${name}: kořenová hodnota musí být pole.`);
    return [];
  }
  return value;
}

function isIsoDate(value) {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime());
}

function isIsoDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function duplicateValues(items, selector) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    const value = selector(item);
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function validateSites(sites) {
  for (const id of duplicateValues(sites, (site) => site.site_id)) {
    errors.push(`bathing_sites.json: duplicitní site_id "${id}".`);
  }

  for (const [index, site] of sites.entries()) {
    const label = `bathing_sites.json[${index}]`;
    if (!site.site_id || typeof site.site_id !== 'string') errors.push(`${label}: chybí site_id.`);
    if (!site.name || typeof site.name !== 'string') errors.push(`${label}: chybí name.`);
    if (!site.municipality || typeof site.municipality !== 'string') errors.push(`${label}: chybí municipality.`);
    if (!Number.isFinite(site.lat) || site.lat < 41.8 || site.lat > 43.0) {
      errors.push(`${label}: latitude je mimo očekávanou oblast Černé Hory.`);
    }
    if (!Number.isFinite(site.lon) || site.lon < 18.4 || site.lon > 20.5) {
      errors.push(`${label}: longitude je mimo očekávanou oblast Černé Hory.`);
    }
    if (typeof site.active !== 'boolean') errors.push(`${label}: active musí být boolean.`);
  }
}

function validateMeasurements(measurements, siteIds, metadata) {
  for (const id of duplicateValues(measurements, (item) => item.measurement_id)) {
    errors.push(`measurements.json: duplicitní measurement_id "${id}".`);
  }

  for (const [index, item] of measurements.entries()) {
    const label = `measurements.json[${index}]`;
    if (!item.measurement_id || typeof item.measurement_id !== 'string') {
      errors.push(`${label}: chybí measurement_id.`);
    }
    if (!siteIds.has(item.site_id)) errors.push(`${label}: neznámé site_id "${item.site_id}".`);
    if (!isIsoDate(item.sample_date)) errors.push(`${label}: neplatné sample_date.`);
    if (item.published_at !== null && item.published_at !== undefined && !isIsoDate(item.published_at)) {
      errors.push(`${label}: neplatné published_at.`);
    }
    if (isIsoDate(item.sample_date) && isIsoDate(item.published_at) && item.published_at < item.sample_date) {
      errors.push(`${label}: published_at je před sample_date.`);
    }
    if (!OFFICIAL_CLASSES.has(item.official_class)) {
      errors.push(`${label}: neznámá official_class "${item.official_class}".`);
    }
    for (const field of ['ecoli', 'enterococci', 'sea_temperature', 'air_temperature', 'salinity', 'ph']) {
      if (item[field] !== null && item[field] !== undefined && !Number.isFinite(item[field])) {
        errors.push(`${label}: ${field} musí být číslo nebo null.`);
      }
    }
    if (!item.raw_source) errors.push(`${label}: chybí raw_source.`);
    if (!item.source_url) warnings.push(`${label}: chybí source_url.`);
    if (item.raw_source !== 'mock' && !isIsoDateTime(item.imported_at)) {
      errors.push(`${label}: reálný záznam musí mít platné imported_at.`);
    }
  }

  const measurementSiteIds = new Set(measurements.map((item) => item.site_id));
  for (const siteId of siteIds) {
    if (!measurementSiteIds.has(siteId)) errors.push(`measurements.json: lokalita "${siteId}" nemá měření.`);
  }

  if (metadata?.dataset_type === 'real') {
    const mockCount = measurements.filter((item) => item.raw_source === 'mock').length;
    if (mockCount > 0) {
      errors.push(`measurements.json: reálný dataset obsahuje ${mockCount} mock záznamů.`);
    }
  }
}

function validateWeather(weather, siteIds) {
  for (const id of duplicateValues(weather, (item) => item.site_id)) {
    errors.push(`weather_context.json: duplicitní site_id "${id}".`);
  }

  for (const [index, item] of weather.entries()) {
    const label = `weather_context.json[${index}]`;
    if (!siteIds.has(item.site_id)) errors.push(`${label}: neznámé site_id "${item.site_id}".`);
    if (!isIsoDateTime(item.calculated_at)) errors.push(`${label}: neplatné calculated_at.`);
    for (const field of ['rain_24h_mm', 'rain_48h_mm', 'rain_72h_mm', 'wind_speed']) {
      if (!Number.isFinite(item[field]) || item[field] < 0) {
        errors.push(`${label}: ${field} musí být nezáporné číslo.`);
      }
    }
    for (const field of ['storm_flag', 'local_incident_flag']) {
      if (typeof item[field] !== 'boolean') errors.push(`${label}: ${field} musí být boolean.`);
    }
    if (!item.source) errors.push(`${label}: chybí source.`);
    if (item.source === 'open_meteo_forecast_api') {
      if (!item.source_url) errors.push(`${label}: Open-Meteo záznam nemá source_url.`);
      if (!item.attribution) errors.push(`${label}: Open-Meteo záznam nemá atribuci.`);
    }
  }

  const weatherSiteIds = new Set(weather.map((item) => item.site_id));
  for (const siteId of siteIds) {
    if (!weatherSiteIds.has(siteId)) warnings.push(`weather_context.json: lokalita "${siteId}" nemá počasí.`);
  }
}

function validateMetadata(metadata, sites, measurements) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    errors.push('dataset_metadata.json: kořenová hodnota musí být objekt.');
    return;
  }
  if (!['mock', 'real'].includes(metadata.dataset_type)) {
    errors.push('dataset_metadata.json: dataset_type musí být "mock" nebo "real".');
  }
  if (!isIsoDateTime(metadata.generated_at)) {
    errors.push('dataset_metadata.json: neplatné generated_at.');
  }
  if (!isIsoDate(metadata.measurements_through)) {
    errors.push('dataset_metadata.json: neplatné measurements_through.');
  }
  if (!metadata.source_name) errors.push('dataset_metadata.json: chybí source_name.');
  if (!metadata.disclaimer_cs) errors.push('dataset_metadata.json: chybí disclaimer_cs.');

  const latestMeasurementDate = measurements
    .map((item) => item.sample_date)
    .filter(isIsoDate)
    .sort()
    .at(-1);
  if (latestMeasurementDate && metadata.measurements_through !== latestMeasurementDate) {
    errors.push(
      `dataset_metadata.json: measurements_through "${metadata.measurements_through}" ` +
      `neodpovídá nejnovějšímu měření "${latestMeasurementDate}".`
    );
  }

  const siteMunicipalities = [...new Set(sites.map((site) => site.municipality))].sort();
  const metadataMunicipalities = Array.isArray(metadata.municipalities)
    ? [...new Set(metadata.municipalities)].sort()
    : [];
  if (JSON.stringify(metadataMunicipalities) !== JSON.stringify(siteMunicipalities)) {
    errors.push(
      'dataset_metadata.json: municipalities neodpovídají obcím v bathing_sites.json.'
    );
  }
}

const sites = requireArray(await readJson('bathing_sites.json'), 'bathing_sites.json');
const measurements = requireArray(await readJson('measurements.json'), 'measurements.json');
const weather = requireArray(await readJson('weather_context.json'), 'weather_context.json');
const metadata = await readJson('dataset_metadata.json');
const siteIds = new Set(sites.map((site) => site.site_id));

validateSites(sites);
validateMetadata(metadata, sites, measurements);
validateMeasurements(measurements, siteIds, metadata);
validateWeather(weather, siteIds);

for (const warning of warnings) console.warn(`VAROVÁNÍ: ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`CHYBA: ${error}`);
  console.error(`Validace selhala: ${errors.length} chyb, ${warnings.length} varování.`);
  process.exitCode = 1;
} else {
  console.log(
    `Data jsou platná: ${sites.length} lokalit, ${measurements.length} měření, ` +
    `${weather.length} záznamů počasí, ${warnings.length} varování.`
  );
}
