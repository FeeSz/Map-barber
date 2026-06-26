"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { MapPin, Car, Footprints, Train, Star } from "lucide-react";
import { Barbearia } from "@/utils/barbeariasData";

interface MobileDetailsDrawerProps {
  barbearia: Barbearia | null;
  routeEtas: { car: number; walk: number; transit: number } | null;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function MobileDetailsDrawer({
  barbearia,
  routeEtas,
  onClose,
}: MobileDetailsDrawerProps) {
  const isOpen = !!barbearia;

  if (!barbearia) return null;

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      snapPoints={[0.4, 0.85]}
      activeSnapPoint={0.4}
      dismissible={true}
      modal={false}
    >
      <DrawerPrimitive.Portal>
        {/* ⚡ CORREÇÃO: Adicionado h-[85vh] obrigatório para o snapPoint 0.85 funcionar */}
        <DrawerPrimitive.Content 
          className="
            fixed bottom-0 left-0 right-0 z-[70] flex flex-col outline-none
            md:mx-auto md:max-w-md
            h-[85vh] max-h-[85vh]
            bg-black/35 backdrop-blur-[50px] saturate-[2]
            border-t border-white/20 rounded-t-[42px]
            shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),_0_-20px_50px_rgba(0,0,0,0.6)]
          "
        >
          {/* Puxador da Gaveta (Handle) */}
          <div className="mx-auto mt-4 mb-2 h-1.5 w-14 rounded-full bg-white/30 backdrop-blur-md shadow-inner shrink-0" />

          {/* Área Rolável de Conteúdo */}
          <div className="flex-1 overflow-y-auto modern-scrollbar px-6 pb-6 pt-2">
            
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                  {barbearia.nome}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#a3e635] text-sm font-bold flex items-center gap-1 drop-shadow-md">
                    <Star className="w-4 h-4 fill-current" /> {barbearia.avaliacao.toFixed(1)}
                  </span>
                  <span className="text-white/60 text-xs text-shadow-sm">• Premium</span>
                </div>
              </div>
              <div className="w-16 h-16 shrink-0 rounded-[20px] overflow-hidden bg-black/20 border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                <img src={barbearia.logoUrl} alt={barbearia.nome} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="p-3.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-start gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <MapPin className="w-5 h-5 mt-0.5 text-[#a3e635] shrink-0" />
                <span className="text-white/90 text-sm font-medium leading-relaxed">
                  {(barbearia as any).endereco || "Endereço da unidade indisponível"}
                </span>
              </div>
            </div>

            {/* Grid de Transporte com 3 colunas (Incluindo Metrô/Trem) */}
            {routeEtas && (
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center gap-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  <Car className="w-5 h-5 text-white/70" strokeWidth={1.5} />
                  <span className="text-white text-sm font-bold leading-tight text-center">
                    {formatDuration(routeEtas.car)}
                  </span>
                  <span className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">Carro</span>
                </div>
                
                <div className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center gap-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  <Footprints className="w-5 h-5 text-white/70" strokeWidth={1.5} />
                  <span className="text-white text-sm font-bold leading-tight text-center">
                    {formatDuration(routeEtas.walk)}
                  </span>
                  <span className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">A pé</span>
                </div>

                <div className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center gap-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  <Train className="w-5 h-5 text-white/70" strokeWidth={1.5} />
                  <span className="text-white text-sm font-bold leading-tight text-center">
                    {formatDuration(routeEtas.transit)}
                  </span>
                  <span className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">Metrô</span>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col gap-3">
              <button className="w-full cursor-pointer py-4 rounded-[20px] bg-[#a3e635]/90 backdrop-blur-lg border border-[#a3e635] text-black font-extrabold text-base tracking-wide transition-all duration-200 active:scale-95 shadow-[0_8px_20px_rgba(163,230,53,0.3)]">
                Agendar Horário
              </button>
              <button
                onClick={onClose}
                className="w-full cursor-pointer py-3.5 rounded-[20px] bg-white/5 backdrop-blur-md border border-white/10 text-white/80 font-semibold text-sm transition-all duration-200 active:scale-95 hover:bg-white/10"
              >
                Limpar Rota
              </button>
            </div>

          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}