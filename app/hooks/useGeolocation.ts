"use client";

import { useState, useEffect, useRef } from 'react';

// Mock de toast (substitua pela sua biblioteca se desejar, ex: sonner ou react-hot-toast)
const toast = {
  info: (msg: string) => console.info(`[TOAST INFO] ${msg}`),
  error: (msg: string) => console.error(`[TOAST ERROR] ${msg}`)
};

export function useGeolocation() {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocalização não suportada no seu navegador.');
      return;
    }

    const hasPermission = localStorage.getItem('geo_permission');
    if (!hasPermission) {
      toast.info('Precisamos da sua localização para traçar a melhor rota até as unidades.');
      localStorage.setItem('geo_permission', 'requested');
    }

    setWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setError(null);
      },
      (err) => {
        let msg = '';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Permissão de localização negada. Ative no seu navegador.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Informação de localização indisponível no momento.';
            break;
          case err.TIMEOUT:
            msg = 'Tempo limite esgotado ao buscar sua localização.';
            break;
          default:
            msg = 'Erro desconhecido ao tentar buscar localização.';
        }
        setError(msg);
        toast.error(msg);
      },
      // CORREÇÃO AQUI: Aumentamos o timeout para 20 segundos (20000ms)
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 } 
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      setWatching(false);
    };
  }, []);

  return { coords, error, watching };
}