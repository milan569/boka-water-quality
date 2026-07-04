import { getFreshnessMeta, getOfficialStatusMeta, getRiskMeta, trendLabel } from '../utils/status.js';

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'n/a';
  return `${value}${suffix}`;
}

export default function SiteDetail({ site, history }) {
  if (!site) {
    return <aside className="detail-panel empty">Select a bathing site.</aside>;
  }

  const status = getOfficialStatusMeta(site.latest?.official_class);
  const freshness = getFreshnessMeta(site.latest_sample_age_days);
  const risk = getRiskMeta(site.contextual_risk);
  const trend = trendLabel(history);

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Selected location</p>
          <h2>{site.name}</h2>
          <p className="muted">{site.area} · {site.municipality}</p>
        </div>
        <span className="status-pill" style={{ background: status.color }}>
          {status.label}
        </span>
      </div>

      <div className="cards-grid">
        <article className="metric-card">
          <span>Official sample</span>
          <strong>{site.latest?.sample_date ?? 'Unknown'}</strong>
          <small>{freshness.label}</small>
        </article>
        <article className="metric-card">
          <span>Context</span>
          <strong>{risk.label}</strong>
          <small>{trend}</small>
        </article>
      </div>

      <section className="detail-section">
        <h3>Latest official measurement</h3>
        <dl className="facts-list">
          <div><dt>E. coli</dt><dd>{formatValue(site.latest?.ecoli, ' CFU/100ml')}</dd></div>
          <div><dt>Intestinal enterococci</dt><dd>{formatValue(site.latest?.enterococci, ' CFU/100ml')}</dd></div>
          <div><dt>Sea temperature</dt><dd>{formatValue(site.latest?.sea_temperature, ' °C')}</dd></div>
          <div><dt>Air temperature</dt><dd>{formatValue(site.latest?.air_temperature, ' °C')}</dd></div>
          <div><dt>Salinity</dt><dd>{formatValue(site.latest?.salinity, ' PSU')}</dd></div>
          <div><dt>Source</dt><dd><a href={site.latest?.source_url} target="_blank" rel="noreferrer">Mock source</a></dd></div>
        </dl>
      </section>

      <section className="detail-section explanation-box">
        <h3>Contextual explanation</h3>
        <p>{site.explanation}</p>
        <ul>
          {site.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h3>Two-month history</h3>
        <div className="history-list" role="table" aria-label="Two-month measurement history">
          {history.map((item) => {
            const itemStatus = getOfficialStatusMeta(item.official_class);
            return (
              <div className="history-row" key={item.measurement_id} role="row">
                <span className="dot" style={{ background: itemStatus.color }} aria-hidden="true" />
                <span>{item.sample_date}</span>
                <strong>{itemStatus.label}</strong>
                <small>E. coli {formatValue(item.ecoli)} · Ent. {formatValue(item.enterococci)}</small>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
