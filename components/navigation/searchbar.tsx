"use client";

interface SearchBarProps {
  busca: string;
  setBusca: (valor: string) => void;
  userProfilePic: string;
}

export default function SearchBar({ busca, setBusca, userProfilePic }: SearchBarProps) {
  return (
    // Restauração da classe original para manter o posicionamento do seu CSS
    <div className="top-search-wrapper">
      <div className="floating-search">
        <input
          type="text"
          placeholder="Buscar por filiais, serviços..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      <div className="profile-pic-container">
        <img 
          src={userProfilePic} 
          alt="Perfil do Usuário" 
          className="user-profile-pic"
        />
      </div>
    </div>
  );
}