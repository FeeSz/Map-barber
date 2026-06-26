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
  
  // ⚡ OTIMIZAÇÃO SÉNIOR UX/UI: 
  // snapPoints em 0.15 (Recolhido) e 0.55 (Aberto pela metade). 
  // Nunca abrimos a 100% para não tapar o mapa e a rota.
  const snapPoints = [0.15, 0.55];
  const [snap, setSnap] = React.useState<number | string | null>(0.15);

  const getDynamicTitle = () => {
    if (filtroTag === "Abertas") return "Unidades Abertas";
    if (filtroTag === "Premium") return "Unidades Premium";
    if (filtroTag === "Mais Próximas") return "Mais próximas";
    return "Explorar Barbearias";
  };

  return (
    <DrawerPrimitive.Root
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      open={true}
      dismissible={false} // Não pode ser fechado por arrasto para baixo, ele trava no 0.15
      modal={false}       // Modal=false IMPEDE a criação de Overlay escuro no fundo (Ganha MUITA fluidez)
    >
      <DrawerPrimitive.Portal>
        {/* Container da Gaveta Flutuante Limitada */}
        <DrawerPrimitive.Content className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col h-[55vh] max-h-[55vh] bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-all duration-300">
          
          {/* Header e Puxador */}
          <div className="flex-none p-4 pb-2 w-full flex flex-col items-center cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4" />
            <div className="w-full flex justify-between items-center px-2">
               <h2 className="text-xl font-black text-white tracking-tight">
                {getDynamicTitle()}
              </h2>
              {/* Quantidade para feedback visual */}
              <span className="text-xs font-bold text-[#a3e635] bg-[#a3e635]/10 px-2 py-1 rounded-md">
                {filiaisFiltradas.length} locais
              </span>
            </div>
          </div>

          {/* Botões de Filtro Horizontal */}
          <div className="flex-none px-6 pb-4">
            <div className="flex gap-2 overflow-x-auto modern-scrollbar pb-2">
              {["Abertas", "Premium", "Mais Próximas"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFiltroTag(filtroTag === tag ? null : tag)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border whitespace-nowrap shrink-0 ${
                    filtroTag === tag 
                      ? "bg-[#a3e635] text-black border-[#a3e635]" 
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Barbearias - Apenas rolável internamente */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 modern-scrollbar">
            <div className="flex flex-col gap-3">
              {filiaisFiltradas.map((barbearia) => {
                const isRouteActive = rotaAtivaId === barbearia.id;
                const displayDistance = barbearia.distanciaRealKm 
                  ? `${barbearia.distanciaRealKm.toFixed(1)} km` 
                  : barbearia.distancia;
                
                return (
                  <div
                    key={barbearia.id}
                    onClick={() => {
                      handleSelecionarUnidade(barbearia);
                      setSnap(0.15); // Auto-recolhe a gaveta ao clicar para ver a rota!
                    }}
                    className={`p-3 rounded-2xl transition-all duration-200 border cursor-pointer relative overflow-hidden flex items-center gap-4 ${
                      isRouteActive ? 'border-[#a3e635] bg-[#1a1a1a]' : 'border-white/5 bg-white/5 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {isRouteActive && <div className="absolute left-0 top-0 h-full w-1 bg-[#a3e635]" />}
                    
                    <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-black/50 border border-white/10">
                      <img src={barbearia.logoUrl} alt={barbearia.nome} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate">{barbearia.nome}</h3>
                      <div className="flex items-center gap-3 text-[11px] mt-1.5 font-medium">
                        <span className="text-white/50">{displayDistance}</span>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase rounded-lg shrink-0">
                      Ver Rota
                    </button>
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