import { RISK_THRESHOLDS } from '../config/riskThresholds.js';

function parseDate(value) {
  return value ? new Date(`${value}T12:00:00Z`) : null;
}

function parseDateTime(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(later, earlier) {
  if (!later || !earlier) return null;
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 86_400_000));
}

function hoursBetween(later, earlier) {
  if (!later || !earlier) return null;
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 3_600_000));
}

export function getHistoryForSite(measurements, siteId, windowDays = 60) {
  const datedMeasurements = measurements
    .filter((item) => item.site_id === siteId)
    .map((item) => ({ ...item, _date: parseDate(item.sample_date) }))
    .filter((item) => item._date)
    .sort((a, b) => b._date - a._date);

  const anchorDate = datedMeasurements[0]?._date ?? null;

  return datedMeasurements
    .filter((item) => {
      const age = daysBetween(anchorDate, item._date);
      return age === null || age <= windowDays;
    })
    .map(({ _date, ...item }) => item);
}

export function getLatestMeasurement(measurements, siteId) {
  return measurements
    .filter((item) => item.site_id === siteId)
    .map((item) => ({ ...item, _date: parseDate(item.sample_date) }))
    .filter((item) => item._date)
    .sort((a, b) => b._date - a._date)
    .map(({ _date, ...item }) => item)[0] ?? null;
}

function raiseRisk(current, next) {
  const rank = { low: 1, elevated: 2, high: 3 };
  return rank[next] > rank[current] ? next : current;
}

function czechDayCount(days) {
  if (days === 1) return '1 den';
  if (days >= 2 && days <= 4) return `${days} dny`;
  return `${days} dní`;
}

export function determineRisk(latest, weather, now = new Date()) {
  if (!latest) {
    return {
      contextual_risk: 'unknown',
      reasons: ['Chybí měření kvality vody.'],
      explanation: 'Pro tuto lokalitu není dostupné žádné měření.',
      sampleAgeDays: null,
      weatherAgeHours: null
    };
  }

  const sampleDate = parseDate(latest.sample_date);
  const sampleAgeDays = daysBetween(now, sampleDate);

  if (!weather) {
    return {
      contextual_risk: 'unknown',
      reasons: ['Chybí kontext počasí.'],
      explanation: 'Poslední měření je dostupné, ale bez aktuálního kontextu počasí nelze kontextové riziko vyhodnotit.',
      sampleAgeDays,
      weatherAgeHours: null
    };
  }

  const weatherCalculatedAt = parseDateTime(weather.calculated_at);
  const weatherAgeHours = hoursBetween(now, weatherCalculatedAt);

  if (
    weatherAgeHours === null ||
    weatherAgeHours > RISK_THRESHOLDS.weatherContextMaxAgeHours
  ) {
    const ageText = weatherAgeHours === null
      ? 'nemá platný čas výpočtu'
      : `je starý ${weatherAgeHours} hodin`;
    return {
      contextual_risk: 'unknown',
      reasons: [`Kontext počasí ${ageText}.`],
      explanation: 'Historické počasí se nepoužívá jako aktuální rizikový indikátor. Pro nové vyhodnocení je nutná aktualizace dat.',
      sampleAgeDays,
      weatherAgeHours
    };
  }

  const reasons = [];
  let risk = 'low';

  if (sampleAgeDays > RISK_THRESHOLDS.staleSampleDays) {
    risk = raiseRisk(risk, 'elevated');
    reasons.push(`Poslední měření je starší než ${RISK_THRESHOLDS.staleSampleDays} dní.`);
  }

  if (weather.rain_24h_mm > RISK_THRESHOLDS.elevatedRain24hMm) {
    risk = raiseRisk(risk, 'elevated');
    reasons.push(`Za posledních 24 hodin spadlo ${weather.rain_24h_mm} mm srážek.`);
  }

  if (weather.rain_72h_mm > RISK_THRESHOLDS.highRain72hMm) {
    risk = raiseRisk(risk, 'high');
    reasons.push(`Za posledních 72 hodin spadlo ${weather.rain_72h_mm} mm srážek.`);
  }

  if (weather.storm_flag) {
    risk = raiseRisk(risk, 'elevated');
    reasons.push('Kontext počasí obsahuje příznak bouřky nebo silného deště.');
  }

  if (weather.local_incident_flag) {
    risk = raiseRisk(risk, 'high');
    reasons.push('Zdroj uvádí lokální incident související se znečištěním.');
  }

  if (reasons.length === 0) {
    reasons.push('Aktuální kontext počasí neobsahuje nastavený rizikový příznak.');
  }

  const sampleAgeSentence = sampleAgeDays === 0
    ? 'Poslední měření je ze dneška.'
    : `Poslední měření je staré ${czechDayCount(sampleAgeDays)}.`;
  const explanation = [
    sampleAgeSentence,
    weather.rain_48h_mm > 10
      ? `Za posledních 48 hodin spadlo ${weather.rain_48h_mm} mm srážek; podmínky u pobřeží proto mohou být do dalšího odběru méně předvídatelné.`
      : 'Nedávné srážky nepřekročily nastavený informační práh.',
    `Vítr je veden jako ${weather.wind_direction} o rychlosti ${weather.wind_speed} km/h.`
  ].join(' ');

  return {
    contextual_risk: risk,
    reasons,
    explanation,
    sampleAgeDays,
    weatherAgeHours
  };
}

export function buildSiteSummaries(sites, measurements, weatherContext, now = new Date()) {
  return sites.map((site) => {
    const latest = getLatestMeasurement(measurements, site.site_id);
    const weather = weatherContext.find((item) => item.site_id === site.site_id) ?? null;
    const risk = determineRisk(latest, weather, now);

    return {
      ...site,
      latest,
      weather,
      contextual_risk: risk.contextual_risk,
      reasons: risk.reasons,
      explanation: risk.explanation,
      latest_sample_age_days: risk.sampleAgeDays ?? null,
      weather_age_hours: risk.weatherAgeHours ?? null
    };
  });
}
