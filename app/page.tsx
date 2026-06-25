"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import "maplibre-gl/dist/maplibre-gl.css";

// Importações de utilitários e lógica de negócio
import { listaCompletaBarbearias, Barbearia } from "./utils/barbeariasData";
import { useGeolocation } from './hooks/useGeolocation';
import { initRouteLayers, initUserLocationLayers } from './utils/mapLayers';
import { fetchRoute } from './utils/fetchRoute';

// Importações dos componentes estruturais de navegação
import LeftSidebar from "@/components/navigation/leftsidebar";
import RightSidebar from "@/components/navigation/rightsidebar";
import MobileExplorationDrawer from "@/components/navigation/mobileexplorationdrawer";

// Interface estrita para as propriedades do marcador visual no mapa
interface MarkerProps { 
  logoUrl: string; 
  nome: string; 
  isActive: boolean; 
  algumAtivo: boolean; // Indica se o usuário possui alguma barbearia focada no momento
}

/**
 * Componente BarberMarker
 * Constrói um pin de geolocalização vetorial idêntico ao modelo clássico de GPS.
 * A imagem da barbearia fica perfeitamente circular embutida na cabeça do marcador.
 */
function BarberMarker({ logoUrl, nome, isActive, algumAtivo }: MarkerProps) {
  // Controle estrito de estados visuais baseados na seleção do utilizador:
  // 1. Ativo -> Borda verde neon acesa da Régua Máxima
  // 2. Outro ativo (Inativo) -> Filtro preto e branco (grayscale) e opacidade reduzida
  // 3. Nenhum ativo -> Cores originais e normais da logo
  const estiloFiltro = isActive 
    ? "border-[#a3e635] text-[#a3e635]" 
    : algumAtivo 
      ? "grayscale opacity-40 scale-90 text-neutral-800" 
      : "text-neutral-900 hover:scale-105";

  return (
    <div className={`relative flex flex-col items-center group transition-all duration-300 ${isActive ? "z-50 scale-110" : "z-10"}`}>
      
      {/* Efeito de Ondas/Pulso Verde Neon (Apenas quando o ponteiro está selecionado) */}
      {isActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#a3e635]/30 rounded-full blur-sm animate-ping pointer-events-none" />
      )}

      {/* Estrutura do Ponteiro de Localização em Gota utilizando SVG Puro */}
      <div className={`relative w-12 h-14 flex items-center justify-center transition-all duration-300 ${estiloFiltro}`}>
        <svg viewBox="0 0 24 30" fill="currentColor" className="absolute inset-0 w-full h-full drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z" />
        </svg>

        {/* Imagem circular da barbearia encaixada perfeitamente no olho do ponteiro */}
        <div className="absolute top-[6px] w-8 h-8 rounded-full overflow-hidden bg-transparent border-0 z-10">
          <img 
            src={logoUrl} 
            alt={nome} 
            className="w-full h-full object-cover rounded-full select-none pointer-events-none" 
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Componente Principal: MapaPage
 * Responsável por gerenciar os estados globais da aplicação, filtros geográficos e renderização do canvas.
 */
export default function MapaPage() {
  const { coords } = useGeolocation();
  
  // Estados de controle das rotas e inicialização
  const [rotaAtivaId, setRotaAtivaId] = useState<string | null>(null);
  const [routeEtas, setRouteEtas] = useState<{ car: number, walk: number, transit: number } | null>(null);
  const [mapaPronto, setMapaPronto] = useState(false);
  
  // Estados de dados e barramento de filtros
  const [filiais] = useState<Barbearia[]>(listaCompletaBarbearias);
  const [filialAtivaObj, setFilialAtivaObj] = useState<Barbearia | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  
  // Lista de portais para injetar os marcadores React dentro da árvore DOM controlada pelo MapLibre
  const [portalElements, setPortalElements] = useState<Array<{ id: string; element: HTMLElement; barbearia: Barbearia; }>>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const animationRef = useRef<number | null>(null);

  // Limpa ciclos de animação pendentes na memória ao desmontar a página
  useEffect(() => {
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, []);

  // Inicializa o mapa com o estilo Fiord (OpenFreeMap) focado na região do Brasil
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
        mapaInstancia.resize(); // Evita o bug de tela preta recalculando a dimensão do canvas
      });
    });

    return () => {
      if (mapaInstancia) { mapaInstancia.remove(); mapRef.current = null; }
    };
  }, []);

  // Força o redimensionamento síncrono assim que o mapa sinaliza que carregou
  useEffect(() => {
    if (mapaPronto && mapRef.current) mapRef.current.resize();
  }, [mapaPronto]);

  // Alimenta em tempo real a camada gráfica contendo a bolinha do GPS do usuário
  useEffect(() => {
    const map = mapRef.current;
    if (map && coords && mapaPronto) {
      const source = map.getSource('user-location') as any;
      if (source) source.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: {} }] });
    }
  }, [coords, mapaPronto]);

  // Ciclo de vida que gera os elementos DOM vazios no mapa para anexar os BarberMarkers customizados
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

  // Função utilitária acionada pelo botão da barra lateral para recentralizar a visão no GPS do cliente
  const centralizarNoUsuario = () => {
    const map = mapRef.current;
    if (map && coords) {
      map.flyTo({ center: coords, zoom: 16, pitch: 0, bearing: 0, speed: 1.5, essential: true });
    }
  };

  // Traça a rota da OSRM API e executa movimentos cinematográficos orbitais (pitch/bearing)
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

      // Efeito incremental frame-a-frame de desenho da linha da rota (performance visual estável)
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

  // Limpa estados de rota ativos e restaura a visualização flat bidimensional no mapa
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

  // Mapeamento local para tratamento tolerante a falhas do select de estados
  const mapaEstados: Record<string, string[]> = {
    "SP": ["São Paulo", "Campinas", "Guarulhos", "Sorocaba", "Ribeirão Preto", "Santos", "São José", "Osasco", "Santo André", "São Bernardo", "Carandiru", "Jardins", "Bixiga", "Pinheiros", "Moema", "Tatuapé"],
    "RJ": ["Rio de Janeiro", "Copacabana", "Niterói", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu"],
    "MG": ["Belo Horizonte", "Savassi", "Uberlândia", "Contagem", "Juiz de Fora"],
  };

  // Algoritmo matemático para cálculo de distância linear real em KM (Haversine)
  const calcularDistanciaHaversine = (lon1: number, lat1: number, lon2: number, lat2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Filtra e ordena a coleção baseado nas ações do usuário e distância do GPS
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
      {/* Camada Zero: O Container do mapa */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Portais isolados para injeção síncrona dos pins customizados com detecção global de foco */}
      {portalElements.map(({ id, element, barbearia }) =>
        createPortal(
          <BarberMarker 
            key={id} 
            logoUrl={barbearia.logoUrl} 
            nome={barbearia.nome} 
            isActive={filialAtivaObj?.id === id} 
            algumAtivo={filialAtivaObj !== null} 
          />,
          element
        )
      )}

      {/* VIEWPORT INTERFACE: DESKTOP ECOSYSTEM */}
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

      {/* VIEWPORT INTERFACE: MOBILE ECOSYSTEM (Drawer da Visão Figma) */}
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