"use client";

import { motion, DragControls } from "framer-motion";
// Ajuste o caminho da interface conforme a sua pasta
import { Barbearia } from "@/utils/barbeariasData"; 

const ESTADOS_BR = [
  "Todos", "SP", "RJ", "MG", "ES", "PR", "SC", "RS", 
  "MS", "MT", "GO", "DF", "BA", "PE", "CE", "RN", "PB", 
  "AL", "SE", "MA", "PI", "AM", "PA", "AC", "RR", "RO", "AP"
];

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (valor: boolean) => void;
  dragControls: DragControls;
  filiaisFiltradas: Barbearia[];
  filtroTag: string | null;
  setFiltroTag: (valor: string | null) => void;
  filtroEstado: string;
  setFiltroEstado: (valor: string) => void;
  rotaAtivaId: string | null;
  filialAtiva: string | null;
  routeEtas: { car: number; walk: number; transit: number } | null;
  handleSelecionarUnidade: (barbearia: Barbearia) => void;
  limparRota: () => void;
}

export default function Sidebar({
  isExpanded,
  setIsExpanded,
  dragControls,
  filiaisFiltradas,
  filtroTag,
  setFiltroTag,
  filtroEstado,
  setFiltroEstado,
  rotaAtivaId,
  filialAtiva,
  routeEtas,
  handleSelecionarUnidade,
  limparRota
}: SidebarProps) {
  return (
    <motion.aside
      // Restauração da classe map-sidebar original + background fixo escuro
      // Os overrides (md:!) impedem a animação do mobile de achatar a sidebar no Desktop
      className="map-sidebar bg-[#0f0f0f] md:!h-screen md:!top-0 md:!bottom-auto md:!transform-none"
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(event, info) => {
        const offset = info.offset.y;
        const velocity = info.velocity.y;
        if (offset < -15 || velocity < -150) setIsExpanded(true);
        else if (offset > 15 || velocity > 150) setIsExpanded(false);
      }}
      animate={{
        height: isExpanded ? "85vh" : "28vh",
      }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
    >
      <div 
        className="flex flex-col flex-shrink-0 cursor-grab active:cursor-grabbing w-full"
        onPointerDown={(e) => dragControls.start(e)}
        style={{ touchAction: "none" }}
      >
        <div className="mobile-sheet-handle-area md:hidden" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="mobile-sheet-handle" />
        </div>

        <div className="sidebar-header">
          <div className="hidden md:block">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors cursor-pointer mb-5 text-sm font-medium tracking-wide select-none group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-translate-x-0.5 transition-transform">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Voltar
            </button>

            <h1 className="map-title">Nossas Filiais</h1>
            <p className="map-subtitle">Encontre a unidade ideal para seu atendimento</p>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{filiaisFiltradas.length}</div>
                <div className="stat-label">Filiais</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {filiaisFiltradas.length > 0 
                    ? (filiaisFiltradas.reduce((acc, item) => acc + item.avaliacao, 0) / filiaisFiltradas.length).toFixed(1)
                    : "0.0"}
                </div>
                <div className="stat-label">Avaliação</div>
              </div>
            </div>
          </div>
        </div>

        <div className="filter-container">
          {/* O novo Select de Estados inserido na estrutura original */}
          <div className="mb-3 px-4 md:px-0" onPointerDown={(e) => e.stopPropagation()}>
            <select 
              className="w-full bg-white/5 border border-white/10 text-white/90 text-sm rounded-xl px-4 py-2 outline-none appearance-none focus:border-[#a3e635] transition-colors"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {ESTADOS_BR.map(uf => (
                <option key={uf} value={uf} className="bg-[#0f0f0f]">
                  {uf === "Todos" ? "Todos os Estados" : uf}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-row flex gap-2 overflow-x-auto no-scrollbar" onPointerDown={(e) => e.stopPropagation()}>
            {["Abertas", "Mais Próximas", "Premium"].map((tag) => (
              <button
                key={tag}
                onClick={() => setFiltroTag(filtroTag === tag ? null : tag)}
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
      </div>

      <div 
        className="branch-list"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).classList.contains('branch-list')) {
            dragControls.start(e);
          }
        }}
      >
        {rotaAtivaId && (
          <div className="mb-2">
            <button 
              onClick={limparRota}
              className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all cursor-pointer"
            >
              ✕ Limpar rota ativa
            </button>
          </div>
        )}

        {filiaisFiltradas.map((barbearia) => {
          const isRouteActive = rotaAtivaId === barbearia.id;
          const isActive = filialAtiva === barbearia.id; 
          
          const highlightClass = isRouteActive 
              ? 'border-[#a3e635] shadow-[0_0_15px_rgba(163,230,53,0.15)] bg-white/10' 
              : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10';

          return (
            <div
              key={barbearia.id}
              className={`branch-card transition-all duration-300 border ${highlightClass}`}
              onClick={() => handleSelecionarUnidade(barbearia)}
            >
              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#a3e635] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ opacity: isRouteActive ? 1 : undefined }}></div>

              <div className="branch-header">
                <h3 className="branch-name">{barbearia.nome}</h3>
                <div className="branch-rating-badge">
                  <span>★</span>
                  {barbearia.avaliacao.toFixed(1)}
                </div>
              </div>

              <div className="branch-meta-row">
                <span className="branch-distance">{barbearia.distancia}</span>
                <div className="branch-live-occupancy">
                  <span className={`occupancy-dot ${barbearia.statusOcupacao === "lotado" ? "busy" : ""}`} />
                  <span>{barbearia.porcentagemOcupacao}% ocupado</span>
                </div>
              </div>

              {isActive && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  {routeEtas ? (
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-white/10">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
                        </svg>
                        <span className="text-white font-bold text-xs">{Math.ceil(routeEtas.car / 60)} min</span>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-white/10">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                          <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h6"/><circle cx="17" cy="18" r="2"/>
                        </svg>
                        <span className="text-white font-bold text-xs">{Math.ceil(routeEtas.transit / 60)} min</span>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-white/10">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                          <path d="M12 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/><path d="M11 21l-1-4-2-1V9c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v7l-2 1-1 4"/>
                        </svg>
                        <span className="text-white font-bold text-xs">{Math.ceil(routeEtas.walk / 60)} min</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-white/50 animate-pulse tracking-wider">Calculando melhor rota...</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-white/50 pt-1">
                    <p>Cortesia <strong className="text-white ml-1">{barbearia.detalhesAvaliacao.atendimento.toFixed(1)}</strong></p>
                    <p>Ambiente <strong className="text-white ml-1">{barbearia.detalhesAvaliacao.ambiente.toFixed(1)}</strong></p>
                    <p>Higiene <strong className="text-white ml-1">{barbearia.detalhesAvaliacao.higiene.toFixed(1)}</strong></p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Abrindo checkout da filial ${barbearia.nome}`);
                    }}
                    className="w-full mt-2 bg-[#a3e635] text-black font-bold py-3 rounded-xl text-xs tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_4px_14px_rgba(163,230,53,0.3)] cursor-pointer"
                  >
                    AGENDAR NESTA UNIDADE
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.aside>
  );
}