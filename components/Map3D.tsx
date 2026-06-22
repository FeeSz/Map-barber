'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function Map3D() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let destroyed = false;

    async function init() {
      const maplibregl = await import('maplibre-gl');

      if (destroyed) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-46.6333, -23.5505],
        zoom: 11,
        pitch: 60,
        bearing: -20,
      });

      map.addControl(
        new maplibregl.NavigationControl(),
        'top-right'
      );

     const branches = [
  {
    id: 1,
    name: 'Black Diamond Centro',
    distance: '1.2 km',
    status: 'Aberta',
    occupancy: 35,
    coordinates: [-46.6333, -23.5505],
  },

  {
    id: 2,
    name: 'Black Diamond Moema',
    distance: '2.8 km',
    status: 'Aberta',
    occupancy: 70,
    coordinates: [-46.668, -23.601],
  },

  {
    id: 3,
    name: 'Black Diamond Paulista',
    distance: '4.1 km',
    status: 'Lotada',
    occupancy: 95,
    coordinates: [-46.652, -23.561],
  },
];

      branches.forEach((branch) => {
const marker = document.createElement("div");

marker.innerHTML = `
<div class="premium-marker">
  <div class="pulse"></div>
  <div class="icon">💈</div>
</div>
`;

        new maplibregl.Marker({
          element: marker,
        })
          .setLngLat(branch.coordinates as [number, number])
          .addTo(map);
      });

      mapRef.current = map;
    }

    init();

    return () => {
      destroyed = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div className="floating-search">
        <input
          placeholder="Buscar unidade ou bairro..."
        />
      </div>

      <div className="map-sidebar">
        <div className="map-header">
          <div className="map-title">
            💈 BarberMap
          </div>

          <div className="map-subtitle">
            Encontre sua unidade
          </div>

          <input
            className="search-input"
            placeholder="Pesquisar..."
          />
        </div>

        <div className="branch-list">
          <div className="branch-card">
            <div className="branch-name">
              Barbearia Centro
            </div>

            <div className="branch-distance">
              1.2 km
            </div>

            <div className="branch-status">
              Aberta agora
            </div>
          </div>

          <div className="branch-card">
            <div className="branch-name">
              Barbearia Moema
            </div>

            <div className="branch-distance">
              2.8 km
            </div>

            <div className="branch-status">
              Aberta agora
            </div>
          </div>
        </div>
      </div>

      <div
        ref={mapContainer}
        style={{
          width: '100vw',
          height: '100vh',
        }}
      />
    </>
  );
}