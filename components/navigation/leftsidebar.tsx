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

  return (
    <>
      {/* BOTÃO HAMBÚRGUER (Aparece quando a sidebar está fechada) */}
      <motion.button
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: isOpen ? 0 : 1, x: isOpen ? -50 : 20 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsOpen(true)}
        className="absolute top-6 left-0 z-40 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer"
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
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
        {/* HEADER & DRAG HANDLE */}
        <div 
          className="pt-6 px-6 pb-4 cursor-grab active:cursor-grabbing flex items-center justify-between"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">RÉGUA<span className="text-[#a3e635]">MÁXIMA</span></h1>
            <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Explorar Unidades</p>
          </div>
          {/* Ícone de arraste para indicar affordance */}
          <div className="w-8 h-8 flex flex-col gap-1 items-center justify-center opacity-30">
             <div className="w-1 h-1 bg-white rounded-full" /><div className="w-1 h-1 bg-white rounded-full" /><div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>

        {/* BUSCA E FILTROS */}
        <div className="px-6 pb-4 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Buscar barbearia..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-[#a3e635] transition-colors"
          />
          
          <div className="flex gap-2">
            <select 
              className="bg-white/5 border border-white/10 text-white/80 text-xs rounded-xl px-3 py-2 outline-none flex-1 focus:border-[#a3e635]"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {ESTADOS_BR.map(uf => <option key={uf} value={uf} className="bg-[#0f0f0f]">{uf === "Todos" ? "Todos" : uf}</option>)}
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto modern-scrollbar pb-2">
            {["Abertas", "Premium", "Mais Próximas"].map((tag) => (
              <button
                key={tag}
                onClick={() => setFiltroTag(filtroTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
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
                  className={`p-4 rounded-2xl transition-all duration-300 border cursor-pointer group ${
                    isRouteActive ? 'border-[#a3e635] bg-white/10' : 'border-white/5 bg-[#121212]/50 hover:bg-white/5 hover:border-white/20'
                  }`}
                  onClick={() => handleSelecionarUnidade(barbearia)}
                >
                  {isRouteActive && <div className="absolute left-0 top-1/4 h-1/2 w-1 bg-[#a3e635] rounded-r-md" />}
                  
                  <div className="flex items-center gap-3">
                    <img src={barbearia.logoUrl} alt={barbearia.nome} className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:scale-105 transition-transform" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm line-clamp-1">{barbearia.nome}</h3>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <span className="text-white/50">{barbearia.distancia}</span>
                        <span className="text-[#a3e635] font-bold">★ {barbearia.avaliacao.toFixed(1)}</span>
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