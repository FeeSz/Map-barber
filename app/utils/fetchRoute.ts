interface OSRMResponse {
  code: string;
  routes: Array<{
    geometry: GeoJSON.LineString;
    duration: number;
    distance: number;
  }>;
}

export async function fetchRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<GeoJSON.Feature<GeoJSON.LineString> | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data: OSRMResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('Rota não pôde ser calculada.');
    }

    return {
      type: 'Feature',
      properties: {
        distance: data.routes[0].distance,
        duration: data.routes[0].duration
      },
      geometry: data.routes[0].geometry
    };
  } catch (error) {
    console.error('[MapLibre Routing Error]', error);
    return null;
  }
}