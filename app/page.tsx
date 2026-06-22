"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "maplibre-gl/dist/maplibre-gl.css";

// ======================================================
// COMPONENTE DO MARCADOR
// ======================================================

interface MarkerProps {
  logoUrl: string;
  nome: string;
  isActive: boolean;
}

function BarberMarker({
  logoUrl,
  nome,
  isActive,
}: MarkerProps) {
  return (
    <div
      className={`premium-marker ${
        isActive ? "marker-active" : ""
      }`}
    >
      <div className="pulse-glow" />

      <div className="marker-logo-container">
        <img
          src={logoUrl}
          alt={nome}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>
    </div>
  );
}

// ======================================================
// INTERFACES
// ======================================================

interface Barbearia {
  id: string;
  nome: string;
  logoUrl: string;
  distancia: string;
  statusOcupacao: "tranquilo" | "moderado" | "lotado";
  porcentagemOcupacao: number;
  avaliacao: number;
  detalhesAvaliacao: {
    atendimento: number;
    ambiente: number;
    higiene: number;
  };
  coordenadas: [number, number];
  tags: string[];
}

// ======================================================
// DADOS MOCK
// ======================================================

const filiaisExemplo: Barbearia[] = [
  {
    id: "1",
    nome: "Barbearia Corleone - Jardins",
    logoUrl:
      "https://placehold.co/64x64/1a1a1a/a3e635?text=BC",
    distancia: "1.2 km",
    statusOcupacao: "tranquilo",
    porcentagemOcupacao: 25,
    avaliacao: 4.9,
    detalhesAvaliacao: {
      atendimento: 5.0,
      ambiente: 4.9,
      higiene: 4.8,
    },
    coordenadas: [-46.6624, -23.5616],
    tags: ["Abertas", "Premium"],
  },
  {
    id: "2",
    nome: "Seu Elias - Premium",
    logoUrl:
      "https://placehold.co/64x64/1a1a1a/a3e635?text=SE",
    distancia: "3.8 km",
    statusOcupacao: "lotado",
    porcentagemOcupacao: 90,
    avaliacao: 4.7,
    detalhesAvaliacao: {
      atendimento: 4.8,
      ambiente: 4.6,
      higiene: 4.7,
    },
    coordenadas: [-46.6701, -23.5705],
    tags: ["Mais Próximas", "Premium"],
  },
];

// ======================================================
// MAP STYLE
// ======================================================

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    "osm-tiles": {
      type: "raster" as const,
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster" as const,
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function MapaPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const markersRef = useRef<any[]>([]);

  const [filiais] =
    useState<Barbearia[]>(filiaisExemplo);

  const [filialAtiva, setFilialAtiva] =
    useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroTag, setFiltroTag] =
    useState<string | null>(null);

  const [mapaPronto, setMapaPronto] =
    useState(false);

  const [portalElements, setPortalElements] =
    useState<
      Array<{
        id: string;
        element: HTMLElement;
        barbearia: Barbearia;
      }>
    >([]);

  // ======================================================
  // MAPA
  // ======================================================

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current)
      return;

    let mapaInstancia: any;

    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainerRef.current) return;

mapaInstancia = new maplibregl.default.Map({
  container: mapContainerRef.current,
  style: MAP_STYLE,

  center: [-46.666, -23.565],

  zoom: 15.8,

  pitch: 55,
  bearing: -20,

  minZoom: 10,
  maxZoom: 19,

  attributionControl: false,
});

      mapRef.current = mapaInstancia;

      mapaInstancia.on("load", () => {
        setMapaPronto(true);
      });

      mapaInstancia.on("error", (e: any) => {
        if (
          e?.error?.message?.includes(
            "Failed to fetch"
          )
        )
          return;

        console.error("[MapLibre]", e);
      });
    });
    

    return () => {
      if (mapaInstancia) {
        mapaInstancia.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ======================================================
  // MARCADORES
  // CRIA APENAS UMA VEZ
  // ======================================================

  useEffect(() => {
    const mapa = mapRef.current;

    if (!mapa || !mapaPronto) return;

    import("maplibre-gl").then((maplibregl) => {
      markersRef.current.forEach((m) =>
        m.remove()
      );

      markersRef.current = [];

      const novosPortais: Array<{
        id: string;
        element: HTMLElement;
        barbearia: Barbearia;
      }> = [];

      filiais.forEach((barbearia) => {
        const wrapper =
          document.createElement("div");

        wrapper.className =
          "map-marker-wrapper";

        wrapper.addEventListener("click", () => {
          setFilialAtiva(barbearia.id);

          mapa.flyTo({
            center: barbearia.coordenadas,
            zoom: 17.2,
            pitch: 55,
            bearing: -20,
            speed: 0.8,
            curve: 1.4,
            essential: true,
          });
        });

        const marker =
          new maplibregl.default.Marker({
            element: wrapper,
            anchor: "bottom",
          })
            .setLngLat(barbearia.coordenadas)
            .addTo(mapa);

        markersRef.current.push(marker);

        novosPortais.push({
          id: barbearia.id,
          element: wrapper,
          barbearia,
        });
      });

      setPortalElements(novosPortais);
    });

    return () => {
      markersRef.current.forEach((m) =>
        m.remove()
      );

      markersRef.current = [];

      setPortalElements([]);
    };
  }, [mapaPronto, filiais]);

  // ======================================================
  // FOCO
  // ======================================================

  const focarNaBarbearia = (
    barbearia: Barbearia
  ) => {
    setFilialAtiva(barbearia.id);

    mapRef.current?.flyTo({
      center: barbearia.coordenadas,
      zoom: 18,
      pitch: 55,
      bearing: -20,
      speed: 0.8,
      curve: 1.4,
      essential: true,
    });
  };

  // ======================================================
  // FILTROS SIDEBAR
  // ======================================================

  const filiaisFiltradas = filiais
    .filter((f) =>
      f.nome
        .toLowerCase()
        .includes(busca.toLowerCase())
    )
    .filter(
      (f) =>
        !filtroTag ||
        f.tags.includes(filtroTag)
    );

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#030303]">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0"
      />

      {portalElements.map(
        ({ id, element, barbearia }) =>
          createPortal(
            <BarberMarker
              key={id}
              logoUrl={barbearia.logoUrl}
              nome={barbearia.nome}
              isActive={filialAtiva === id}
            />,
            element
          )
      )}

      <div className="floating-search">
        <input
          type="text"
          placeholder="Buscar por filiais, serviços ou profissionais..."
          value={busca}
          onChange={(e) =>
            setBusca(e.target.value)
          }
        />
      </div>

      <aside className="map-sidebar">
        <div className="sidebar-header">
          <h1 className="map-title">
            Nossas Filiais
          </h1>

          <p className="map-subtitle">
            Encontre a unidade ideal para seu
            atendimento
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">
                {filiais.length}
              </div>

              <div className="stat-label">
                Filiais
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-value">
                {(
                  filiais.reduce(
                    (acc, item) =>
                      acc + item.avaliacao,
                    0
                  ) / filiais.length
                ).toFixed(1)}
              </div>

              <div className="stat-label">
                Avaliação
              </div>
            </div>
          </div>
        </div>

        <div className="filter-container">
          <div className="filter-row">
            {[
              "Abertas",
              "Mais Próximas",
              "Premium",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setFiltroTag(
                    filtroTag === tag
                      ? null
                      : tag
                  )
                }
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border cursor-pointer whitespace-nowrap ${
                  filtroTag === tag
                    ? "bg-[#a3e635] text-black border-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                    : "bg-white/5 text-white/70 border-white/5 hover:bg-white/10"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="branch-list">
          {filiaisFiltradas.map(
            (barbearia) => {
              const isActive =
                filialAtiva ===
                barbearia.id;

              return (
                <div
                  key={barbearia.id}
                  className={`branch-card ${
                    isActive
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    focarNaBarbearia(
                      barbearia
                    )
                  }
                >
                  <div className="branch-header">
                    <h3 className="branch-name">
                      {barbearia.nome}
                    </h3>

                    <div className="branch-rating-badge">
                      <span>★</span>

                      {barbearia.avaliacao.toFixed(
                        1
                      )}
                    </div>
                  </div>

                  <div className="branch-meta-row">
                    <span className="branch-distance">
                      {
                        barbearia.distancia
                      }
                    </span>

                    <div className="branch-live-occupancy">
                      <span
                        className={`occupancy-dot ${
                          barbearia.statusOcupacao ===
                          "lotado"
                            ? "busy"
                            : ""
                        }`}
                      />

                      <span>
                        {
                          barbearia.porcentagemOcupacao
                        }
                        % ocupado
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-white/60">
                        <div className="bg-white/5 p-2 rounded-lg">
                          <p className="font-bold text-white">
                            {barbearia.detalhesAvaliacao.atendimento.toFixed(
                              1
                            )}
                          </p>

                          <p>
                            Cortesia
                          </p>
                        </div>

                        <div className="bg-white/5 p-2 rounded-lg">
                          <p className="font-bold text-white">
                            {barbearia.detalhesAvaliacao.ambiente.toFixed(
                              1
                            )}
                          </p>

                          <p>
                            Ambiente
                          </p>
                        </div>

                        <div className="bg-white/5 p-2 rounded-lg">
                          <p className="font-bold text-white">
                            {barbearia.detalhesAvaliacao.higiene.toFixed(
                              1
                            )}
                          </p>

                          <p>
                            Higiene
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          alert(
                            `Abrindo checkout da filial ${barbearia.nome}`
                          );
                        }}
                        className="w-full bg-[#a3e635] text-black font-bold py-2.5 rounded-xl text-xs tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                      >
                        AGENDAMENTO
                        EXPRESSO
                      </button>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </aside>
    </main>
  );
}