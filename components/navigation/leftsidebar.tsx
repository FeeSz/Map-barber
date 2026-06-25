"use client";

import { motion, useDragControls } from "framer-motion";
import { useState } from "react";
import { Barbearia } from "@/utils/barbeariasData";

const ESTADOS_BR = [
  "Todos", "SP", "RJ", "MG", "ES", "PR", "SC", "RS", 
  "MS", "MT", "GO", "DF", "BA", "PE", "CE", "RN", "PB", 
  "AL", "SE", "MA", "PI", "AM", "PA", "AC", "RR", "RO", "AP"
];

interface LeftSidebarProps {
  filiaisFiltradas: Barbearia[];
  busca: string;
  setBusca: (v: string) => void;
  filtroTag: string | null;
  setFiltroTag: (v: string | null) => void;
  filtroEstado: string;
  setFiltroEstado: (v: string) => void;
  handleSelecionarUnidade: (b: Barbearia) => void;
  rotaAtivaId: string | null;
}

export default function LeftSidebar({
  filiaisFiltradas, busca, setBusca, filtroTag, setFiltroTag, filtroEstado, setFiltroEstado, handleSelecionarUnidade, rotaAtivaId
}: LeftSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const dragControls = useDragControls();

  const handleIrParaHome = () => {
    // TODO: Definir e integrar a rota de retorno ao site Régua Máxima.
    // Exemplo: router.push('/home') ou window.location.href = 'https://reguamaxima.com';
    alert("Funcionalidade em aberto: Redirecionar para o site Régua Máxima.");
  };

  return (
    <>
      {/* BOTÃO HAMBÚRGUER (Aparece quando a sidebar está fechada) */}
      <motion.button
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: isOpen ? 0 : 1, x: isOpen ? -50 : 24 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsOpen(true)}
        className="absolute top-6 left-0 z-40 bg-[#121212]/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-[#a3e635]/50 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer"
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
        title="Abrir Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </motion.button>

      {/* BOTÃO HOME FLUTUANTE (Aparece abaixo do hambúrguer quando a sidebar está fechada) */}
      <motion.button
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: isOpen ? 0 : 1, x: isOpen ? -50 : 24 }}
        transition={{ duration: 0.3, delay: 0.05 }} // Efeito cascata suave após o hambúrguer
        onClick={handleIrParaHome}
        className="absolute top-[92px] left-0 z-40 bg-[#121212]/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-[#a3e635]/50 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer"
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
        title="Voltar para a Home"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </motion.button>
        
      {/* PAINEL ARRASTÁVEL */}
      <motion.aside
        drag="x"
        dragControls={dragControls}
        dragConstraints={{ left: -400, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100 || info.velocity.x < -200) setIsOpen(false);
          else setIsOpen(true);
        }}
        animate={{ x: isOpen ? 0 : -420 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="absolute top-0 left-0 w-full md:w-[400px] h-screen glass-panel z-50 flex flex-col"
      >
        {/* HEADER */}
        <div 
          className="pt-8 px-6 pb-6 cursor-grab active:cursor-grabbing flex items-center justify-between shrink-0"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">RÉGUA<span className="text-[#a3e635]">MÁXIMA</span></h1>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Explorar Unidades</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* BOTÃO HOME INTERNO (Para navegação com a sidebar aberta) */}
            <button 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={handleIrParaHome}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Voltar para a Home"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </button>

            {/* SETA DE FECHAR */}
            <button 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Recolher Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* BUSCA E FILTROS */}
        <div className="px-6 pb-4 flex flex-col gap-4 shrink-0">
          <input
            type="text"
            placeholder="Buscar barbearia..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#a3e635] shadow-inner transition-colors"
          />
          
          {/* SELECT DE ESTADOS REESTILIZADO (Customizado) */}
          <div className="relative w-full">
            <select 
              className="w-full appearance-none bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl pl-4 pr-10 py-3 outline-none focus:border-[#a3e635] transition-all cursor-pointer shadow-sm"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {ESTADOS_BR.map(uf => (
                <option key={uf} value={uf} className="bg-[#121212] text-white">
                  {uf === "Todos" ? "Todos os Estados" : `Estado: ${uf}`}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>

          {/* TAGS */}
          <div className="flex gap-2 overflow-x-auto modern-scrollbar pb-2">
            {["Abertas", "Premium", "Mais Próximas"].map((tag) => (
              <button
                key={tag}
                onClick={() => setFiltroTag(filtroTag === tag ? null : tag)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                  filtroTag === tag ? "bg-[#a3e635] text-black border-[#a3e635]" : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* LISTA SCROLLYTELLING */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 modern-scrollbar">
          <div className="flex flex-col gap-3">
            {filiaisFiltradas.map((barbearia) => {
              const isRouteActive = rotaAtivaId === barbearia.id;
              
              return (
                <div
                  key={barbearia.id}
                  className={`p-4 rounded-2xl transition-all duration-300 border cursor-pointer group relative overflow-hidden ${
                    isRouteActive ? 'border-[#a3e635] bg-[#1a1a1a]' : 'border-white/5 bg-[#121212]/60 hover:bg-[#1a1a1a] hover:border-white/20'
                  }`}
                  onClick={() => handleSelecionarUnidade(barbearia)}
                >
                  {isRouteActive && <div className="absolute left-0 top-0 h-full w-1.5 bg-[#a3e635] shadow-[0_0_10px_#a3e635]" />}
                  
                  <div className="flex items-center gap-4">
                    <img src={barbearia.logoUrl} alt={barbearia.nome} className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm line-clamp-1">{barbearia.nome}</h3>
                      <div className="flex items-center gap-3 text-xs mt-1.5">
                        <span className="text-white/50">{barbearia.distancia}</span>
                        <span className="flex items-center gap-1 text-[#a3e635] font-bold bg-[#a3e635]/10 px-2 py-0.5 rounded-md">
                          ★ {barbearia.avaliacao.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.aside>
    </>
  );
}