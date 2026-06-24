"use client";

import { motion, DragControls } from "framer-motion";
import { ArrowLeft, Car, Footprints, TrainFront, Star, X } from "lucide-react";
import { Barbearia } from "@/utils/barbeariasData"; 

// Componentes do shadcn/ui (certifique-se de tê-los instalados via CLI)
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  
  // Média de avaliação calculada de forma segura
  const mediaAvaliacao = filiaisFiltradas.length > 0 
    ? (filiaisFiltradas.reduce((acc, item) => acc + item.avaliacao, 0) / filiaisFiltradas.length).toFixed(1)
    : "0.0";

  return (
    <motion.aside
      className="map-sidebar bg-[#0f0f0f] text-white md:!h-screen md:!top-0 md:!bottom-auto md:!transform-none border-r border-white/5"
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
      {/* Área de arraste para Mobile */}
      <div 
        className="flex flex-col flex-shrink-0 cursor-grab active:cursor-grabbing w-full"
        onPointerDown={(e) => dragControls.start(e)}
        style={{ touchAction: "none" }}
      >
        <div className="mobile-sheet-handle-area md:hidden" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="mobile-sheet-handle bg-white/20 w-12 h-1.5 rounded-full mx-auto my-3" />
        </div>

        {/* Header da Sidebar */}
        <div className="sidebar-header p-4 pb-2 md:pt-6">
          <div className="hidden md:block">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white/80 hover:text-white hover:bg-white/5 gap-2 pl-0 mb-4 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Voltar
            </Button>

            <h1 className="text-xl font-bold tracking-tight">Nossas Filiais</h1>
            <p className="text-xs text-muted-foreground mt-1">Encontre a unidade ideal para seu atendimento</p>
            
            {/* Stats Grid usando utilitários do Tailwind */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-[#a3e635]">{filiaisFiltradas.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Filiais</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-[#a3e635] flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-current" /> {mediaAvaliacao}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Avaliação</div>
              </div>
            </div>
          </div>
        </div>

        {/* Container de Filtros */}
        <div className="filter-container p-4 pt-2 space-y-3">
          {/* Select customizado do Shadcn para Estados */}
          <div onPointerDown={(e) => e.stopPropagation()}>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white focus:ring-[#a3e635] focus:border-[#a3e635] rounded-xl h-10">
                <SelectValue placeholder="Selecione o Estado" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-white/10 text-white max-h-60">
                {ESTADOS_BR.map(uf => (
                  <SelectItem key={uf} value={uf} className="focus:bg-white/10 focus:text-white cursor-pointer">
                    {uf === "Todos" ? "Todos os Estados" : uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Badges de Tags para filtros rápidos */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1" onPointerDown={(e) => e.stopPropagation()}>
            {["Abertas", "Mais Próximas", "Premium"].map((tag) => {
              const isSelected = filtroTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setFiltroTag(isSelected ? null : tag)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#a3e635] text-black border-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                      : "bg-white/5 text-white/70 border-white/5 hover:bg-white/10"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de Unidades */}
      <div 
        className="branch-list px-4 pb-6 overflow-y-auto space-y-3 dynamic-calc-height"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).classList.contains('branch-list')) {
            dragControls.start(e);
          }
        }}
      >
        {rotaAtivaId && (
          <Button 
            variant="destructive"
            size="sm"
            onClick={limparRota}
            className="w-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl h-10 gap-2"
          >
            <X className="h-4 w-4" /> Limpar rota ativa
          </Button>
        )}

        {filiaisFiltradas.map((barbearia) => {
          const isRouteActive = rotaAtivaId === barbearia.id;
          const isActive = filialAtiva === barbearia.id; 
          
          return (
            <div
              key={barbearia.id}
              onClick={() => handleSelecionarUnidade(barbearia)}
              className={`relative branch-card p-4 rounded-xl transition-all duration-300 border cursor-pointer group ${
                isRouteActive 
                  ? 'border-[#a3e635] shadow-[0_0_15px_rgba(163,230,53,0.15)] bg-white/10' 
                  : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {/* Indicador lateral esquerdo para rotas ativas */}
              <div 
                className="absolute left-0 top-0 w-1 h-full bg-[#a3e635] rounded-l-xl transition-opacity duration-300" 
                style={{ opacity: isRouteActive ? 1 : 0 }}
              />

              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-sm tracking-wide text-white group-hover:text-[#a3e635] transition-colors">
                  {barbearia.nome}
                </h3>
                <Badge className="bg-white/10 text-white hover:bg-white/10 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {barbearia.avaliacao.toFixed(1)}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{barbearia.distancia}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${barbearia.statusOcupacao === "lotado" ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                  <span>{barbearia.porcentagemOcupacao}% ocupado</span>
                </div>
              </div>

              {/* Seção Expandida (Detalhes e Agendamento) */}
              {isActive && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                  {routeEtas ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-white/10">
                        <Car className="h-4 w-4 text-white/70" />
                        <span className="text-white font-bold text-[11px]">{Math.ceil(routeEtas.car / 60)} min</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-white/10">
                        <TrainFront className="h-4 w-4 text-white/70" />
                        <span className="text-white font-bold text-[11px]">{Math.ceil(routeEtas.transit / 60)} min</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-white/10">
                        <Footprints className="h-4 w-4 text-white/70" />
                        <span className="text-white font-bold text-[11px]">{Math.ceil(routeEtas.walk / 60)} min</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs text-white/50 animate-pulse tracking-wider">Calculando melhor rota...</span>
                    </div>
                  )}

                  {/* Sub-avaliações */}
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-white/50 bg-black/20 py-2 rounded-lg">
                    <p>Cortesia <strong className="text-white block text-xs mt-0.5">{barbearia.detalhesAvaliacao.atendimento.toFixed(1)}</strong></p>
                    <p>Ambiente <strong className="text-white block text-xs mt-0.5">{barbearia.detalhesAvaliacao.ambiente.toFixed(1)}</strong></p>
                    <p>Higiene <strong className="text-white block text-xs mt-0.5">{barbearia.detalhesAvaliacao.higiene.toFixed(1)}</strong></p>
                  </div>

                  {/* Botão Principal de Ação */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Abrindo checkout da filial ${barbearia.nome}`);
                    }}
                    className="w-full bg-[#a3e635] text-black font-bold hover:bg-[#b2f047] transition-all duration-300 shadow-[0_4px_14px_rgba(163,230,53,0.3)] rounded-xl text-xs tracking-wider"
                  >
                    AGENDAR NESTA UNIDADE
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.aside>
  );
}