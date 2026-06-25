"use client";

import { Search } from "lucide-react";

// Componentes do shadcn/ui
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SearchBarProps {
  busca: string;
  setBusca: (valor: string) => void;
  userProfilePic: string;
}

export default function SearchBar({ busca, setBusca, userProfilePic }: SearchBarProps) {
  return (
    // Mantemos as classes originais para preservar seu posicionamento CSS global
    <div className="top-search-wrapper flex items-center gap-4">
      <div className="floating-search relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          type="text"
          placeholder="Buscar por filiais, serviços..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10 bg-[#0f0f0f]/90 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#a3e635] focus-visible:border-[#a3e635] backdrop-blur-md rounded-xl h-12 shadow-lg"
        />
      </div>
      
      <div className="profile-pic-container shrink-0">
        <Avatar className="h-12 w-12 border border-white/10 shadow-lg">
          <AvatarImage 
            src={userProfilePic} 
            alt="Perfil do Usuário" 
            className="object-cover"
          />
          {/* Fallback elegante exibido enquanto a foto carrega ou se der erro */}
          <AvatarFallback className="bg-white/5 text-white/60 text-sm font-medium">
            BD
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}