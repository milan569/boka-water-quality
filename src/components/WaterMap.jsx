import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { getFreshnessMeta, getOfficialStatusMeta } from '../utils/status.js';

const BOKA_CENTER = [42.456, 18.68];
const BOKA_BOUNDS = [
  [42.24, 18.43],
  [42.56, 18.90]
];

function MapFocus({ site }) {
  const map = useMap();

  useEffect(() => {
    if (!site) return;
    map.flyTo([site.lat, site.lon], Math.max(map.getZoom(), 12), {
      duration: 0.45
    });
  }, [map, site]);

  return null;
}

export default function WaterMap({ sites, selectedSiteId, onSelectSite }) {
  const selectedSite = sites.find((site) => site.site_id === selectedSiteId);

  return (
    <MapContainer
      center={BOKA_CENTER}
      zoom={11}
      minZoom={9}
      maxZoom={16}
      maxBounds={BOKA_BOUNDS}
      scrollWheelZoom
      className="water-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFocus site={selectedSite} />

      {sites.map((site) => {
        const status = getOfficialStatusMeta(site.latest?.official_class);
        const freshness = getFreshnessMeta(site.latest_sample_age_days);
        const isSelected = site.site_id === selectedSiteId;

        return (
          <CircleMarker
            key={site.site_id}
            center={[site.lat, site.lon]}
            radius={isSelected ? 13 : 10}
            pathOptions={{
              color: isSelected ? '#102a43' : '#ffffff',
              weight: isSelected ? 3 : 2,
              fillColor: status.color,
              fillOpacity: freshness.opacity
            }}
            eventHandlers={{
              click: () => onSelectSite(site.site_id)
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <strong>{site.name}</strong>
              <br />
              {status.label} · {freshness.label}
            </Tooltip>
            <Popup>
              <div className="map-popup">
                <strong>{site.name}</strong>
                <span>{site.municipality}</span>
                <span>Status: {status.label}</span>
                <span>Sample: {site.latest?.sample_date ?? 'Unknown'}</span>
                <button type="button" onClick={() => onSelectSite(site.site_id)}>
                  Open detail
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
