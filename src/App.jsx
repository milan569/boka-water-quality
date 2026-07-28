import { useMemo, useState } from 'react';
import sites from './data/bathing_sites.json';
import measurements from './data/measurements.json';
import weatherContext from './data/weather_context.json';
import datasetMetadata from './data/dataset_metadata.json';
import WaterMap from './components/WaterMap.jsx';
import SiteDetail from './components/SiteDetail.jsx';
import Legend from './components/Legend.jsx';
import { buildSiteSummaries, getHistoryForSite } from './utils/dataSelectors.js';

export default function App() {
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.site_id ?? null);

  const siteSummaries = useMemo(
    () => buildSiteSummaries(sites, measurements, weatherContext),
    []
  );

  const selectedSite = useMemo(
    () => siteSummaries.find((site) => site.site_id === selectedSiteId) ?? siteSummaries[0],
    [siteSummaries, selectedSiteId]
  );

  const selectedHistory = useMemo(
    () => getHistoryForSite(measurements, selectedSite?.site_id, 60),
    [selectedSite]
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Boka Kotorska · MVP</p>
          <h1>Mapa kvality mořské vody</h1>
        </div>
        <div className="data-note" role="note">
          <strong>
            {datasetMetadata.dataset_type === 'mock'
              ? 'Pouze demonstrační data'
              : datasetMetadata.source_name}
          </strong>
          <span>{datasetMetadata.disclaimer_cs}</span>
        </div>
      </header>

      <section className="layout">
        <div className="map-panel" aria-label="Mapa kvality vody">
          <WaterMap
            sites={siteSummaries}
            selectedSiteId={selectedSite?.site_id}
            onSelectSite={setSelectedSiteId}
          />
          <Legend />
        </div>

        <SiteDetail site={selectedSite} history={selectedHistory} />
      </section>
    </main>
  );
}
