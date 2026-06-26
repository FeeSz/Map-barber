import { useState, useEffect } from 'react';

// Tipagem para as coordenadas
type Coords = [number, number];

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verifica se o navegador/dispositivo suporta GPS
    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada por este navegador.");
      return;
    }

    // Tenta observar a localização do usuário silenciosamente
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords([position.coords.longitude, position.coords.latitude]);
        setError(null); // Limpa erros antigos se conseguir ler
      },
      (err) => {
        // Se cair aqui no mobile testando localmente, é o bloqueio do HTTP
        console.warn("[GPS] Erro ou bloqueio:", err.message);
        
        if (err.code === err.PERMISSION_DENIED) {
          setError("Permissão negada. Clique no botão de GPS para autorizar.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Sinal de GPS indisponível no momento.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Desiste após 10 segundos
        maximumAge: 0   // Não usa cache antigo
      }
    );

    // Limpeza da memória ao desmontar
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { coords, error };
}