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
          className="absolute top-0 right-0 w-full md:w-[420px] h-screen glass-panel z-50 flex flex-col bg-[#0f0f0f] overflow-hidden"
        >
          {/* CONTEÚDO PRINCIPAL (Rolável) */}
          <div className="flex-1 overflow-y-auto modern-scrollbar pb-32">
            
            {/* BANNER DA BARBEARIA (Agora dentro do scroll para a foto sobrepor corretamente) */}
            <div className="relative h-44 w-full shrink-0">
              <img 
                src={barbearia.logoUrl} 
                alt={barbearia.nome} 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-black/60" />
              
              <button 
                onClick={limparRota}
                className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white/80 hover:text-white border border-white/10 hover:bg-white/10 cursor-pointer transition-all hover:scale-105 active:scale-95 z-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* CORPO DE INFORMAÇÕES */}
            <div className="px-6 -mt-12 relative z-20 flex flex-col">
              
              {/* Foto de Perfil sobreposta ao Header */}
              <div className="flex justify-between items-end mb-4">
                 <img 
                   src={barbearia.logoUrl} 
                   alt="Logo" 
                   className="w-24 h-24 rounded-2xl border-4 border-[#0f0f0f] bg-[#0f0f0f] shadow-2xl object-cover" 
                 />
                 <div className="bg-[#a3e635]/10 border border-[#a3e635]/30 px-3 py-1.5 rounded-lg backdrop-blur-sm mb-2">
                    <span className="text-[#a3e635] font-black text-lg">★ {barbearia.avaliacao.toFixed(1)}</span>
                 </div>
              </div>

              <h2 className="text-2xl font-black text-white leading-tight">{barbearia.nome}</h2>
              <div className="flex items-center gap-3 mt-3 text-sm">
                <span className="text-white/80 bg-white/10 px-2.5 py-1 rounded-md font-medium border border-white/5 shadow-sm">{barbearia.distancia}</span>
                <div className="flex items-center gap-1.5 bg-[#121212] px-2.5 py-1 rounded-md border border-white/5">
                  <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${barbearia.statusOcupacao === "lotado" ? "bg-red-500 text-red-500" : barbearia.statusOcupacao === "moderado" ? "bg-yellow-500 text-yellow-500" : "bg-green-500 text-green-500"}`} />
                  <span className="text-white/70 capitalize text-xs font-bold">{barbearia.statusOcupacao} ({barbearia.porcentagemOcupacao}%)</span>
                </div>
              </div>

              {/* SEÇÃO 1: TEMPO DE CHEGADA */}
              <div className="mt-8">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Tempo de Chegada</h3>
                {routeEtas ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-inner">
                      <span className="text-white font-black text-sm">{Math.ceil(routeEtas.car / 60)} min</span>
                      <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Carro</span>
                    </div>
                    <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-inner text-center">
                      <span className="text-white font-black text-sm">{Math.ceil(routeEtas.transit / 60)} min</span>
                      <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Metrô/Ônibus</span>
                    </div>
                    <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-inner">
                      <span className="text-white font-black text-sm">{Math.ceil(routeEtas.walk / 60)} min</span>
                      <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">A pé</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[68px] flex items-center justify-center bg-[#121212] rounded-xl border border-white/5 overflow-hidden relative shadow-inner">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
                     <span className="text-xs text-white/50 font-medium">Calculando trajetória...</span>
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: MÉTRICAS DA UNIDADE (Agora em grid lado a lado) */}
              <div className="mt-8">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Métricas da Unidade</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5 shadow-inner">
                    <span className="text-white font-black text-lg">{barbearia.detalhesAvaliacao.atendimento.toFixed(1)}</span>
                    <span className="text-[9px] text-white/50 uppercase font-bold tracking-widest mt-1">Serviço</span>
                  </div>
                  <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5 shadow-inner">
                    <span className="text-white font-black text-lg">{barbearia.detalhesAvaliacao.ambiente.toFixed(1)}</span>
                    <span className="text-[9px] text-white/50 uppercase font-bold tracking-widest mt-1">Ambiente</span>
                  </div>
                  <div className="bg-[#121212] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-0.5 shadow-inner">
                    <span className="text-white font-black text-lg">{barbearia.detalhesAvaliacao.higiene.toFixed(1)}</span>
                    <span className="text-[9px] text-white/50 uppercase font-bold tracking-widest mt-1">Higiene</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* BOTÃO FIXO (Absolute no bottom da sidebar, não importa o tamanho da tela) */}
          <div className="absolute bottom-0 left-0 w-full p-6 pt-16 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f] to-transparent z-30 pointer-events-none">
            <button
              onClick={() => window.open(`https://reguamaxima.com/${barbearia.id}`, '_blank')}
              className="w-full bg-[#a3e635] text-black font-black text-[15px] py-4 rounded-xl shadow-[0_4px_30px_rgba(163,230,53,0.4)] hover:shadow-[0_4px_40px_rgba(163,230,53,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-widest pointer-events-auto cursor-pointer"
            >
              Agendar Unidade
            </button>
          </div>

        </motion.aside>
      )}
    </AnimatePresence>
  );
}