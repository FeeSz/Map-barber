"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDragControls } from "framer-motion";
import "maplibre-gl/dist/maplibre-gl.css";

// Dados estáticos das barbearias e o tipo Barbearia, separados em arquivo próprio
// para não poluir esse componente com centenas de linhas de mock
import { listaCompletaBarbearias, Barbearia } from "./utils/barbeariasData";

// Hook personalizado que encapsula o watchPosition do navegador —
// retorna as coordenadas atuais do usuário em tempo real
import { useGeolocation } from './hooks/useGeolocation';

// Funções que criam as layers do MapLibre: a linha de rota e o ponto de localização do usuário
// Ficam fora do componente porque são puras — não dependem de estado React
import { initRouteLayers, initUserLocationLayers } from './utils/mapLayers';

// Faz a chamada à OSRM Demo API e retorna o GeoJSON da rota + tempos estimados por modal
import { fetchRoute } from './utils/fetchRoute';

// Componentes de UI separados para manter esse arquivo focado só na lógica do mapa
import SearchBar from "@/components/navigation/searchbar";
import Sidebar from "@/components/navigation/sidebar";

// ─── Marcador visual no mapa ────────────────────────────────────────────────
// Componente simples que renderiza o pin de cada barbearia.
// Recebe isActive para aplicar o efeito de hover/seleção via CSS.
// É montado via createPortal diretamente nos elementos DOM que o MapLibre gerencia.
interface MarkerProps {
  logoUrl: string;
  nome: string;
  isActive: boolean;
}

function BarberMarker({ logoUrl, nome, isActive }: MarkerProps) {
  return (
    <div className={`premium-marker ${isActive ? "marker-active" : ""}`}>
      <div className="pulse-glow" />
      <div className="marker-logo-container">
        <img src={logoUrl} alt={nome} className="w-full h-full object-cover select-none pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Componente principal da página ─────────────────────────────────────────
export default function MapaPage() {
  // Coordenadas GPS do usuário, atualizadas em tempo real pelo hook
  const { coords } = useGeolocation();

  // Controla o gesto de drag da sidebar no mobile (Framer Motion)
  const dragControls = useDragControls();
  
  // ── Estados do mapa ──────────────────────────────────────────────────────

  // ID da barbearia cujo trajeto está atualmente desenhado no mapa
  const [rotaAtivaId, setRotaAtivaId] = useState<string | null>(null);

  // Tempos estimados de chegada por modal (carro, a pé, transporte público)
  // chegam null enquanto a rota ainda está sendo calculada
  const [routeEtas, setRouteEtas] = useState<{ car: number, walk: number, transit: number } | null>(null);

  // Sinaliza que o mapa terminou de carregar tiles e está pronto para receber layers
  const [mapaPronto, setMapaPronto] = useState(false);

  // Controla se a sidebar mobile está expandida (85vh) ou recolhida (28vh)
  const [isExpanded, setIsExpanded] = useState(false);
  
  // ── Estados de dados e filtros ───────────────────────────────────────────

  // Lista completa de barbearias — imutável durante a sessão, por isso sem setter exposto
  const [filiais] = useState<Barbearia[]>(listaCompletaBarbearias);

  // ID da barbearia cujo card está aberto na sidebar (expande os detalhes)
  const [filialAtiva, setFilialAtiva] = useState<string | null>(null);

  // Texto livre da barra de pesquisa, filtra por nome
  const [busca, setBusca] = useState("");

  // Chip de tag ativo (ex: "Abertas", "Premium") — null significa sem filtro
  const [filtroTag, setFiltroTag] = useState<string | null>(null);

  // Filtro por estado — "Todos" desativa o filtro geográfico
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  
  // Lista de elementos DOM que o MapLibre criou para cada marcador,
  // usada pelo createPortal para injetar os componentes React dentro deles
  const [portalElements, setPortalElements] = useState<Array<{ id: string; element: HTMLElement; barbearia: Barbearia; }>>([]);

  // ── Refs ─────────────────────────────────────────────────────────────────

  // Referência ao elemento <div> que serve de container do canvas do MapLibre
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Instância do mapa — em ref (não estado) para não provocar re-renders ao atualizar
  const mapRef = useRef<any>(null);

  // Lista de instâncias de Marker do MapLibre para poder removê-los quando necessário
  const markersRef = useRef<any[]>([]);

  // ID do requestAnimationFrame da animação de traçado de rota,
  // guardado em ref para poder cancelar a qualquer momento sem re-render
  const animationRef = useRef<number | null>(null);

  const userProfilePic = "https://i.pravatar.cc/150?img=11"; 

  // ─── Cleanup da animação ao desmontar o componente ──────────────────────
  // Garante que nenhum rAF fique rodando em background se o usuário navegar para outra página
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ─── Inicialização do mapa ───────────────────────────────────────────────
  // Roda uma única vez. O guard `mapRef.current` evita que o StrictMode do Next.js
  // (que monta/desmonta duas vezes em dev) crie dois mapas simultâneos.
  // O mapa começa com zoom 4 centrado no Brasil para depois enquadrar as filiais.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let mapaInstancia: any;

    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainerRef.current) return;
      mapaInstancia = new maplibregl.default.Map({
        container: mapContainerRef.current,
        style: "https://tiles.openfreemap.org/styles/fiord",
        center: [-53.2000, -10.3000],
        zoom: 4,      
        pitch: 0,     
        bearing: 0,   
        minZoom: 3,   
        maxZoom: 19,
        attributionControl: false,
      });

      mapRef.current = mapaInstancia;

      // Só após o evento 'load' o mapa está pronto para receber sources e layers —
      // qualquer chamada antes disso resulta em erro silencioso
      mapaInstancia.on("load", () => {
        setMapaPronto(true);
        initRouteLayers(mapaInstancia);       // cria source "route" + layers da linha
        initUserLocationLayers(mapaInstancia); // cria source "user-location" + ponto lime animado
      });

      // Suprime erros de rede esperados (tiles que falharam por timeout, etc.)
      mapaInstancia.on("error", (e: any) => {
        if (e?.error?.message?.includes("Failed to fetch")) return;
        console.error("[MapLibre]", e);
      });
    });

    // Cleanup: remove o mapa ao desmontar para liberar o contexto WebGL
    return () => {
      if (mapaInstancia) {
        mapaInstancia.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ─── Atualização do ponto de localização em tempo real ──────────────────
  // Toda vez que o hook useGeolocation emite novas coordenadas,
  // apenas atualiza o GeoJSON da source — não recria nada, zero jank.
  useEffect(() => {
    const map = mapRef.current;
    if (map && coords && mapaPronto) {
      const source = map.getSource('user-location') as any;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: {} }]
        });
      }
    }
  }, [coords, mapaPronto]);

  // ─── Criação dos pins e enquadramento inicial ────────────────────────────
  // Aguarda o mapa estar pronto, depois percorre todas as filiais:
  // cria um elemento DOM por barbearia, instancia o Marker do MapLibre nele,
  // e registra o elemento no estado para o createPortal injetar o React Component.
  // Por fim, usa fitBounds para que o mapa enquadre todas as filiais na tela.
  useEffect(() => {
    const mapa = mapRef.current;
    if (!mapa || !mapaPronto || filiais.length === 0) return;

    import("maplibre-gl").then((maplibregl) => {
      // Remove markers antigos antes de recriar (evita duplicatas)
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const novosPortais: Array<{ id: string; element: HTMLElement; barbearia: Barbearia; }> = [];
      const bounds = new maplibregl.default.LngLatBounds();

      filiais.forEach((barbearia) => {
        bounds.extend(barbearia.coordenadas);

        // Elemento DOM "vazio" — o React vai renderizar o BarberMarker dentro dele via portal
        const wrapper = document.createElement("div");
        wrapper.className = "map-marker-wrapper";
        wrapper.addEventListener("click", () => handleSelecionarUnidade(barbearia));

        const marker = new maplibregl.default.Marker({ element: wrapper, anchor: "bottom" })
          .setLngLat(barbearia.coordenadas)
          .addTo(mapa);

        markersRef.current.push(marker);
        novosPortais.push({ id: barbearia.id, element: wrapper, barbearia });
      });

      setPortalElements(novosPortais);

      // Padding generoso para não cobrir a sidebar nem a search bar
      mapa.fitBounds(bounds, { padding: { top: 150, bottom: 350, left: 60, right: 60 }, maxZoom: 16, duration: 1500 });
    });

    // Cleanup: remove os markers se as filiais mudarem ou o componente desmontar
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      setPortalElements([]);
    };
  }, [mapaPronto, filiais]);

  // ─── Seleção de unidade: foco no mapa + traçado de rota ─────────────────
  // Chamado tanto pelo clique no card da sidebar quanto pelo clique no pin do mapa.
  // Se ainda não há GPS, apenas voa até a barbearia sem tentar calcular rota.
  // Se há GPS, chama a OSRM, anima o traçado quadro a quadro via rAF e atualiza os ETAs.
  const handleSelecionarUnidade = async (barbearia: Barbearia) => {
    setFilialAtiva(barbearia.id);
    const map = mapRef.current;
    if (!map) return;

    // Sem localização: só centraliza o mapa na barbearia e encerra
    if (!coords) {
      map.flyTo({ center: barbearia.coordenadas, zoom: 18, pitch: 55, bearing: -20, speed: 1.2, essential: true });
      return;
    }

    // Cancela qualquer animação de rota anterior que ainda esteja rodando
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setRouteEtas(null);
    setRotaAtivaId(barbearia.id);

    // Limpa a rota desenhada no mapa antes de buscar a nova
    const routeSource = map.getSource('route') as any;
    if (routeSource) routeSource.setData({ type: 'FeatureCollection', features: [] });

    // Busca a rota na OSRM — retorna o GeoJSON da linha e os tempos estimados
    const data = await fetchRoute(coords, barbearia.coordenadas);
    
    if (data && routeSource) {
      setRouteEtas(data.durations);

      // Enquadra o mapa para mostrar origem + destino com a rota completa visível
      import("maplibre-gl").then((maplibregl) => {
        const bounds = new maplibregl.default.LngLatBounds();
        data.feature.geometry.coordinates.forEach((coord: any) => bounds.extend(coord as [number, number]));
        map.fitBounds(bounds, { padding: { top: 150, bottom: 350, left: 60, right: 60 }, maxZoom: 16, duration: 1200 });
      });
      
      // Animação de traçado progressivo: em vez de desenhar toda a linha de uma vez,
      // revela fatias crescentes de coordenadas a cada frame — efeito de "desenhar" a rota
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

        // Continua animando até revelar todos os pontos da rota
        if (currentPoints < fullCoordinates.length) {
          animationRef.current = requestAnimationFrame(animateRoute);
        }
      };
      animationRef.current = requestAnimationFrame(animateRoute);
    }
  };

  // ─── Limpar rota ─────────────────────────────────────────────────────────
  // Cancela animação pendente, reseta todos os estados relacionados à rota,
  // apaga a linha do mapa e devolve o zoom ao panorama geral do Brasil
  const limparRota = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setRouteEtas(null);
    setRotaAtivaId(null);
    setFilialAtiva(null);
    
    const map = mapRef.current;
    if (map) {
      const source = map.getSource('route') as any;
      if (source) source.setData({ type: 'FeatureCollection', features: [] });
      map.flyTo({ zoom: 4, pitch: 0, speed: 1.2 });
    }
  };

  // ─── Filtro de filiais (memoizado) ───────────────────────────────────────
  // Recalcula a lista apenas quando busca, filtroTag ou filtroEstado mudam —
  // evita reprocessar o array inteiro em todo render causado por outros estados
  const filiaisFiltradas = useMemo(() => {
    return filiais
      .filter((f) => f.nome.toLowerCase().includes(busca.toLowerCase()))
      .filter((f) => !filtroTag || f.tags.includes(filtroTag))
      .filter((f) => {
        if (filtroEstado === "Todos") return true;
        return f.estado === filtroEstado || f.nome.includes(filtroEstado); 
      });
  }, [filiais, busca, filtroTag, filtroEstado]);

  // ─── Renderização ────────────────────────────────────────────────────────
  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#030303]">
      {/* Container do canvas do MapLibre — ocupa 100% do viewport por baixo de tudo */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Injeta cada BarberMarker dentro do elemento DOM que o MapLibre controla.
          O createPortal é necessário porque o MapLibre gerencia esses elementos
          fora da árvore React normal */}
      {portalElements.map(({ id, element, barbearia }) =>
        createPortal(
          <BarberMarker key={id} logoUrl={barbearia.logoUrl} nome={barbearia.nome} isActive={filialAtiva === id} />,
          element
        )
      )}

      {/* Barra de pesquisa flutuante com foto de perfil — posicionada em absolute no topo */}
      <SearchBar 
        busca={busca} 
        setBusca={setBusca} 
        userProfilePic={userProfilePic} 
      />

      {/* Sidebar com lista de filiais, filtros, cards e lógica de rota —
          recebe tudo que precisa via props para ficar desacoplada desse arquivo */}
      <Sidebar 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        dragControls={dragControls}
        filiaisFiltradas={filiaisFiltradas}
        filtroTag={filtroTag}
        setFiltroTag={setFiltroTag}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        rotaAtivaId={rotaAtivaId}
        filialAtiva={filialAtiva}
        routeEtas={routeEtas}
        handleSelecionarUnidade={handleSelecionarUnidade}
        limparRota={limparRota}
      />
    </main>
  );
}