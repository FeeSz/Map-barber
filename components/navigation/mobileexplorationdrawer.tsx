"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Barbearia } from "@/utils/barbeariasData";

interface BarbeariaComDistancia extends Barbearia {
  distanciaRealKm?: number | null;
}

interface MobileExplorationDrawerProps {
  filiaisFiltradas: BarbeariaComDistancia[];
  filtroTag: string | null;
  setFiltroTag: (v: string | null) => void;
  handleSelecionarUnidade: (b: Barbearia) => void;
  rotaAtivaId: string | null;
}

export default function MobileExplorationDrawer({
  filiaisFiltradas,
  filtroTag,
  setFiltroTag,
  handleSelecionarUnidade,
  rotaAtivaId,
}: MobileExplorationDrawerProps) {
  const snapPoints = [0.25, 0.5, 0.92];
  const [snap, setSnap] = React.useState<number | string | null>(0.25);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const getDynamicTitle = () => {
    if (filtroTag === "Abertas") return "Unidades Abertas";
    if (filtroTag === "Premium") return "Unidades Premium";
    if (filtroTag === "Mais Próximas") return "Mais próximas de você";
    return "Mais próximas de você";
  };

  const handleCardClick = (barbearia: BarbeariaComDistancia) => {
    if (selectedId === barbearia.id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(barbearia.id);
    setSnap(0.92);
    handleSelecionarUnidade(barbearia);
  };

  const handleMoreInfo = (barbearia: BarbeariaComDistancia) => {
    // Navegação para página de detalhes
    // router.push(`/barbearia/${barbearia.id}`)
    console.log("Mais informações:", barbearia.nome);
  };

  return (
    <DrawerPrimitive.Root
      open={true}
      modal={false}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      dismissible={false}
    >
      <DrawerPrimitive.Portal>
        {/* SEM overlay — não queremos cobrir o mapa */}
        <DrawerPrimitive.Content
          className="
            md:hidden
            fixed bottom-0 left-0 right-0
            z-50
            flex flex-col
            bg-[#0f0f0f]/95
            backdrop-blur-2xl
            border border-white/10 border-b-0
            rounded-t-[28px]
            shadow-[0_-10px_60px_rgba(0,0,0,0.85)]
            focus:outline-none
          "
          style={{
            /* Altura máxima determinada pelo snap point 0.92 */
            height: "95vh",
          }}
        >
          {/* DRAG HANDLE */}
          <div className="mx-auto mt-3 mb-0 h-1.5 w-12 rounded-full bg-white/20 shrink-0" />

          {/* FILTROS */}
          <div className="px-5 pt-4 pb-3 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {["Abertas", "Premium", "Mais Próximas", "Fechadas"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFiltroTag(filtroTag === tag ? null : tag)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${
                    filtroTag === tag
                      ? "bg-[#a3e635] text-black border-[#a3e635] shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                      : "bg-white/5 text-white/70 border-white/10"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* TÍTULO DINÂMICO */}
          <div className="px-6 pb-3 shrink-0">
            <h2 className="text-xl font-black text-white tracking-tight">
              {getDynamicTitle()}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {filiaisFiltradas.length} unidade{filiaisFiltradas.length !== 1 ? "s" : ""} encontrada{filiaisFiltradas.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* LISTA — só scrollável, não arrasta o drawer */}
          <div
            className="flex-1 overflow-y-auto px-4 pb-10"
            style={{ scrollbarWidth: "none", overscrollBehavior: "contain" }}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3">
              {filiaisFiltradas.map((barbearia) => {
                const isRouteActive = rotaAtivaId === barbearia.id;
                const isSelected = selectedId === barbearia.id;

                const displayDistance = barbearia.distanciaRealKm
                  ? `${barbearia.distanciaRealKm.toFixed(1)} km`
                  : barbearia.distancia;

                return (
                  <div key={barbearia.id} className="flex flex-col">
                    {/* CARD */}
                    <div
                      className={`p-3 transition-all duration-300 border cursor-pointer relative overflow-hidden flex items-center gap-4 ${
                        isSelected || isRouteActive
                          ? "border-[#a3e635]/60 bg-[#1a1a1a] rounded-t-2xl rounded-b-none border-b-0"
                          : "border-white/5 bg-white/5 rounded-2xl hover:bg-[#1a1a1a] hover:border-white/10"
                      }`}
                      onClick={() => handleCardClick(barbearia)}
                    >
                      {(isSelected || isRouteActive) && (
                        <div className="absolute left-0 top-0 h-full w-1 bg-[#a3e635] rounded-l-2xl" />
                      )}

                      <img
                        src={barbearia.logoUrl}
                        alt={barbearia.nome}
                        className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm line-clamp-1">
                          {barbearia.nome}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] mt-1.5 font-medium">
                          <span className="text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                            ★ {barbearia.avaliacao.toFixed(1)}
                          </span>
                          <span className="text-white/50">{displayDistance}</span>
                          {barbearia.tags?.includes("Abertas") && (
                            <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-md">
                              Aberta
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg
                        className={`w-4 h-4 text-white/30 shrink-0 transition-transform duration-300 ${isSelected ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* PAINEL EXPANDIDO */}
                    {isSelected && (
                      <div className="border border-t-0 border-[#a3e635]/60 bg-[#151515] rounded-b-2xl px-4 pt-3 pb-4 flex flex-col gap-3">
                        {/* Endereço */}
                        <div className="flex items-start gap-2 text-white/50 text-xs">
                          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#a3e635]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="line-clamp-2">
                            {(barbearia as any).endereco ?? "Endereço não disponível"}
                          </span>
                        </div>

                        {/* Horário */}
                        {(barbearia as any).horario && (
                          <div className="flex items-center gap-2 text-white/50 text-xs">
                            <svg className="w-3.5 h-3.5 shrink-0 text-[#a3e635]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="10" />
                              <path strokeLinecap="round" d="M12 6v6l4 2" />
                            </svg>
                            <span>{(barbearia as any).horario}</span>
                          </div>
                        )}

                        <div className="h-px bg-white/5" />

                        {/* Botão principal */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoreInfo(barbearia); }}
                          className="w-full py-3 rounded-xl bg-[#a3e635] text-black font-bold text-sm tracking-wide transition-all duration-200 hover:bg-[#bef264] active:scale-[0.98] shadow-[0_0_20px_rgba(163,230,53,0.25)]"
                        >
                          Mais informações
                        </button>

                        {/* Botão secundário */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelecionarUnidade(barbearia); }}
                          className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/70 font-semibold text-sm transition-all duration-200 hover:bg-white/10 hover:text-white flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Traçar rota
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}