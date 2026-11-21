import { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  GROWTH_POLES,
  HCMC_BOUNDARY_GEOJSON,
  MAP_IMAGE_COORDINATES,
  MAP_MAX_BOUNDS,
  OFFICIAL_MAP_IMAGE_URL,
  TIMELINE_DURATION_SEC,
  buildAnimatedBoundaryTraceGeoJSON,
  buildAnimatedRoutesGeoJSON,
  buildMovingPulsesGeoJSON,
  buildPinkBorderCometGeoJSON,
  interpolateCamera,
  type GrowthPole,
} from '../data/hcmcMapData';

function createOfficialMapStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      'official-hcmc-map': {
        type: 'image',
        url: OFFICIAL_MAP_IMAGE_URL,
        coordinates: MAP_IMAGE_COORDINATES,
      },
    },
    layers: [
      {
        id: 'official-hcmc-raster',
        type: 'raster',
        source: 'official-hcmc-map',
        paint: {
          'raster-opacity': 1,
          'raster-saturation': 0.04,
          'raster-contrast': 0.05,
          'raster-resampling': 'linear',
          'raster-fade-duration': 0,
        },
      },
    ],
  };
}

export function InteractiveHcmcMap() {
  const sectionRef = useRef<HTMLElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapLoadedRef = useRef(false);

  // Refs for DOM markers so requestAnimationFrame updates visibility smoothly without React churn
  const poleMarkersRef = useRef<
    Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement }>
  >(new Map());
  const activePoleRef = useRef<GrowthPole | null>(null);

  // Animation refs driven strictly by requestAnimationFrame
  const progressRef = useRef(0);
  const visualsProgressRef = useRef(0);
  const pulseClockRef = useRef(0);
  const isPlayingRef = useRef(false);
  const autoCameraRef = useRef(true);

  // UI state
  const [hoveredPole, setHoveredPole] = useState<{
    pole: GrowthPole;
    x: number;
    y: number;
  } | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Attach all GeoJSON sources and WebGL layers onto the MapLibre instance
  const attachGeoJsonLayers = useCallback((map: maplibregl.Map) => {
    const emptyLine: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: 'FeatureCollection',
      features: [],
    };
    const emptyPoint: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: [],
    };

    if (!map.getSource('hcmc-boundary')) {
      map.addSource('hcmc-boundary', { type: 'geojson', data: HCMC_BOUNDARY_GEOJSON });
    }
    if (!map.getSource('hcmc-boundary-trace')) {
      map.addSource('hcmc-boundary-trace', { type: 'geojson', data: emptyLine });
    }
    if (!map.getSource('hcmc-boundary-comet')) {
      map.addSource('hcmc-boundary-comet', { type: 'geojson', data: emptyLine });
    }
    if (!map.getSource('routes-animated')) {
      map.addSource('routes-animated', { type: 'geojson', data: emptyLine });
    }
    if (!map.getSource('route-pulses')) {
      map.addSource('route-pulses', { type: 'geojson', data: emptyPoint });
    }

    // 1. Radiant glowing light trace strictly hugging the red-dashed outer border of the 5-pole map
    if (!map.getLayer('hcmc-boundary-glow')) {
      map.addLayer({
        id: 'hcmc-boundary-glow',
        type: 'line',
        source: 'hcmc-boundary-trace',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#F43F5E',
          'line-width': 11,
          'line-blur': 7,
          'line-opacity': 0.5,
        },
      });
    }

    if (!map.getLayer('hcmc-boundary-core')) {
      map.addLayer({
        id: 'hcmc-boundary-core',
        type: 'line',
        source: 'hcmc-boundary-trace',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#FB7185',
          'line-width': 2.8,
          'line-opacity': 0.9,
        },
      });
    }

    // Continuous luminous energy comet gliding along the exact outer border line
    if (!map.getLayer('hcmc-boundary-comet-glow')) {
      map.addLayer({
        id: 'hcmc-boundary-comet-glow',
        type: 'line',
        source: 'hcmc-boundary-comet',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#FF2A6D',
          'line-width': 13,
          'line-blur': 6,
          'line-opacity': 0.85,
        },
      });
    }

    if (!map.getLayer('hcmc-boundary-comet-core')) {
      map.addLayer({
        id: 'hcmc-boundary-comet-core',
        type: 'line',
        source: 'hcmc-boundary-comet',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 2.5,
          'line-opacity': 0.98,
        },
      });
    }

    // 2. Progressive animated transport routes
    if (!map.getLayer('routes-glow')) {
      map.addLayer({
        id: 'routes-glow',
        type: 'line',
        source: 'routes-animated',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': ['get', 'glowColor'],
          'line-width': 10,
          'line-blur': 6,
          'line-opacity': 0.34,
        },
      });
    }

    if (!map.getLayer('routes-casing')) {
      map.addLayer({
        id: 'routes-casing',
        type: 'line',
        source: 'routes-animated',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': ['case', ['==', ['get', 'isMaritime'], 1], 4.8, 5.8],
          'line-opacity': 0.92,
        },
      });
    }

    if (!map.getLayer('routes-core')) {
      map.addLayer({
        id: 'routes-core',
        type: 'line',
        source: 'routes-animated',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['==', ['get', 'isMaritime'], 1], 2.6, 3.4],
          'line-opacity': 0.98,
        },
      });
    }

    // 3. Moving travel pulses gliding smoothly between hubs
    if (!map.getLayer('route-pulses-halo')) {
      map.addLayer({
        id: 'route-pulses-halo',
        type: 'circle',
        source: 'route-pulses',
        paint: {
          'circle-radius': 11,
          'circle-color': ['get', 'glowColor'],
          'circle-blur': 0.8,
          'circle-opacity': 0.62,
        },
      });
    }

    if (!map.getLayer('route-pulses-core')) {
      map.addLayer({
        id: 'route-pulses-core',
        type: 'circle',
        source: 'route-pulses',
        paint: {
          'circle-radius': 4.2,
          'circle-color': '#FFFFFF',
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-width': 2.4,
        },
      });
    }
  }, []);

  // Push live frame data from requestAnimationFrame into MapLibre sources & markers
  const syncMapVisuals = useCallback((p: number, pulseClock: number) => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const boundaryTraceSrc = map.getSource('hcmc-boundary-trace') as
      | maplibregl.GeoJSONSource
      | undefined;
    if (boundaryTraceSrc) {
      boundaryTraceSrc.setData(buildAnimatedBoundaryTraceGeoJSON(p));
    }

    const boundaryCometSrc = map.getSource('hcmc-boundary-comet') as
      | maplibregl.GeoJSONSource
      | undefined;
    if (boundaryCometSrc) {
      boundaryCometSrc.setData(buildPinkBorderCometGeoJSON(p, pulseClock));
    }

    const routesSrc = map.getSource('routes-animated') as maplibregl.GeoJSONSource | undefined;
    if (routesSrc) {
      routesSrc.setData(buildAnimatedRoutesGeoJSON(p));
    }

    const pulsesSrc = map.getSource('route-pulses') as maplibregl.GeoJSONSource | undefined;
    if (pulsesSrc) {
      pulsesSrc.setData(buildMovingPulsesGeoJSON(p, pulseClock));
    }
  }, []);

  // Initialize MapLibre GL JS once with the official 5-pole TP.HCM map (locked straight upright)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const initialCam = interpolateCamera(0);
    const map = new maplibregl.Map({
      container,
      style: createOfficialMapStyle(),
      center: initialCam.center,
      zoom: initialCam.zoom,
      pitch: 0,
      bearing: 0,
      maxBounds: MAP_MAX_BOUNDS,
      maxPitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      minZoom: 6.8,
      maxZoom: 11.4,
      attributionControl: false,
    });

    mapRef.current = map;
    map.touchZoomRotate.disableRotation();

    const releaseAutoCamera = () => {
      if (autoCameraRef.current) {
        autoCameraRef.current = false;
      }
    };
    map.on('dragstart', releaseAutoCamera);
    map.on('wheel', releaseAutoCamera);

    // Build 5 interactive location-pin hotspots aligned over the 5 circular pole icons
    const createdPoles = new Map<
      string,
      { marker: maplibregl.Marker; el: HTMLButtonElement }
    >();
    const updateHoveredPosition = (pole: GrowthPole) => {
      const pt = map.project(pole.coords);
      setHoveredPole({ pole, x: pt.x, y: pt.y });
    };

    for (const pole of GROWTH_POLES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-pole-pin';
      btn.dataset.side = pole.labelSide;
      btn.setAttribute('aria-label', pole.title);
      btn.innerHTML = `
        <span class="pole-pin-inner" style="--pole-accent:${pole.accentColor}">
          <span class="pole-halo"></span>
          <span class="pole-badge">
            <svg class="pole-svg" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M16 1.5C8.544 1.5 2.5 7.544 2.5 15C2.5 24.4 14.3 35.1 15.2 35.9C15.65 36.3 16.35 36.3 16.8 35.9C17.7 35.1 29.5 24.4 29.5 15C29.5 7.544 23.456 1.5 16 1.5Z" fill="${pole.accentColor}" stroke="#FFFFFF" stroke-width="2.6"/>
              <circle cx="16" cy="14.5" r="5" fill="#FFFFFF"/>
              <circle cx="16" cy="14.5" r="2.2" fill="${pole.accentColor}"/>
            </svg>
          </span>
          <span class="pole-name-tag pole-name-${pole.labelSide}">
            <span class="pole-name-dot" style="background:${pole.accentColor}"></span>
            <span class="pole-name-text">${pole.title}</span>
          </span>
        </span>
      `;

      btn.addEventListener('mouseenter', () => {
        activePoleRef.current = pole;
        btn.dataset.active = 'true';
        updateHoveredPosition(pole);
      });
      btn.addEventListener('mouseleave', () => {
        btn.dataset.active = 'false';
        if (activePoleRef.current?.id === pole.id) {
          activePoleRef.current = null;
          setHoveredPole((prev) => (prev?.pole.id === pole.id ? null : prev));
        }
      });
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (activePoleRef.current?.id === pole.id) {
          activePoleRef.current = null;
          btn.dataset.active = 'false';
          setHoveredPole(null);
        } else {
          createdPoles.forEach((item) => {
            item.el.dataset.active = 'false';
          });
          activePoleRef.current = pole;
          btn.dataset.active = 'true';
          updateHoveredPosition(pole);
        }
      });

      const marker = new maplibregl.Marker({ element: btn, anchor: 'center' })
        .setLngLat(pole.coords)
        .addTo(map);
      createdPoles.set(pole.id, { marker, el: btn });
    }
    poleMarkersRef.current = createdPoles;

    const handleMapMove = () => {
      if (activePoleRef.current) {
        updateHoveredPosition(activePoleRef.current);
      }
    };
    const handleMapClick = () => {
      if (activePoleRef.current) {
        activePoleRef.current = null;
        createdPoles.forEach((item) => {
          item.el.dataset.active = 'false';
        });
        setHoveredPole(null);
      }
    };
    map.on('move', handleMapMove);
    map.on('click', handleMapClick);

    map.on('load', () => {
      mapLoadedRef.current = true;
      attachGeoJsonLayers(map);
      syncMapVisuals(progressRef.current, pulseClockRef.current);
    });

    return () => {
      mapLoadedRef.current = false;
      activePoleRef.current = null;
      createdPoles.forEach((p) => p.marker.remove());
      poleMarkersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [attachGeoJsonLayers, syncMapVisuals]);

  // Auto-start the fly-in animation once the user scrolls to the interactive map section
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || hasAutoStarted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasAutoStarted(true);
          isPlayingRef.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAutoStarted]);

  // Main 60fps requestAnimationFrame loop driving continuous 5-pole auto-zoom tour & animations
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(Math.max((now - lastTs) / 1000, 0), 0.05);
      lastTs = now;

      pulseClockRef.current += dt;

      // Pause auto-camera gently while the user hovers a growth pole so the tooltip stays rock-steady
      if (isPlayingRef.current && !activePoleRef.current) {
        const nextP = (progressRef.current + dt / TIMELINE_DURATION_SEC) % 1;
        progressRef.current = nextP;
        visualsProgressRef.current = Math.min(1, visualsProgressRef.current + dt / 18);

        if (autoCameraRef.current && mapRef.current && mapLoadedRef.current) {
          const cam = interpolateCamera(nextP);
          mapRef.current.jumpTo({
            center: cam.center,
            zoom: cam.zoom,
            pitch: 0,
            bearing: 0,
          });
        }
      }

      syncMapVisuals(visualsProgressRef.current, pulseClockRef.current);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [syncMapVisuals]);

  return (
    <section
      ref={sectionRef}
      aria-label="Bản đồ động Quy hoạch tổng thể TP.HCM 2025-2050"
      className="w-[92%] sm:w-[88%] lg:w-[82%] max-w-[1460px] mx-auto mt-10 md:mt-14 lg:mt-16"
    >
      {/* Main Interactive Map Stage (transparent, no outer white box background) */}
      <figure className="m-0">
        <div className="relative w-full overflow-hidden">
          <div
            ref={mapContainerRef}
            className="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] map-theme-official"
          />

          {/* Hover Tooltip Card for the 5 Growth Pole Location Pin Icons */}
          {hoveredPole && (() => {
            const containerW = mapContainerRef.current?.clientWidth ?? 960;
            const cardW = Math.min(340, containerW - 28);
            const leftPx = Math.min(
              Math.max(14, hoveredPole.x - cardW / 2),
              Math.max(14, containerW - cardW - 14)
            );
            const showAbove = hoveredPole.y > 215;
            const topPx = showAbove ? hoveredPole.y - 44 : hoveredPole.y + 42;

            return (
              <div
                role="tooltip"
                style={{
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  width: `${cardW}px`,
                  transform: showAbove ? 'translateY(-100%)' : 'translateY(0)',
                }}
                className="pointer-events-none absolute z-30 rounded-xl bg-[#083D88]/96 backdrop-blur-md border border-[#FED84D]/75 px-4 py-3 text-left shadow-[0_16px_40px_rgba(4,28,72,0.45)] transition-opacity duration-150"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-[2px] shrink-0"
                    style={{ backgroundColor: hoveredPole.pole.accentColor }}
                  />
                  <h3 className="text-[13px] sm:text-sm font-bold text-[#FED84D] leading-snug">
                    {hoveredPole.pole.title}
                  </h3>
                </div>
                <p className="mt-1.5 text-xs sm:text-[13px] text-[#F0F7FF] leading-relaxed">
                  {hoveredPole.pole.description}
                </p>
              </div>
            );
          })()}

        </div>
      </figure>
    </section>
  );
}
