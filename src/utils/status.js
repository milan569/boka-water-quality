export const OFFICIAL_STATUS = {
  excellent: {
    label: 'Výborná',
    localLabel: 'Odličan',
    color: '#119955',
    rank: 1
  },
  good: {
    label: 'Dobrá',
    localLabel: 'Dobar',
    color: '#83c653',
    rank: 2
  },
  satisfactory: {
    label: 'Vyhovující',
    localLabel: 'Zadovoljavajući',
    color: '#f29f05',
    rank: 3
  },
  poor: {
    label: 'Špatná',
    localLabel: 'Loš',
    color: '#d64545',
    rank: 4
  },
  unknown: {
    label: 'Neznámá',
    localLabel: 'Nepoznato',
    color: '#8c98a4',
    rank: 5
  }
};

export const CONTEXTUAL_RISK = {
  low: { label: 'Nízké kontextové riziko', color: '#119955' },
  elevated: { label: 'Zvýšené kontextové riziko', color: '#f29f05' },
  high: { label: 'Vysoké kontextové riziko', color: '#d64545' },
  unknown: { label: 'Neznámé kontextové riziko', color: '#8c98a4' }
};

export function getOfficialStatusMeta(status) {
  return OFFICIAL_STATUS[status] ?? OFFICIAL_STATUS.unknown;
}

export function getRiskMeta(risk) {
  return CONTEXTUAL_RISK[risk] ?? CONTEXTUAL_RISK.unknown;
}

export function getFreshnessMeta(ageDays) {
  if (ageDays === null || ageDays === undefined || Number.isNaN(ageDays)) {
    return { label: 'Stáří neznámé', opacity: 0.45, level: 'unknown' };
  }
  const dayLabel = ageDays === 0
    ? 'dnes'
    : ageDays === 1
      ? '1 den'
      : ageDays >= 2 && ageDays <= 4
        ? `${ageDays} dny`
        : `${ageDays} dní`;

  if (ageDays <= 7) return { label: dayLabel, opacity: 0.96, level: 'fresh' };
  if (ageDays <= 14) return { label: dayLabel, opacity: 0.72, level: 'moderate' };
  return { label: dayLabel, opacity: 0.45, level: 'old' };
}

export function trendLabel(history) {
  if (!history || history.length < 2) return 'Trend nelze určit';

  const ranked = history
    .slice(0, 4)
    .map((item) => getOfficialStatusMeta(item.official_class).rank);

  if (ranked.some((rank) => rank >= 4)) return 'V nedávné historii je špatný výsledek';
  if (ranked.slice(0, 2).some((rank) => rank === 3)) return 'Nedávný výsledek vyžaduje pozornost';
  if (ranked[0] > ranked[ranked.length - 1]) return 'Poslední výsledky se zhoršily';
  return 'Nedávná historie je stabilní';
}
