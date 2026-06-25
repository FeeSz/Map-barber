"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import "maplibre-gl/dist/maplibre-gl.css";
import { listaCompletaBarbearias, Barbearia } from "./utils/barbeariasData";
import { useGeolocation } from './hooks/useGeolocation';
import { initRouteLayers, initUserLocationLayers } from './utils/mapLayers';
import { fetchRoute } from './utils/fetchRoute';

// Componentes
import SearchBar from "@/components/navigation/searchbar";
import Sidebar from "@/components/navigation/sidebar";
import LeftSidebar from "@/components/navigation/leftsidebar";
import RightSidebar from "@/components/navigation/rightsidebar";
import MobileExplorationDrawer from "@/components/navigation/mobileexplorationdrawer";

interface MarkerProps { logoUrl: string; nome: string; isActive: boolean; }

function BarberMarker({ logoUrl, nome, isActive }: MarkerProps) {
  return (
    <div className={`premium-marker ${isActive ? "marker-active scale-125 z-50" : "scale-100"} transition-transform duration-500`}>
      <div className="pulse-glow" />
      <div className="marker-logo-container">
        <img src={logoUrl} alt={nome} className="w-full h-full object-cover select-none pointer-events-none" />
      </div>
    </div>
  );
}

export default function MapaPage() {
  const { coords } = useGeolocation();
  
  const [rotaAtivaId, setRotaAtivaId] = useState<string | null>(null);
  const [routeEtas, setRouteEtas] = useState<{ car: number, walk: number, transit: number } | null>(null);
  const [mapaPronto, setMapaPronto] = useState(false);
  
  const [filiais] = useState<Barbearia[]>(listaCompletaBarbearias);
  const [filialAtivaObj, setFilialAtivaObj] = useState<Barbearia | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  
  const [portalElements, setPortalElements] = useState<Array<{ id: string; element: HTMLElement; barbearia: Barbearia; }>>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const animationRef = useRef<number | null>(null);

  // -- FUNÇÕES DE SUPORTE --

  const centralizarNoUsuario = () => {
    const map = mapRef.current;
    if (map && coords) {
      map.flyTo({ center: coords, zoom: 16, pitch: 0, bearing: 0, speed: 1.5, essential: true });
    }
  };

  useEffect(() => {
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, []);

  // -- INICIALIZAÇÃO DO MAPA --
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let mapaInstancia: any;

    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainerRef.current) return;
      mapaInstancia = new maplibregl.default.Map({
        container: mapContainerRef.current,
        style: "https://tiles.openfreemap.org/styles/fiord",
        center: [-53.2000, -10.3000],
        zoom: 4, pitch: 0, bearing: 0, minZoom: 3, maxZoom: 19, attributionControl: false,
      });

      mapRef.current = mapaInstancia;
      mapaInstancia.on("load", () => {
        setMapaPronto(true);
        initRouteLayers(mapaInstancia);
        initUserLocationLayers(mapaInstancia);
        mapaInstancia.resize(); // Força resize para evitar tela preta
      });
    });

    return () => {
      if (mapaInstancia) { mapaInstancia.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (mapaPronto && mapRef.current) mapRef.current.resize();
  }, [mapaPronto]);

  // -- LÓGICA DE GEOLOCALIZAÇÃO --
  useEffect(() => {
    const map = mapRef.current;
    if (map && coords && mapaPronto) {
      const source = map.getSource('user-location') as any;
      if (source) source.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: {} }] });
    }
  }, [coords, mapaPronto]);

  // -- LÓGICA DE MARCADORES --
  useEffect(() => {
    const mapa = mapRef.current;
    if (!mapa || !mapaPronto || filiais.length === 0) return;

    import("maplibre-gl").then((maplibregl) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      const novosPortais: Array<{ id: string; element: HTMLElement; barbearia: Barbearia; }> = [];
      const bounds = new maplibregl.default.LngLatBounds();

      filiais.forEach((barbearia) => {
        bounds.extend(barbearia.coordenadas);
        const wrapper = document.createElement("div");
        wrapper.className = "map-marker-wrapper";
        wrapper.addEventListener("click", () => handleSelecionarUnidade(barbearia));

        const marker = new maplibregl.default.Marker({ element: wrapper, anchor: "bottom" })
          .setLngLat(barbearia.coordenadas).addTo(mapa);
        
        markersRef.current.push(marker);
        novosPortais.push({ id: barbearia.id, element: wrapper, barbearia });
      });

      setPortalElements(novosPortais);
      mapa.fitBounds(bounds, { padding: { top: 100, bottom: 100, left: 100, right: 100 }, maxZoom: 16, duration: 1500 });
    });
    return () => { markersRef.current.forEach((m) => m.remove()); markersRef.current = []; setPortalElements([]); };
  }, [mapaPronto, filiais]);

  // -- CÁLCULO DE ROTA --
  const handleSelecionarUnidade = async (barbearia: Barbearia) => {
    setFilialAtivaObj(barbearia);
    const map = mapRef.current;
    if (!map) return;

    if (!coords) {
      map.flyTo({ center: barbearia.coordenadas, zoom: 18, pitch: 65, bearing: -30, speed: 1.2, essential: true });
      return;
    }

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setRouteEtas(null);
    setRotaAtivaId(barbearia.id);

    const routeSource = map.getSource('route') as any;
    if (routeSource) routeSource.setData({ type: 'FeatureCollection', features: [] });

    const data = await fetchRoute(coords, barbearia.coordenadas);
    
    if (data && routeSource) {
      setRouteEtas(data.durations);
      import("maplibre-gl").then((maplibregl) => {
        const bounds = new maplibregl.default.LngLatBounds();
        data.feature.geometry.coordinates.forEach((coord: any) => bounds.extend(coord as [number, number]));
        map.fitBounds(bounds, { padding: { top: 100, bottom: 150, left: 450, right: 450 }, pitch: 55, maxZoom: 16, duration: 1200 });
      });
      
      const fullCoordinates = data.feature.geometry.coordinates;
      let currentFrame = 0;
      const totalFrames = 30; 
      const pointsPerFrame = Math.max(1, Math.ceil(fullCoordinates.length / totalFrames));

      const animateRoute = () => {
        currentFrame++;
        const currentPoints = currentFrame * pointsPerFrame;
        routeSource.setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: fullCoordinates.slice(0, currentPoints) }, properties: {} }]
        });
        if (currentPoints < fullCoordinates.length) animationRef.current = requestAnimationFrame(animateRoute);
      };
      animationRef.current = requestAnimationFrame(animateRoute);
    }
  };

  const limparRota = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setRouteEtas(null);
    setRotaAtivaId(null);
    setFilialAtivaObj(null);
    
    const map = mapRef.current;
    if (map) {
      const source = map.getSource('route') as any;
      if (source) source.setData({ type: 'FeatureCollection', features: [] });
      map.flyTo({ pitch: 0, bearing: 0, speed: 1.2, padding: { right: 0 } });
    }
  };

  // -- FILTRAGEM --
  const mapaEstados: Record<string, string[]> = {
    "SP": ["São Paulo", "Campinas", "Guarulhos", "Sorocaba", "Ribeirão Preto", "Santos", "São José", "Osasco", "Santo André", "São Bernardo", "Carandiru", "Jardins", "Bixiga", "Pinheiros", "Moema", "Tatuapé"],
    "RJ": ["Rio de Janeiro", "Copacabana", "Niterói", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu"],
    "MG": ["Belo Horizonte", "Savassi", "Uberlândia", "Contagem", "Juiz de Fora"],
    // ... complete os outros estados se necessário
  };

  const calcularDistanciaHaversine = (lon1: number, lat1: number, lon2: number, lat2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filiaisFiltradas = useMemo(() => {
    let filtradas = filiais
      .filter((f) => f.nome.toLowerCase().includes(busca.toLowerCase()))
      .filter((f) => !filtroTag || f.tags.includes(filtroTag))
      .filter((f) => {
        if (filtroEstado === "Todos") return true;
        if (f.estado === filtroEstado) return true;
        const cidadesDoEstado = mapaEstados[filtroEstado] || [];
        return cidadesDoEstado.some(cidade => f.nome.toLowerCase().includes(cidade.toLowerCase()));
      });

    return filtradas.map(f => ({ ...f, distanciaRealKm: coords ? calcularDistanciaHaversine(coords[0], coords[1], f.coordenadas[0], f.coordenadas[1]) : null }))
      .sort((a, b) => (a.distanciaRealKm || 0) - (b.distanciaRealKm || 0));
  }, [filiais, busca, filtroTag, filtroEstado, coords]);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#030303]">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {portalElements.map(({ id, element, barbearia }) =>
        createPortal(
          <BarberMarker key={id} logoUrl={barbearia.logoUrl} nome={barbearia.nome} isActive={filialAtivaObj?.id === id} />,
          element
        )
      )}

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:block">
        <LeftSidebar 
          filiaisFiltradas={filiaisFiltradas}
          busca={busca} setBusca={setBusca}
          filtroTag={filtroTag} setFiltroTag={setFiltroTag}
          filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado}
          handleSelecionarUnidade={handleSelecionarUnidade}
          rotaAtivaId={rotaAtivaId}
          onCentralizar={centralizarNoUsuario}
        />
        <RightSidebar 
          barbearia={filialAtivaObj}
          routeEtas={routeEtas}
          limparRota={limparRota}
        />
      </div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden">
        <MobileExplorationDrawer 
          filiaisFiltradas={filiaisFiltradas}
          filtroTag={filtroTag}
          setFiltroTag={setFiltroTag}
          handleSelecionarUnidade={handleSelecionarUnidade}
          rotaAtivaId={rotaAtivaId}
        />
      </div>
    </main>
  );
}