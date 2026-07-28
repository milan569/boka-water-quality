import { OFFICIAL_STATUS } from '../utils/status.js';

export default function Legend() {
  return (
    <div className="legend" aria-label="Legenda mapy">
      <strong>Stav posledního měření</strong>
      <div className="legend-items">
        {Object.entries(OFFICIAL_STATUS).map(([key, item]) => (
          <span key={key}>
            <i style={{ background: item.color }} aria-hidden="true" /> {item.label}
          </span>
        ))}
      </div>
      <small>Starší měření jsou na mapě světlejší.</small>
    </div>
  );
}
