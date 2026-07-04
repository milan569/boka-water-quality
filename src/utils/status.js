export const OFFICIAL_STATUS = {
  excellent: {
    label: 'Excellent',
    localLabel: 'Odličan',
    color: '#119955',
    rank: 1
  },
  good: {
    label: 'Good',
    localLabel: 'Dobar',
    color: '#83c653',
    rank: 2
  },
  satisfactory: {
    label: 'Satisfactory',
    localLabel: 'Zadovoljavajući',
    color: '#f29f05',
    rank: 3
  },
  poor: {
    label: 'Poor',
    localLabel: 'Loš',
    color: '#d64545',
    rank: 4
  },
  unknown: {
    label: 'Unknown',
    localLabel: 'Nepoznato',
    color: '#8c98a4',
    rank: 5
  }
};

export const CONTEXTUAL_RISK = {
  low: { label: 'Low contextual risk', color: '#119955' },
  elevated: { label: 'Elevated contextual risk', color: '#f29f05' },
  high: { label: 'High contextual risk', color: '#d64545' },
  unknown: { label: 'Unknown contextual risk', color: '#8c98a4' }
};

export function getOfficialStatusMeta(status) {
  return OFFICIAL_STATUS[status] ?? OFFICIAL_STATUS.unknown;
}

export function getRiskMeta(risk) {
  return CONTEXTUAL_RISK[risk] ?? CONTEXTUAL_RISK.unknown;
}

export function getFreshnessMeta(ageDays) {
  if (ageDays === null || ageDays === undefined || Number.isNaN(ageDays)) {
    return { label: 'Freshness unknown', opacity: 0.45, level: 'unknown' };
  }
  if (ageDays <= 7) return { label: `${ageDays} days old`, opacity: 0.96, level: 'fresh' };
  if (ageDays <= 14) return { label: `${ageDays} days old`, opacity: 0.72, level: 'moderate' };
  return { label: `${ageDays} days old`, opacity: 0.45, level: 'old' };
}

export function trendLabel(history) {
  if (!history || history.length < 2) return 'Trend unavailable';

  const ranked = history
    .slice(0, 4)
    .map((item) => getOfficialStatusMeta(item.official_class).rank);

  if (ranked.some((rank) => rank >= 4)) return 'Poor result present in recent history';
  if (ranked.slice(0, 2).some((rank) => rank === 3)) return 'Recent satisfactory result needs attention';
  if (ranked[0] > ranked[ranked.length - 1]) return 'Recent trend worsened';
  return 'Recent history stable';
}
