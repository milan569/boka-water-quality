import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartRef = useRef(null);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);

  const refreshApp = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    window.setTimeout(() => window.location.reload(), 180);
  }, []);

  useEffect(() => {
    const resetPull = () => {
      pullStartRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };
    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      if (event.touches.length !== 1 || window.scrollY > 0 || !touch || touch.clientY > 150) {
        resetPull();
        return;
      }
      pullStartRef.current = touch.clientY;
    };
    const handleTouchMove = (event) => {
      if (pullStartRef.current === null || event.touches.length !== 1) return;
      const distance = Math.min(Math.max((event.touches[0].clientY - pullStartRef.current) * 0.55, 0), 88);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    };
    const handleTouchEnd = () => {
      if (pullDistanceRef.current >= 62) refreshApp();
      else resetPull();
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', resetPull, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', resetPull);
    };
  }, [refreshApp]);

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

  const latestSampleDate = useMemo(() => {
    const [year, month, day] = String(datasetMetadata.measurements_through).split('-');
    return year && month && day ? `${Number(day)}. ${Number(month)}. ${year}` : 'neuvedeno';
  }, []);

  return (
    <main className="app-shell">
      <div
        className={`pull-refresh ${pullDistance > 0 || isRefreshing ? 'is-visible' : ''}`}
        style={{ transform: `translate(-50%, ${Math.max(pullDistance - 46, -46)}px)` }}
        role="status"
        aria-live="polite"
      >
        {isRefreshing ? 'Aktualizuji…' : pullDistance >= 62 ? 'Pusťte pro aktualizaci' : 'Táhněte dolů'}
      </div>
      <header className="topbar">
        <div>
          <p className="eyebrow">Boka Kotorska · MVP</p>
          <h1>Mapa kvality mořské vody</h1>
        </div>
        <div className="topbar-actions">
          <div className="data-note" role="note">
            <strong>
              {datasetMetadata.dataset_type === 'mock'
                ? 'Pouze demonstrační data'
                : datasetMetadata.source_name}
            </strong>
            <span>Nejnovější odběr: {latestSampleDate}</span>
            <span>{datasetMetadata.disclaimer_cs}</span>
          </div>
          <button
            className="refresh-button"
            type="button"
            onClick={refreshApp}
            disabled={isRefreshing}
            title="Načíst nejnovější zveřejněná data"
          >
            <span aria-hidden="true">↻</span>
            {isRefreshing ? 'Aktualizuji…' : 'Aktualizovat'}
          </button>
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
