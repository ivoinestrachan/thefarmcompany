"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import Reveal from "./Reveal";

type Activity = {
  id: string;
  coordinates: [number, number];
};

const ACTIVITIES: Activity[] = [
  { id: "01", coordinates: [-119.6, 36.7] },
  { id: "02", coordinates: [-86.1, 40.0] },
  { id: "03", coordinates: [-85.3, 37.8] },
  { id: "04", coordinates: [-0.12, 51.5] },
  { id: "05", coordinates: [-0.3, 50.9] },
];

export default function OperationsMap() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: container.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-47, 41],
      zoom: 2.05,
      minZoom: 1.6,
      maxZoom: 8,
      attributionControl: false,
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.scrollZoom.disable();
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");

    map.on("load", () => {
      map.resize();
      setMapReady(true);
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container.current);

    ACTIVITIES.forEach((location) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "operations-marker";
      button.setAttribute("aria-label", `Explore map point ${location.id}`);
      button.innerHTML = `<span></span><b>${location.id}</b>`;
      button.addEventListener("click", () => {
        map.flyTo({ center: location.coordinates, zoom: 4.15, duration: 1200, essential: true });
      });
      const marker = new maplibregl.Marker({ element: button, anchor: "center" })
        .setLngLat(location.coordinates)
        .addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section id="reach" className="border-t hairline bg-char py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16">
            <div>
              <span className="eyebrow">Operations map</span>
              <h2 className="display mt-6 text-4xl text-paper sm:text-5xl lg:text-6xl">
                What&rsquo;s active. <span className="display-accent">What comes next.</span>
              </h2>
            </div>
            <p className="max-w-2xl text-lg font-light leading-relaxed text-fog">
              Drag, zoom, and explore the regions. Location details will stay hidden
              until each program and deployment status has been verified.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative mt-10 h-[62vh] min-h-[430px] max-h-[640px] overflow-hidden border-y hairline sm:mt-14 sm:h-[680px] sm:max-h-none">
            <div ref={container} className="operations-map-canvas absolute inset-0 bg-[#090909]" aria-label="Interactive map of Wiggler activity and target regions" />
            {!mapReady && (
              <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-char">
                <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper" />
                  Loading operations map
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%-5.5rem)] bg-char/90 p-4 backdrop-blur-md sm:left-6 sm:top-6 sm:max-w-sm sm:p-5">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-paper/55">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-paper/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-paper" />
                </span>
                Current program
              </div>
              <div className="mt-2 text-lg font-medium text-paper">Controlled hydroponic validation</div>
              <p className="mt-1 text-xs leading-relaxed text-fog">
                Active now · exact trial location is not publicly listed
              </p>
            </div>

          </div>
        </Reveal>

        <p className="mt-5 max-w-3xl font-mono text-[10px] leading-relaxed text-faint">
          Map points are exploratory only. Verified location details will be added when they are ready to publish.
        </p>
      </div>
    </section>
  );
}
