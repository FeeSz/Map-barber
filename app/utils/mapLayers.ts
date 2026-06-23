import maplibregl from 'maplibre-gl';

export const initRouteLayers = (map: maplibregl.Map) => {
  // MapLibre v5: Verificação estrita antes de tentar adicionar
  if (map.getSource('route')) return;

  map.addSource('route', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  // Layer da borda branca adicionada ANTES da linha principal
  map.addLayer({
    id: 'route-line-border',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#ffffff',
      'line-width': 7
    }
  });

  // Layer da linha da rota
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#a3e635', // lime-400
      'line-width': 4
    }
  });
};

export const initUserLocationLayers = (map: maplibregl.Map) => {
  if (map.getSource('user-location')) return;

  map.addSource('user-location', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  // Pulso expansivo
  map.addLayer({
    id: 'user-location-pulse',
    type: 'circle',
    source: 'user-location',
    paint: {
      'circle-radius': 10,
      'circle-color': '#a3e635',
      'circle-opacity': 0.4,
      'circle-stroke-width': 0
    }
  });

  // Ponto central sólido
  map.addLayer({
    id: 'user-location-core',
    type: 'circle',
    source: 'user-location',
    paint: {
      'circle-radius': 10,
      'circle-color': '#a3e635',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#ffffff'
    }
  });

  // Loop de animação via API Paint Property
  const duration = 2000;
  let start: number | null = null;
  let animationFrameId: number;

  function animatePulse(timestamp: number) {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / duration;
    const loopProgress = progress % 1;

    // Crescimento de 10px para 28px
    const radius = 10 + (18 * loopProgress);
    // Opacidade de 0.4 decaindo para 0
    const opacity = 0.4 * (1 - loopProgress);

    if (map.getLayer('user-location-pulse')) {
      map.setPaintProperty('user-location-pulse', 'circle-radius', radius);
      map.setPaintProperty('user-location-pulse', 'circle-opacity', opacity);
    }

    animationFrameId = requestAnimationFrame(animatePulse);
  }

  animationFrameId = requestAnimationFrame(animatePulse);

  // Tratamento nativo para limpeza de memória caso o contexto seja perdido
  map.getCanvas().addEventListener('webglcontextlost', () => {
    cancelAnimationFrame(animationFrameId);
    map.remove();
  });
};