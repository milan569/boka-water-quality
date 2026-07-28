import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://monitoring.morskodobro.me';
const MUNICIPALITIES = {
  Bar: 1,
  Budva: 2,
  Tivat: 3,
  Kotor: 4,
  'Herceg Novi': 5,
  Ulcinj: 6
};
const DEFAULT_MUNICIPALITIES = ['Kotor', 'Tivat', 'Herceg Novi', 'Budva'];

export function parseArgs(args) {
  const options = {
    municipalities: [...DEFAULT_MUNICIPALITIES],
    year: new Date().getFullYear(),
    outputDir: path.join(ROOT, 'src', 'data'),
    rawDir: path.join(ROOT, 'raw', 'morsko_dobro'),
    dryRun: false
  };

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--municipality=')) {
      options.municipalities = [arg.split('=').slice(1).join('=').trim()];
    } else if (arg.startsWith('--municipalities=')) {
      options.municipalities = arg
        .split('=')
        .slice(1)
        .join('=')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    }
    else if (arg.startsWith('--year=')) options.year = Number(arg.split('=')[1]);
    else if (arg.startsWith('--output-dir=')) options.outputDir = path.resolve(ROOT, arg.split('=').slice(1).join('='));
    else if (arg.startsWith('--raw-dir=')) options.rawDir = path.resolve(ROOT, arg.split('=').slice(1).join('='));
    else throw new Error(`Neznámý argument: ${arg}`);
  }

  options.municipalities = [...new Set(options.municipalities)];
  if (options.municipalities.length === 0) {
    throw new Error('Musí být vybrána alespoň jedna obec.');
  }
  const unsupported = options.municipalities.filter((name) => !MUNICIPALITIES[name]);
  if (unsupported.length > 0) {
    throw new Error(`Nepodporované obce: ${unsupported.join(', ')}.`);
  }
  if (!Number.isInteger(options.year) || options.year < 2020 || options.year > 2100) {
    throw new Error(`Neplatný rok "${options.year}".`);
  }
  return options;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'boka-water-quality/0.2 (+https://github.com/milan569/boka-water-quality)',
      ...options.headers
    }
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    throw new Error(`Neočekávaný Content-Type "${contentType}": ${url}`);
  }
  return response.json();
}

async function postForm(endpoint, data) {
  return fetchJson(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams(data)
  });
}

function cleanDateParts(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return Number.isNaN(new Date(`${iso}T12:00:00Z`).getTime()) ? null : iso;
}

export function parseMontenegrinDate(value) {
  const parsed = cleanDateParts(value);
  if (!parsed) throw new Error(`Neplatné datum odběru "${value}".`);
  return parsed;
}

export function mapOfficialClass(weight, label = '') {
  const byWeight = {
    1: 'excellent',
    2: 'good',
    3: 'satisfactory',
    4: 'poor'
  };
  if (byWeight[weight]) return byWeight[weight];

  const normalized = String(label).trim().toLowerCase();
  if (normalized === 'excellent') return 'excellent';
  if (normalized === 'good') return 'good';
  if (['okay', 'satisfactory'].includes(normalized)) return 'satisfactory';
  if (['bad', 'poor'].includes(normalized)) return 'poor';
  throw new Error(`Neznámá klasifikace: weight=${weight}, label="${label}".`);
}

function coordinatesFromWkt(wkt) {
  if (typeof wkt !== 'string') throw new Error('Chybí geometrie WKT.');
  const ringMatch = wkt.match(/\(\(([^)]+)\)\)/);
  if (!ringMatch) throw new Error('Nepodporovaný formát geometrie WKT.');
  const coordinates = ringMatch[1].split(',').map((pair) => {
    const [lon, lat] = pair.trim().split(/\s+/).map(Number);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      throw new Error(`Neplatná souřadnice WKT "${pair}".`);
    }
    return [lon, lat];
  });
  if (coordinates.length < 3) throw new Error('Polygon má méně než tři body.');
  return coordinates;
}

export function polygonCentroid(wkt) {
  const points = coordinatesFromWkt(wkt);
  let crossSum = 0;
  let xSum = 0;
  let ySum = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];
    const cross = x1 * y2 - x2 * y1;
    crossSum += cross;
    xSum += (x1 + x2) * cross;
    ySum += (y1 + y2) * cross;
  }

  if (Math.abs(crossSum) < 1e-12) {
    const uniquePoints = points.slice(0, -1);
    return {
      lon: uniquePoints.reduce((sum, point) => sum + point[0], 0) / uniquePoints.length,
      lat: uniquePoints.reduce((sum, point) => sum + point[1], 0) / uniquePoints.length
    };
  }

  return {
    lon: xSum / (3 * crossSum),
    lat: ySum / (3 * crossSum)
  };
}

function normalizeSite(item) {
  const centroid = polygonCentroid(item.geometrija);
  return {
    site_id: `morsko_dobro_${item.id}`,
    name: item.naziv,
    municipality: item.opstina,
    area: item.plaza,
    lat: Number(centroid.lat.toFixed(7)),
    lon: Number(centroid.lon.toFixed(7)),
    source_ids: {
      morsko_dobro: item.id,
      portodimare: null
    },
    official_site_name: item.naziv,
    geometry_source: 'morsko_dobro_polygon_centroid',
    active: true
  };
}

function normalizeMeasurement(item, importedAt) {
  const sampleDate = parseMontenegrinDate(item.datumUzorkovanja || item.vrijemeUzorkovanja);
  return {
    measurement_id: `morsko_dobro_${item.idMjerenja}`,
    site_id: `morsko_dobro_${item.id}`,
    sample_date: sampleDate,
    sample_time_local: item.vrijemeUzorkovanja || null,
    published_at: null,
    imported_at: importedAt,
    official_class: mapOfficialClass(item.tezina, item.ocjena),
    official_class_original: item.ocjena,
    official_class_weight: item.tezina,
    ecoli: null,
    ecoli_unit: '/100 ml',
    enterococci: null,
    enterococci_unit: '/100 ml',
    sea_temperature: item.temperaturaMora ?? null,
    air_temperature: item.temperaturaVazduha ?? null,
    salinity: item.salinitet ?? null,
    ph: null,
    weather_conditions: item.vremenskePrilike || null,
    wind_direction_observed: item.vjetarSmjer || null,
    wind_intensity_observed: item.vjetarIntenzitet || null,
    waves_observed: item.talasi || null,
    rain_day_before_observed: item.kisaDanPrijeUzorkovanja || null,
    rain_sample_day_observed: item.kisaNaDanUzorkovanja || null,
    notes: item.komentar || null,
    source_url: `${BASE_URL}/?lang=en_US`,
    source_site_id: item.id,
    source_measurement_id: item.idMjerenja,
    raw_source: 'morsko_dobro'
  };
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function municipalitySlug(value) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

async function importMunicipalities(options) {
  const calendar = await postForm('/javna/getCalendarData', {
    godina: String(options.year)
  });
  const rounds = Array.isArray(calendar.data) ? calendar.data : [];
  const latestRound = rounds
    .map((item) => ({ ...item, numericId: Number(item.id) }))
    .filter((item) => Number.isInteger(item.numericId) && item.numericId > 0)
    .sort((a, b) => b.numericId - a.numericId)[0];
  if (!latestRound) throw new Error(`Pro sezonu ${options.year} nebylo nalezeno žádné kolo.`);

  const importedAt = new Date().toISOString();
  const sites = [];
  const measurements = [];
  const rawSnapshots = [];
  const breakdown = {};

  for (const municipality of options.municipalities) {
    const mapPayload = await postForm('/javna/crtajMapu', {
      godina: String(options.year),
      rb: String(latestRound.numericId),
      opstina: String(MUNICIPALITIES[municipality]),
      q: ''
    });
    if (!Array.isArray(mapPayload.mjerenja) || mapPayload.mjerenja.length === 0) {
      throw new Error(`Mapový endpoint nevrátil žádná místa pro obec ${municipality}.`);
    }

    const municipalitySites = mapPayload.mjerenja.map(normalizeSite);
    const municipalityMeasurements = [];
    let representativeDetail = null;

    for (const site of municipalitySites) {
      const externalId = site.source_ids.morsko_dobro;
      const detailUrl = new URL('/javna/dajRezultateUzorkovanja', BASE_URL);
      detailUrl.searchParams.set('id', String(externalId));
      detailUrl.searchParams.set('godina', String(options.year));
      const detail = await fetchJson(detailUrl);
      if (!Array.isArray(detail.mjerenja)) {
        throw new Error(`Historie místa ${externalId} nemá pole mjerenja.`);
      }
      for (const item of detail.mjerenja) {
        municipalityMeasurements.push(normalizeMeasurement(item, importedAt));
      }
      if (representativeDetail === null) representativeDetail = detail;
    }

    sites.push(...municipalitySites);
    measurements.push(...municipalityMeasurements);
    rawSnapshots.push({
      municipality,
      mapPayload,
      representativeDetail
    });
    breakdown[municipality] = {
      sites: municipalitySites.length,
      measurements: municipalityMeasurements.length
    };
  }

  const duplicateSiteIds = sites
    .map((site) => site.site_id)
    .filter((siteId, index, all) => all.indexOf(siteId) !== index);
  if (duplicateSiteIds.length > 0) {
    throw new Error(`Duplicitní oficiální lokality: ${[...new Set(duplicateSiteIds)].join(', ')}.`);
  }

  measurements.sort((left, right) =>
    right.sample_date.localeCompare(left.sample_date) ||
    left.site_id.localeCompare(right.site_id)
  );
  const measurementsThrough = measurements
    .map((item) => item.sample_date)
    .sort()
    .at(-1);
  const metadata = {
    dataset_type: 'real',
    generated_at: importedAt,
    measurements_through: measurementsThrough,
    source_name: 'JP Morsko dobro',
    source_url: `${BASE_URL}/`,
    municipalities: options.municipalities,
    season: options.year,
    latest_round: latestRound.numericId,
    microbiology_units: {
      ecoli: '/100 ml',
      enterococci: '/100 ml'
    },
    disclaimer_cs: 'Oficiální klasifikace pochází z JP Morsko dobro. Číselné mikrobiologické hodnoty veřejný JSON zdroj neposkytuje.'
  };

  if (!options.dryRun) {
    await mkdir(options.outputDir, { recursive: true });
    await mkdir(options.rawDir, { recursive: true });
    const writes = [
      writeJson(path.join(options.outputDir, 'bathing_sites.json'), sites),
      writeJson(path.join(options.outputDir, 'measurements.json'), measurements),
      writeJson(path.join(options.outputDir, 'weather_context.json'), []),
      writeJson(path.join(options.outputDir, 'dataset_metadata.json'), metadata)
    ];
    for (const snapshot of rawSnapshots) {
      const slug = municipalitySlug(snapshot.municipality);
      writes.push(
        writeJson(path.join(options.rawDir, `${options.year}-${slug}-latest-map.json`), snapshot.mapPayload),
        writeJson(
          path.join(options.rawDir, `${options.year}-${slug}-representative-history.json`),
          snapshot.representativeDetail
        )
      );
    }
    await Promise.all(writes);
  }

  return {
    municipalities: options.municipalities,
    year: options.year,
    round: latestRound.numericId,
    sites: sites.length,
    measurements: measurements.length,
    measurementsThrough,
    breakdown,
    dryRun: options.dryRun
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await importMunicipalities(options);
  console.log(JSON.stringify(result, null, 2));
}

const isMain = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(`Import selhal: ${error.message}`);
    process.exitCode = 1;
  });
}
