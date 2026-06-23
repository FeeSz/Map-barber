export interface RouteData {
  feature: GeoJSON.Feature<GeoJSON.LineString>;
  durations: {
    car: number; // segundos
    walk: number; // segundos
    transit: number; // segundos
  };
}

export async function fetchRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<RouteData | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    // Verificação de segurança: checar se a geometria existe
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) {
      return null;
    }

    const route = data.routes[0];
    const distKm = route.distance / 1000;

    return {
      feature: {
        type: 'Feature',
        properties: { distance: route.distance },
        geometry: route.geometry as GeoJSON.LineString
      },
      durations: {
        car: route.duration, // Tempo real da OSRM para carro
        walk: (distKm / 5) * 3600, // Velocidade média de 5km/h
        transit: (distKm / 20) * 3600 + 600, // Média 20km/h + 10min de espera/troca
      }
    };
  } catch (error) {
    console.error('Erro na rota:', error);
    return null;
  }
}