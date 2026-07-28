import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const BATCH_SIZE = 25;

function parseArgs(args) {
  const options = {
    dataDir: DATA_DIR,
    dryRun: false
  };
  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--data-dir=')) {
      options.dataDir = path.resolve(ROOT, arg.split('=').slice(1).join('='));
    } else {
      throw new Error(`Neznámý argument: ${arg}`);
    }
  }
  return options;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function offsetSuffix(seconds) {
  const sign = seconds < 0 ? '-' : '+';
  const absolute = Math.abs(seconds);
  const hours = String(Math.floor(absolute / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((absolute % 3600) / 60)).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

function parseLocalApiTime(value, utcOffsetSeconds) {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const parsed = new Date(`${normalized}${offsetSuffix(utcOffsetSeconds)}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function degreesToCardinal(value) {
  if (!Number.isFinite(value)) return 'N/A';
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return labels[Math.round((((value % 360) + 360) % 360) / 45) % 8];
}

export function precipitationSum(times, values, referenceTime, hours, utcOffsetSeconds = 0) {
  const from = referenceTime.getTime() - hours * 3_600_000;
  const total = times.reduce((sum, time, index) => {
    const pointTime = parseLocalApiTime(time, utcOffsetSeconds);
    const value = Number(values[index] ?? 0);
    if (
      pointTime &&
      pointTime.getTime() > from &&
      pointTime.getTime() <= referenceTime.getTime() &&
      Number.isFinite(value)
    ) {
      return sum + value;
    }
    return sum;
  }, 0);
  return Number(total.toFixed(1));
}

function buildRequestUrl(sites) {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set('latitude', sites.map((site) => site.lat).join(','));
  url.searchParams.set('longitude', sites.map((site) => site.lon).join(','));
  url.searchParams.set('hourly', 'precipitation,weather_code');
  url.searchParams.set('current', 'wind_speed_10m,wind_direction_10m,weather_code');
  url.searchParams.set('past_hours', '72');
  url.searchParams.set('forecast_hours', '1');
  url.searchParams.set('timezone', 'Europe/Podgorica');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('precipitation_unit', 'mm');
  return url;
}

export function createBatches(items, size = BATCH_SIZE) {
  if (!Number.isInteger(size) || size < 1) {
    throw new Error('Velikost dávky musí být kladné celé číslo.');
  }
  const batches = [];
  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }
  return batches;
}

async function fetchWeather(sites) {
  const responses = [];
  const requestUrls = [];

  for (const batch of createBatches(sites)) {
    const url = buildRequestUrl(batch);
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'boka-water-quality/0.2 (+https://github.com/milan569/boka-water-quality)'
      }
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: Open-Meteo`);
    }
    const payload = await response.json();
    const batchResponses = Array.isArray(payload) ? payload : [payload];
    if (batchResponses.length !== batch.length) {
      throw new Error(
        `Open-Meteo vrátil ${batchResponses.length} míst, očekáváno ${batch.length}.`
      );
    }
    responses.push(...batchResponses);
    requestUrls.push(url.toString());
  }

  return { responses, requestUrls };
}

function normalizeWeather(site, response, calculatedAt) {
  const hourly = response.hourly;
  const current = response.current;
  if (
    !hourly ||
    !Array.isArray(hourly.time) ||
    !Array.isArray(hourly.precipitation) ||
    !current
  ) {
    throw new Error(`Neúplná odpověď Open-Meteo pro ${site.site_id}.`);
  }

  const utcOffsetSeconds = Number(response.utc_offset_seconds ?? 0);
  const referenceTime = parseLocalApiTime(current.time, utcOffsetSeconds);
  if (!referenceTime) throw new Error(`Neplatný referenční čas pro ${site.site_id}.`);

  const recentCodes = hourly.time
    .map((time, index) => ({
      time: parseLocalApiTime(time, utcOffsetSeconds),
      code: Number(hourly.weather_code?.[index]),
      precipitation: Number(hourly.precipitation[index] ?? 0)
    }))
    .filter((item) =>
      item.time &&
      item.time.getTime() > referenceTime.getTime() - 24 * 3_600_000 &&
      item.time.getTime() <= referenceTime.getTime()
    );
  const stormFlag = recentCodes.some((item) =>
    [95, 96, 99].includes(item.code) || item.precipitation >= 10
  );

  return {
    site_id: site.site_id,
    calculated_at: calculatedAt,
    weather_reference_time: current.time,
    rain_24h_mm: precipitationSum(
      hourly.time,
      hourly.precipitation,
      referenceTime,
      24,
      utcOffsetSeconds
    ),
    rain_48h_mm: precipitationSum(
      hourly.time,
      hourly.precipitation,
      referenceTime,
      48,
      utcOffsetSeconds
    ),
    rain_72h_mm: precipitationSum(
      hourly.time,
      hourly.precipitation,
      referenceTime,
      72,
      utcOffsetSeconds
    ),
    wind_speed: Number(current.wind_speed_10m ?? 0),
    wind_direction: degreesToCardinal(Number(current.wind_direction_10m)),
    wind_direction_degrees: Number(current.wind_direction_10m),
    weather_code: Number(current.weather_code),
    storm_flag: stormFlag,
    wave_height_optional: null,
    local_incident_flag: false,
    source: 'open_meteo_forecast_api',
    source_url: 'https://open-meteo.com/en/docs',
    attribution: 'Weather data by Open-Meteo.com (CC BY 4.0)'
  };
}

async function updateWeather(options) {
  const sitesPath = path.join(options.dataDir, 'bathing_sites.json');
  const outputPath = path.join(options.dataDir, 'weather_context.json');
  const sites = await readJson(sitesPath);
  if (!Array.isArray(sites) || sites.length === 0) {
    throw new Error('Dataset neobsahuje žádné lokality.');
  }
  const { responses, requestUrls } = await fetchWeather(sites);
  const calculatedAt = new Date().toISOString();
  const weather = sites.map((site, index) =>
    normalizeWeather(site, responses[index], calculatedAt)
  );

  if (!options.dryRun) {
    await writeFile(outputPath, `${JSON.stringify(weather, null, 2)}\n`, 'utf8');
  }

  return {
    sites: weather.length,
    calculatedAt,
    dryRun: options.dryRun,
    requests: requestUrls.length,
    rainRange72h: {
      min: Math.min(...weather.map((item) => item.rain_72h_mm)),
      max: Math.max(...weather.map((item) => item.rain_72h_mm))
    }
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await updateWeather(options);
  console.log(JSON.stringify(result, null, 2));
}

const isMain = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(`Aktualizace počasí selhala: ${error.message}`);
    process.exitCode = 1;
  });
}
