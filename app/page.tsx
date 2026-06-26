"use client";

import { ChevronLeft, Ghost, Navigation } from "lucide-react";
import { createIcons, moveLeft } from 'lucide';
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";

// Utilitários e Dados
import { listaCompletaBarbearias, Barbearia } from "./utils/barbeariasData";
import { useGeolocation } from "./hooks/useGeolocation";
import { initRouteLayers, initUserLocationLayers } from "./utils/mapLayers";
import { fetchRoute } from "./utils/fetchRoute";
import { MobileDetailsDrawer } from '@/components/navigation/drawer/mobiledetailsdrawer';
// Componentes UI
import RightSidebar from "@/components/navigation/rightsidebar";
import MobileExplorationDrawer from "@/components/navigation/mobileexplorationdrawer";
import { Button } from "@/components/ui/button";

// ─── Haversine fora do componente: função pura, zero re-criação ──────────────
function calcularDistanciaHaversine(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface MarkerProps {
  logoUrl: string;
  nome: string;
  isActive: boolean;
  algumAtivo: boolean;
}

// ─── BarberMarker — memorizado, sem dependências externas ────────────────────
const BarberMarker = React.memo(function BarberMarker({
  logoUrl,
  nome,
  isActive,
  algumAtivo,
}: MarkerProps) {
  const estiloFiltro = isActive
    ? "border-[#a3e635] text-[#a3e635] z-50 scale-110"
    : algumAtivo
    ? "grayscale opacity-40 scale-90 text-neutral-800 z-10"
    : "text-neutral-900 hover:scale-105 z-20";

  return (
    <div
      className={`relative flex flex-col items-center group transition-all duration-300 ${estiloFiltro}`}
    >
      {isActive && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#a3e635]/40 rounded-full blur-sm animate-ping pointer-events-none" />
      )}
      <div className="relative w-9 h-11 flex items-center justify-center transition-all duration-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
        <svg
          viewBox="0 0 24 30"
          fill="currentColor"
          className="absolute inset-0 w-full h-full"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z" />
        </svg>
        <div className="absolute top-[4.5px] w-6 h-6 rounded-full overflow-hidden bg-[#0c0c0c] border-0 z-10">
          <img
            src={logoUrl}
            alt={nome}
            className="w-full h-full object-cover rounded-full select-none pointer-events-none"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
});

// ─── Tipo do portal ───────────────────────────────────────────────────────────
interface PortalEntry {
  id: string;
  element: HTMLElement;
  barbearia: Barbearia;
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function MapaPage() {
  const router = useRouter();
  const { coords } = useGeolocation();

  // Estado mínimo no React — apenas o que dispara re-render necessário
  const [rotaAtivaId, setRotaAtivaId] = useState<string | null>(null);
  const [routeEtas, setRouteEtas] = useState<{
    car: number;
    walk: number;
    transit: number;
  } | null>(null);
  const [mapaPronto, setMapaPronto] = useState(false);
  const [filialAtivaObj, setFilialAtivaObj] = useState<Barbearia | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [portalElements, setPortalElements] = useState<PortalEntry[]>([]);

  // Refs — não disparam re-render
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const animationRef = useRef<number | null>(null);
  const coordsRef = useRef(coords); // espelho de coords para callbacks estáveis

  // Mantém coordsRef sincronizado sem re-criar callbacks
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // ─── Dados estáticos — sem estado, sem re-render ──────────────────────────
  const filiais = useMemo(() => listaCompletaBarbearias, []);

  // ─── Cleanup do animation frame ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);
  

  // ─── Inicialização do mapa (executado uma única vez) ──────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let mapaInstancia: any;

    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainerRef.current) return;

      const limitesAmericaDoSul: [[number, number], [number, number]] = [
        [-95.0, -60.0],
        [-25.0, 15.0],
      ];

      mapaInstancia = new maplibregl.default.Map({
        container: mapContainerRef.current,
        style: "https://tiles.openfreemap.org/styles/fiord",
        center: [-53.2, -10.3],
        zoom: 4,
        pitch: 0,
        bearing: 0,
        minZoom: 3,
        maxZoom: 19,
        attributionControl: false,
        maxBounds: limitesAmericaDoSul,
        preserveDrawingBuffer: false,
        // Performance: limita FPS em telas de alta densidade
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        fadeDuration: 200,
      });

      mapRef.current = mapaInstancia;

      mapaInstancia.on("load", () => {
        setMapaPronto(true);
        initRouteLayers(mapaInstancia);
        initUserLocationLayers(mapaInstancia);
        mapaInstancia.resize();
      });
    });

    return () => {
      if (mapaInstancia) {
        mapaInstancia.remove();
        mapRef.current = null;
      }
    };
  }, []); // deps vazias — roda só uma vez

  // ─── Resize quando o mapa estiver pronto ─────────────────────────────────
  useEffect(() => {
    if (mapaPronto && mapRef.current) mapRef.current.resize();
  }, [mapaPronto]);

  // ─── Atualização da camada de localização do usuário ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coords || !mapaPronto) return;

    const source = map.getSource("user-location") as any;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: coords },
            properties: {},
          },
        ],
      });
    }
  }, [coords, mapaPronto]);

  // ─── Handlers estáveis com useCallback ───────────────────────────────────

  const limparRota = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setRouteEtas(null);
    setRotaAtivaId(null);
    setFilialAtivaObj(null);

    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("route") as any;
    if (source) source.setData({ type: "FeatureCollection", features: [] });

    map.flyTo({ pitch: 0, bearing: 0, speed: 1.5, padding: { bottom: 0 } });
  }, []);

  const handleSelecionarUnidade = useCallback(
    async (barbearia: Barbearia) => {
      setFilialAtivaObj(barbearia);

      const map = mapRef.current;
      if (!map) return;

      const currentCoords = coordsRef.current;

      if (!currentCoords) {
        map.flyTo({
          center: barbearia.coordenadas,
          zoom: 17,
          pitch: 45,
          bearing: -20,
          speed: 1.5,
          essential: true,
          padding: { bottom: 250 },
        });
        return;
      }

      // Cancela animação anterior imediatamente
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      setRouteEtas(null);
      setRotaAtivaId(barbearia.id);

      // Garante que a source de rota existe
      let routeSource = map.getSource("route") as any;
      if (!routeSource) {
        map.addSource("route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "route-layer",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#a3e635",
            "line-width": 5,
            "line-opacity": 0.8,
          },
        });
        routeSource = map.getSource("route");
      }

      // Limpa rota anterior antes de aguardar a nova
      routeSource.setData({ type: "FeatureCollection", features: [] });

      const data = await fetchRoute(currentCoords, barbearia.coordenadas);
      if (!data || !routeSource) return;

      setRouteEtas(data.durations);

      import("maplibre-gl").then((maplibregl) => {
        const bounds = new maplibregl.default.LngLatBounds();
        data.feature.geometry.coordinates.forEach((coord: any) =>
          bounds.extend(coord as [number, number])
        );
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 350, left: 50, right: 50 },
          pitch: 50,
          maxZoom: 15,
          duration: 1200,
        });
      });

      // Animação da rota
      const fullCoords: [number, number][] = data.feature.geometry.coordinates;
      const totalFrames = 25;
      const pointsPerFrame = Math.max(
        1,
        Math.ceil(fullCoords.length / totalFrames)
      );
      let currentFrame = 0;

      const animateRoute = () => {
        currentFrame++;
        const slice = currentFrame * pointsPerFrame;
        routeSource.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: fullCoords.slice(0, slice),
              },
              properties: {},
            },
          ],
        });
        if (slice < fullCoords.length) {
          animationRef.current = requestAnimationFrame(animateRoute);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animateRoute);
    },
    [] // coordsRef.current lido no momento da chamada — sem deps necessárias
  );

  // ─── Criação dos markers (só quando o mapa estiver pronto) ───────────────
  useEffect(() => {
    const mapa = mapRef.current;
    if (!mapa || !mapaPronto || filiais.length === 0) return;

    let mounted = true;

    import("maplibre-gl").then((maplibregl) => {
      if (!mounted) return;

      // Remove markers antigos
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const novosPortais: PortalEntry[] = [];
      const bounds = new maplibregl.default.LngLatBounds();

      filiais.forEach((barbearia) => {
        bounds.extend(barbearia.coordenadas);

        const wrapper = document.createElement("div");
        wrapper.className = "map-marker-wrapper relative";
        wrapper.addEventListener("click", () =>
          handleSelecionarUnidade(barbearia)
        );

        const marker = new maplibregl.default.Marker({
          element: wrapper,
          anchor: "bottom",
        })
          .setLngLat(barbearia.coordenadas)
          .addTo(mapa);

        markersRef.current.push(marker);
        novosPortais.push({ id: barbearia.id, element: wrapper, barbearia });
      });

      if (mounted) {
        setPortalElements(novosPortais);
        mapa.fitBounds(bounds, {
          padding: 80,
          maxZoom: 16,
          duration: 1500,
        });
      }
    });

    return () => {
      mounted = false;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      setPortalElements([]);
    };
  }, [mapaPronto, filiais, handleSelecionarUnidade]);

  // ─── GPS / centralizar no usuário ────────────────────────────────────────
  const centralizarNoUsuario = useCallback(() => {
    const map = mapRef.current;
    const currentCoords = coordsRef.current;

    if (map && currentCoords) {
      map.flyTo({
        center: currentCoords,
        zoom: 16,
        pitch: 0,
        bearing: 0,
        speed: 1.5,
        essential: true,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (map) {
          map.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 16,
            speed: 1.5,
          });
        }
      },
      (err) => {
        console.warn("GPS bloqueado:", err);
        alert(
          "Permissão de localização bloqueada. Ative nas configurações do navegador."
        );
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // ─── Lista filtrada — memoizada ───────────────────────────────────────────
  const filiaisFiltradas = useMemo(() => {
    const buscaLower = busca.toLowerCase();

    return filiais
      .filter(
        (f) =>
          f.nome.toLowerCase().includes(buscaLower) &&
          (!filtroTag || f.tags.includes(filtroTag))
      )
      .map((f) => ({
        ...f,
        distanciaRealKm: coords
          ? calcularDistanciaHaversine(
              coords[0],
              coords[1],
              f.coordenadas[0],
              f.coordenadas[1]
            )
          : null,
      }))
      .sort((a, b) => (a.distanciaRealKm ?? 0) - (b.distanciaRealKm ?? 0));
  }, [filiais, busca, filtroTag, coords]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    // ⚡ vaul-drawer-wrapper via spread — única forma válida de atributos com hífen em JSX
    <main
      {...{ "vaul-drawer-wrapper": "" }}
      className="relative w-screen h-screen overflow-hidden select-none bg-[#030303]"
    >
      {/* Mapa */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0"
      />
     <Button 
  variant="ghost" 
  onClick={() => router.back()}
  className="absolute w-12 h-12 top-6 left-4 z-50 bg-transparent backdrop-blur-xl p-3.5 rounded-full border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white  hover:border-black transition-all active:scale-95 flex items-center justify-center"
  aria-label="Voltar para a plataforma"
>
  <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
</Button>

    
      <Button
      variant="ghost"
        onClick={centralizarNoUsuario}
        className="absolute top-6 // bg-transparent // w-12 h-12 // right-4 z-40 backdrop-blur-xl p-3.5 rounded-full border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white hover:bg-black hover:border-black hover:text-[#a3e635] transition-all active:scale-95 flex items-center justify-center"
        aria-label="Encontrar minha localização"
      >
        <Navigation className="w-5 h-5 fill-current" strokeWidth={2} />
      </Button>

      {/* Portais dos markers */}
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

      {/* Drawer mobile */}
      {/* Drawer unificado da lista (Este já existia) */}
      <MobileExplorationDrawer 
        filiaisFiltradas={filiaisFiltradas}
        filtroTag={filtroTag}
        setFiltroTag={setFiltroTag}
        handleSelecionarUnidade={handleSelecionarUnidade}
        rotaAtivaId={rotaAtivaId}
      />
      {/* NOVO: Drawer Liquid Glass de Detalhes para Mobile */}
<MobileDetailsDrawer
  barbearia={filialAtivaObj}
  routeEtas={routeEtas}
  onClose={limparRota}
/>  
    </main>
  );
}