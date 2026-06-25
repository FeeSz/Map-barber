'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { Search, MapPin, Scissors, Users } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

// Componentes do shadcn/ui
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

            // Customização do marcador em CSS injetado
            markerElement.innerHTML = `
              <div class="pulse-glow" style="position: absolute; width: 40px; height: 40px; background: rgba(163,230,53,0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
              <div class="marker-logo-container" style="background: #0f0f0f; border: 2px solid #a3e635; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                💈
              </div>
            `;

            markerElement.addEventListener('click', () => {
              setSelectedBranch(branch.id);
              map.flyTo({
                center: branch.coordinates,
                zoom: 16,
                pitch: 45,
                speed: 1.0,
                essential: true,
              });
            });

            new maplibregl.Marker({
              element: markerElement,
              anchor: 'center',
            })
              .setLngLat(branch.coordinates)
              .addTo(map);
          });
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
      zoom: 16,
      pitch: 45,
      speed: 1.0,
      essential: true,
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Barra de Busca Flutuante para Mobile/Desktop Alternativo */}
      <div className="absolute top-4 left-4 z-50 w-full max-w-xs hidden md:block" onPointerDown={(e) => e.stopPropagation()}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            type="text"
            placeholder="Buscar unidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#0f0f0f]/90 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#a3e635] focus-visible:border-[#a3e635] backdrop-blur-md rounded-xl shadow-xl"
          />
        </div>
      </div>

      {/* Sidebar Lateral */}
      <aside className="absolute left-0 top-0 z-40 h-full w-full md:w-[380px] bg-[#0f0f0f] border-r border-white/5 flex flex-col text-white shadow-2xl">
        {/* Header da Sidebar */}
        <div className="p-6 pb-4 border-b border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#a3e635]/10 rounded-lg">
              <Scissors className="h-5 w-5 text-[#a3e635]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Black Diamond
              </h1>
              <p className="text-[11px] text-white/40 font-medium tracking-wide">Encontre sua unidade premium</p>
            </div>
          </div>

          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Unidades</span>
              <span className="text-2xl font-black text-[#a3e635] mt-1">{BRANCHES.length}</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Abertas</span>
              <span className="text-2xl font-black text-emerald-400 mt-1">
                {BRANCHES.filter((b) => b.status === 'Aberta').length}
              </span>
            </div>
          </div>

          {/* Campo de pesquisa interno da Sidebar */}
          <div className="relative pt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Pesquisar por bairro ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/5 text-white placeholder:text-white/30 focus-visible:ring-[#a3e635] h-10 rounded-xl"
            />
          </div>
        </div>

        {/* Lista de Unidades com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {filteredBranches.map((branch) => {
            const isSelected = selectedBranch === branch.id;
            const isBusy = branch.occupancy > 80;

            return (
              <div
                key={branch.id}
                onClick={() => focusBranch(branch)}
                className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer group flex flex-col gap-3 ${
                  isSelected
                    ? 'border-[#a3e635] bg-white/10 shadow-[0_0_20px_rgba(163,230,53,0.1)]'
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Linha indicadora lateral */}
                <div 
                  className="absolute left-0 top-0 w-1 h-full bg-[#a3e635] rounded-l-xl transition-opacity duration-300" 
                  style={{ opacity: isSelected ? 1 : 0 }}
                />

                {/* Topo do Card */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm tracking-wide text-white group-hover:text-[#a3e635] transition-colors">
                      {branch.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{branch.distance} de você</span>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border-none ${
                      isBusy ? 'bg-red-500/10 text-red-400' : 'bg-[#a3e635]/10 text-[#a3e635]'
                    }`}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {branch.occupancy}%
                  </Badge>
                </div>

                {/* Base do Card */}
                <div className="flex items-center justify-between pt-1 text-xs border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${branch.status === 'Aberta' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-white/60 font-medium">{branch.status}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBranches.length === 0 && (
            <div className="p-8 text-center border border-dashed border-white/5 rounded-xl bg-white/5">
              <p className="text-sm text-white/40">Nenhuma filial encontrada para a sua busca.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Container do Mapa da OpenFreeMap / MapLibre */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}