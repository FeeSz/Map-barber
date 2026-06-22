'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Branch {
  id: number;
  name: string;
  distance: string;
  status: string;
  occupancy: number;
  coordinates: [number, number];
}

const BRANCHES: Branch[] = [
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

export default function Map3D() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapRef.current) return;

    let destroyed = false;

    async function initMap() {
      try {
        const maplibregl = await import('maplibre-gl');

        if (destroyed) return;

        const map = new maplibregl.Map({
          container,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [-46.6333, -23.5505],
          zoom: 11,
          pitch: 60,
          bearing: -20,
          attributionControl: false,
          failIfMajorPerformanceCaveat: false,
        });

        map.addControl(
          new maplibregl.NavigationControl(),
          'top-right'
        );

        map.on('load', () => {
          BRANCHES.forEach((branch) => {
            const markerElement = document.createElement('div');

            markerElement.className = 'premium-marker';
            markerElement.style.cursor = 'pointer';

            markerElement.innerHTML = `
              <div class="pulse-glow"></div>
              <div class="marker-logo-container">
                <div style="
                  width:100%;
                  height:100%;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:24px;
                ">
                  💈
                </div>
              </div>
            `;

            markerElement.addEventListener('click', () => {
              setSelectedBranch(branch.id);

              map.flyTo({
                center: branch.coordinates,
                zoom: 17,
                pitch: 60,
                bearing: -20,
                speed: 0.8,
                curve: 1.4,
                essential: true,
              });
            });

            new maplibregl.Marker({
              element: markerElement,
              anchor: 'bottom',
            })
              .setLngLat(branch.coordinates)
              .addTo(map);
          });
        });

        map.on('error', (event: any) => {
          console.error('[MapLibre Error]', event);
        });

        mapRef.current = map;
      } catch (error) {
        console.error('Erro ao carregar MapLibre:', error);
      }
    }

    initMap();

    return () => {
      destroyed = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const filteredBranches = BRANCHES.filter((branch) =>
    branch.name.toLowerCase().includes(search.toLowerCase())
  );

  const focusBranch = (branch: Branch) => {
    setSelectedBranch(branch.id);

    mapRef.current?.flyTo({
      center: branch.coordinates,
      zoom: 17,
      pitch: 60,
      bearing: -20,
      speed: 0.8,
      curve: 1.4,
      essential: true,
    });
  };

  return (
    <>
      <div className="floating-search">
        <input
          type="text"
          placeholder="Buscar unidade ou bairro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <aside className="map-sidebar">
        <div className="sidebar-header">
          <h1 className="map-title">💈 BarberMap</h1>

          <p className="map-subtitle">
            Encontre sua unidade ideal
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">
                {BRANCHES.length}
              </div>

              <div className="stat-label">
                Unidades
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-value">
                {
                  BRANCHES.filter(
                    (b) => b.status === 'Aberta'
                  ).length
                }
              </div>

              <div className="stat-label">
                Abertas
              </div>
            </div>
          </div>

          <input
            className="search-input"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="branch-list">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className={`branch-card ${
                selectedBranch === branch.id
                  ? 'active'
                  : ''
              }`}
              onClick={() => focusBranch(branch)}
            >
              <div className="branch-header">
                <div className="branch-name">
                  {branch.name}
                </div>

                <div className="branch-rating-badge">
                  {branch.occupancy}%
                </div>
              </div>

              <div className="branch-meta-row">
                <div className="branch-distance">
                  {branch.distance}
                </div>

                <div className="branch-live-occupancy">
                  <span
                    className={`occupancy-dot ${
                      branch.occupancy > 85
                        ? 'busy'
                        : ''
                    }`}
                  />

                  <span>
                    {branch.status}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredBranches.length === 0 && (
            <div className="branch-card">
              <div className="branch-name">
                Nenhuma unidade encontrada
              </div>
            </div>
          )}
        </div>
      </aside>

      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-screen h-screen"
      />
    </>
  );
}