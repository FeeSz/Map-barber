"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Barbearia } from "@/utils/barbeariasData";

interface RightSidebarProps {
  barbearia: Barbearia | null;
  routeEtas: { car: number; walk: number; transit: number } | null;
  limparRota: () => void;
}

export default function RightSidebar({ barbearia, routeEtas, limparRota }: RightSidebarProps) {
  return (
    <AnimatePresence>
      {barbearia && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 25 }}
          className="absolute top-0 right-0 w-full md:w-[420px] h-screen glass-panel z-50 flex flex-col"
        >
          {/* BANNER DA BARBEARIA */}
          <div className="relative h-48 w-full bg-[#1a1a1a]">
            <img 
              src={barbearia.logoUrl} 
              alt={barbearia.nome} 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            
            <button 
              onClick={limparRota}
              className="absolute top-6 right-6 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white border border-white/10 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="px-6 -mt-10 relative z-10 flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-4">
               <img src={barbearia.logoUrl} alt="Logo" className="w-20 h-20 rounded-2xl border-4 border-[#0a0a0a] shadow-xl object-cover" />
               <div className="bg-[#a3e635]/10 border border-[#a3e635]/30 px-3 py-1 rounded-lg">
                  <span className="text-[#a3e635] font-black text-lg">★ {barbearia.avaliacao.toFixed(1)}</span>
               </div>
            </div>

            <h2 className="text-2xl font-black text-white leading-tight">{barbearia.nome}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-white/60 bg-white/5 px-2 py-1 rounded border border-white/5">{barbearia.distancia}</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${barbearia.statusOcupacao === "lotado" ? "bg-red-500" : barbearia.statusOcupacao === "moderado" ? "bg-yellow-500" : "bg-green-500"}`} />
                <span className="text-white/80 capitalize">{barbearia.statusOcupacao} ({barbearia.porcentagemOcupacao}%)</span>
              </div>
            </div>

            {/* SEÇÃO DE ROTAS (PERFORMANCE VISUAL) */}
            <div className="mt-8">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Tempo de Chegada</h3>
              {routeEtas ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1">
                    <span className="text-white font-bold text-sm">{Math.ceil(routeEtas.car / 60)} min</span>
                    <span className="text-[10px] text-white/40 uppercase">Carro</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1">
                    <span className="text-white font-bold text-sm">{Math.ceil(routeEtas.transit / 60)} min</span>
                    <span className="text-[10px] text-white/40 uppercase">Transporte</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1">
                    <span className="text-white font-bold text-sm">{Math.ceil(routeEtas.walk / 60)} min</span>
                    <span className="text-[10px] text-white/40 uppercase">A pé</span>
                  </div>
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
                   <span className="text-xs text-white/50">Traçando rota orbital...</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex-1">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Métricas da Unidade</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                    <span className="text-sm text-white/70">Atendimento</span>
                    <span className="text-white font-bold">{barbearia.detalhesAvaliacao.atendimento.toFixed(1)}</span>
                 </div>
                 <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                    <span className="text-sm text-white/70">Ambiente</span>
                    <span className="text-white font-bold">{barbearia.detalhesAvaliacao.ambiente.toFixed(1)}</span>
                 </div>
                 <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                    <span className="text-sm text-white/70">Higiene</span>
                    <span className="text-white font-bold">{barbearia.detalhesAvaliacao.higiene.toFixed(1)}</span>
                 </div>
              </div>
            </div>

            {/* CALL TO ACTION */}
            <div className="pt-6 pb-8 mt-auto">
              <button
                onClick={() => window.open(`https://reguamaxima.com/${barbearia.id}`, '_blank')}
                className="w-full bg-[#a3e635] text-black font-black text-sm py-4 rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-wide cursor-pointer"
              >
                Agendar no Régua Máxima
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}