interface MarkerProps {
  logoUrl: string;
  nome: string;
  isActive: boolean;
}

export function BarberMarker({ logoUrl, nome, isActive }: MarkerProps) {
  return (
    <div className={`premium-marker ${isActive ? "marker-active" : ""}`}>
      {/* Aura de pulso tecnológica na base */}
      <div className="pulse-glow" />
      
      {/* Container Squircle estilo iOS com a logo real */}
      <div className="marker-logo-container">
        <img 
          src={logoUrl} 
          alt={nome} 
          className="w-full h-full object-cover select-none pointer-events-none" 
        />
      </div>
    </div>
  );
}
