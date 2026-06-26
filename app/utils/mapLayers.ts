import maplibregl from "maplibre-gl";

export const initRouteLayers = (map: maplibregl.Map) => {
  if (map.getSource("route")) return;

  map.addSource("route", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: "route-line-border",
    type: "line",
    source: "route",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#ffffff",
      "line-width": 7,
    },
  });

  map.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#a3e635",
      "line-width": 4,
    },
  });
};

export const initUserLocationLayers = (map: maplibregl.Map) => {
  if (!map.getSource("user-location")) {
    map.addSource("user-location", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });

    map.addLayer({
      id: "user-location-pulse",
      type: "circle",
      source: "user-location",
      paint: {
        "circle-radius": 10,
        "circle-color": "#a3e635",
        "circle-opacity": 0.4,
        "circle-pitch-alignment": "map",
      },
    });

    map.addLayer({
      id: "user-location-dot",
      type: "circle",
      source: "user-location",
      paint: {
        "circle-radius": 5,
        "circle-color": "#a3e635",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  const duration = 2000;

  let start: number | null = null;

  let animationFrameId = 0;

  const animatePulse = (timestamp: number) => {
    if (!start) start = timestamp;

    const progress = ((timestamp - start) % duration) / duration;

    const radius = 10 + progress * 18;

    const opacity = 0.4 * (1 - progress);

    if (map.getLayer("user-location-pulse")) {
      map.setPaintProperty(
        "user-location-pulse",
        "circle-radius",
        radius
      );

      map.setPaintProperty(
        "user-location-pulse",
        "circle-opacity",
        opacity
      );
    }

    animationFrameId = requestAnimationFrame(animatePulse);
  };

  animationFrameId = requestAnimationFrame(animatePulse);

  map.once("remove", () => {
    cancelAnimationFrame(animationFrameId);
  });
};