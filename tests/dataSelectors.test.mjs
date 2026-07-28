import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSiteSummaries,
  determineRisk,
  getHistoryForSite,
  getLatestMeasurement
} from '../src/utils/dataSelectors.js';

const measurement = {
  measurement_id: 'site_2026-07-20',
  site_id: 'site',
  sample_date: '2026-07-20',
  official_class: 'excellent'
};

const freshWeather = {
  site_id: 'site',
  calculated_at: '2026-07-27T08:00:00+02:00',
  rain_24h_mm: 0,
  rain_48h_mm: 0,
  rain_72h_mm: 0,
  wind_speed: 8,
  wind_direction: 'NW',
  storm_flag: false,
  local_incident_flag: false
};

const now = new Date('2026-07-27T10:00:00+02:00');

test('historie používá jako kotvu nejnovější měření, ne systémové datum', () => {
  const history = getHistoryForSite([
    measurement,
    { ...measurement, measurement_id: 'old', sample_date: '2026-05-20' },
    { ...measurement, measurement_id: 'inside', sample_date: '2026-05-22' }
  ], 'site', 60);

  assert.deepEqual(history.map((item) => item.measurement_id), [
    'site_2026-07-20',
    'inside'
  ]);
});

test('nejnovější měření nezmizí jen proto, že je starší než jeden rok', () => {
  const latest = getLatestMeasurement([
    { ...measurement, sample_date: '2020-01-01' }
  ], 'site');

  assert.equal(latest.sample_date, '2020-01-01');
});

test('chybějící počasí dává neznámý kontext, ale zachová stáří vzorku', () => {
  const result = determineRisk(measurement, null, now);
  assert.equal(result.contextual_risk, 'unknown');
  assert.equal(result.sampleAgeDays, 7);
});

test('expirované počasí se nepoužije jako aktuální riziko', () => {
  const result = determineRisk(measurement, {
    ...freshWeather,
    calculated_at: '2026-07-25T08:00:00+02:00',
    rain_72h_mm: 100
  }, now);

  assert.equal(result.contextual_risk, 'unknown');
  assert.match(result.reasons[0], /starý/);
});

test('silné srážky nastaví vysoké kontextové riziko', () => {
  const result = determineRisk(measurement, {
    ...freshWeather,
    rain_72h_mm: 60
  }, now);

  assert.equal(result.contextual_risk, 'high');
  assert.match(result.explanation, /staré 7 dní/);
});

test('špatná oficiální třída sama nemění oddělené kontextové riziko', () => {
  const result = determineRisk({
    ...measurement,
    official_class: 'poor'
  }, freshWeather, now);

  assert.equal(result.contextual_risk, 'low');
  assert.equal(result.reasons.some((reason) => reason.includes('Špatná')), false);
});

test('souhrn lokality obsahuje stáří počasí i měření', () => {
  const summaries = buildSiteSummaries([
    { site_id: 'site', name: 'Test', lat: 42.4, lon: 18.7 }
  ], [measurement], [freshWeather], now);

  assert.equal(summaries[0].latest_sample_age_days, 7);
  assert.equal(summaries[0].weather_age_hours, 2);
});
