import { getFreshnessMeta, getOfficialStatusMeta, getRiskMeta, trendLabel } from '../utils/status.js';

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'neuvedeno';
  return `${value}${suffix}`;
}

function formatDate(value) {
  if (!value) return 'Neznámé datum';
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Podgorica'
  }).format(date);
}

function sourceLabel(measurement) {
  if (!measurement) return 'Zdroj neuveden';
  if (measurement.raw_source === 'mock') return 'Demonstrační zdroj';
  if (measurement.raw_source === 'morsko_dobro') return 'JP Morsko dobro';
  return measurement.source_name || measurement.raw_source || 'Zdroj';
}

export default function SiteDetail({ site, history }) {
  if (!site) {
    return <aside className="detail-panel empty">Vyberte lokalitu na mapě.</aside>;
  }

  const status = getOfficialStatusMeta(site.latest?.official_class);
  const freshness = getFreshnessMeta(site.latest_sample_age_days);
  const risk = getRiskMeta(site.contextual_risk);
  const trend = trendLabel(history);

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Vybraná lokalita</p>
          <h2>{site.name}</h2>
          <p className="muted">{site.area} · {site.municipality}</p>
        </div>
        <span className="status-pill" style={{ background: status.color }}>
          {status.label}
        </span>
      </div>

      <div className="cards-grid">
        <article className="metric-card">
          <span>Poslední měření</span>
          <strong>{formatDate(site.latest?.sample_date)}</strong>
          <small>{freshness.label}</small>
        </article>
        <article className="metric-card">
          <span>Kontext</span>
          <strong>{risk.label}</strong>
          <small>
            {site.weather_age_hours === null
              ? 'Aktuálnost počasí neznámá'
              : site.weather_age_hours === 0
                ? 'Počasí právě aktualizováno'
                : `Počasí aktualizováno před ${site.weather_age_hours} h`}
          </small>
        </article>
      </div>

      <section className="detail-section">
        <h3>Poslední dostupné měření</h3>
        <dl className="facts-list">
          <div><dt>E. coli</dt><dd>{formatValue(site.latest?.ecoli, ` ${site.latest?.ecoli_unit ?? 'CFU/100 ml'}`)}</dd></div>
          <div><dt>Intestinální enterokoky</dt><dd>{formatValue(site.latest?.enterococci, ` ${site.latest?.enterococci_unit ?? 'CFU/100 ml'}`)}</dd></div>
          <div><dt>Teplota moře</dt><dd>{formatValue(site.latest?.sea_temperature, ' °C')}</dd></div>
          <div><dt>Teplota vzduchu</dt><dd>{formatValue(site.latest?.air_temperature, ' °C')}</dd></div>
          <div><dt>Salinita</dt><dd>{formatValue(site.latest?.salinity, ' PSU')}</dd></div>
          <div><dt>pH</dt><dd>{formatValue(site.latest?.ph)}</dd></div>
          <div>
            <dt>Zdroj</dt>
            <dd>
              {site.latest?.source_url
                ? <a href={site.latest.source_url} target="_blank" rel="noreferrer">{sourceLabel(site.latest)}</a>
                : sourceLabel(site.latest)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="detail-section explanation-box">
        <h3>Kontextové vysvětlení</h3>
        <p>{site.explanation}</p>
        <ul>
          {site.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        {site.weather?.source_url && (
          <p className="source-note">
            Počasí: <a href={site.weather.source_url} target="_blank" rel="noreferrer">Open-Meteo</a>
            {' · '}CC BY 4.0
          </p>
        )}
      </section>

      <section className="detail-section">
        <h3>Historie za poslední dva měsíce</h3>
        <p className="section-note">{trend}</p>
        {history.length === 0
          ? <p className="empty-message">V tomto období nejsou dostupná žádná měření.</p>
          : (
            <div className="history-list" role="table" aria-label="Historie měření za dva měsíce">
              {history.map((item) => {
                const itemStatus = getOfficialStatusMeta(item.official_class);
                return (
                  <div className="history-row" key={item.measurement_id} role="row">
                    <span className="dot" style={{ background: itemStatus.color }} aria-hidden="true" />
                    <span>{formatDate(item.sample_date)}</span>
                    <strong>{itemStatus.label}</strong>
                    <small>E. coli {formatValue(item.ecoli)} · Ent. {formatValue(item.enterococci)}</small>
                  </div>
                );
              })}
            </div>
          )}
      </section>
    </aside>
  );
}
