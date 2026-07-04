import { RISK_THRESHOLDS } from '../config/riskThresholds.js';
import { getOfficialStatusMeta } from './status.js';

function parseDate(value) {
  return value ? new Date(`${value}T12:00:00Z`) : null;
}

function daysBetween(later, earlier) {
  if (!later || !earlier) return null;
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 86_400_000));
}

export function getHistoryForSite(measurements, siteId, windowDays = 60) {
  const today = new Date();
  return measurements
    .filter((item) => item.site_id === siteId)
    .map((item) => ({ ...item, _date: parseDate(item.sample_date) }))
    .filter((item) => {
      const age = daysBetween(today, item._date);
      return age === null || age <= windowDays;
    })
    .sort((a, b) => b._date - a._date)
    .map(({ _date, ...item }) => item);
}

export function getLatestMeasurement(measurements, siteId) {
  return getHistoryForSite(measurements, siteId, 365)[0] ?? null;
}

function determineRisk(latest, weather) {
  if (!latest || !weather) {
    return {
      contextual_risk: 'unknown',
      reasons: ['Missing official sample or weather context.'],
      explanation: 'The app does not yet have enough data to evaluate contextual risk for this site.'
    };
  }

  const today = new Date();
  const sampleDate = parseDate(latest.sample_date);
  const sampleAgeDays = daysBetween(today, sampleDate);
  const reasons = [];
  let risk = 'low';

  if (sampleAgeDays > RISK_THRESHOLDS.staleSampleDays) {
    risk = 'elevated';
    reasons.push(`Official sample is older than ${RISK_THRESHOLDS.staleSampleDays} days.`);
  }

  if (weather.rain_24h_mm > RISK_THRESHOLDS.elevatedRain24hMm) {
    risk = 'elevated';
    reasons.push(`Rainfall in the last 24h is ${weather.rain_24h_mm} mm.`);
  }

  if (weather.rain_72h_mm > RISK_THRESHOLDS.highRain72hMm) {
    risk = 'high';
    reasons.push(`Rainfall in the last 72h is ${weather.rain_72h_mm} mm.`);
  }

  if (weather.storm_flag) {
    risk = risk === 'high' ? 'high' : 'elevated';
    reasons.push('Storm or heavy rain flag is present in the mock weather context.');
  }

  if (weather.local_incident_flag) {
    risk = 'high';
    reasons.push('A local pollution or sewage incident flag is present in the mock data.');
  }

  if (latest.official_class === 'poor') {
    reasons.push('Latest official classification is poor.');
  }

  if (reasons.length === 0) {
    reasons.push('Recent official sample and mock weather context do not indicate elevated risk.');
  }

  const officialStatus = getOfficialStatusMeta(latest.official_class).label.toLowerCase();
  const explanation = [
    `The latest official sample is ${sampleAgeDays} days old and classified as ${officialStatus}.`,
    weather.rain_48h_mm > 10
      ? `Rainfall over the last 48 hours was ${weather.rain_48h_mm} mm, so near-shore conditions may be less predictable until the next official sample.`
      : `Recent rainfall in the mock context is limited, so no rainfall-related warning is shown.`,
    `Wind is recorded as ${weather.wind_direction} at ${weather.wind_speed} km/h in the mock context.`
  ].join(' ');

  return {
    contextual_risk: risk,
    reasons,
    explanation,
    sampleAgeDays
  };
}

export function buildSiteSummaries(sites, measurements, weatherContext) {
  return sites.map((site) => {
    const latest = getLatestMeasurement(measurements, site.site_id);
    const weather = weatherContext.find((item) => item.site_id === site.site_id) ?? null;
    const risk = determineRisk(latest, weather);

    return {
      ...site,
      latest,
      weather,
      contextual_risk: risk.contextual_risk,
      reasons: risk.reasons,
      explanation: risk.explanation,
      latest_sample_age_days: risk.sampleAgeDays ?? null
    };
  });
}
