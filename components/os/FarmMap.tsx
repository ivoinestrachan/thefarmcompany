"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Field } from "./types";
import { primaryCrop, cropColor, NO_CROP_COLOR } from "@/lib/crops";

export type FarmMapHandle = {
  finishDraw: () => void;
  cancelDraw: () => void;
  flyToField: (field: Field) => void;
};

type Mode = "view" | "draw" | "scout" | "soil" | "weed";

type LayerToggles = { scouts: boolean; soil: boolean; weeds: boolean };

type Props = {
  fields: Field[];
  selectedFieldId: string | null;
  mode: Mode;
  layers: LayerToggles;
  onSelectField: (id: string) => void;
  onDraftChange: (vertices: number) => void;
  onPolygonComplete: (ring: number[][]) => void;
  onScoutPoint: (lng: number, lat: number) => void;
  onSoilPoint: (lng: number, lat: number) => void;
  onWeedPoint: (lng: number, lat: number) => void;
};

// Free Esri World Imagery — satellite raster, no API key required.
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "satellite" }],
};

const fieldsToGeoJSON = (fields: Field[], selectedId: string | null) => ({
  type: "FeatureCollection" as const,
  features: fields.map((f) => {
    const crop = primaryCrop(f);
    return {
      type: "Feature" as const,
      properties: {
        id: f.id,
        name: f.name,
        selected: f.id === selectedId,
        color: crop ? cropColor(crop) : NO_CROP_COLOR,
      },
      geometry: f.geometry,
    };
  }),
});

const scoutsToGeoJSON = (fields: Field[]) => ({
  type: "FeatureCollection" as const,
  features: fields.flatMap((f) =>
    f.scouts.map((s) => ({
      type: "Feature" as const,
      properties: { health: s.health },
      geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
    }))
  ),
});

const soilToGeoJSON = (fields: Field[]) => ({
  type: "FeatureCollection" as const,
  features: fields.flatMap((f) =>
    f.soil.map((s) => ({
      type: "Feature" as const,
      properties: { moisture: s.moisture ?? -1 },
      geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
    }))
  ),
});

const DENSITY_SIZE: Record<string, number> = { low: 5, medium: 7, high: 9 };
const weedsToGeoJSON = (fields: Field[]) => ({
  type: "FeatureCollection" as const,
  features: fields.flatMap((f) =>
    f.weeds.map((w) => ({
      type: "Feature" as const,
      properties: {
        size: DENSITY_SIZE[w.density] ?? 7,
        cleared: w.status === "cleared" ? 1 : 0,
      },
      geometry: { type: "Point" as const, coordinates: [w.lng, w.lat] },
    }))
  ),
});

const FarmMap = forwardRef<FarmMapHandle, Props>(function FarmMap(
  { fields, selectedFieldId, mode, layers, onSelectField, onDraftChange, onPolygonComplete, onScoutPoint, onSoilPoint, onWeedPoint },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const draftRef = useRef<number[][]>([]);
  // Keep latest props/mode accessible inside stable event handlers.
  const modeRef = useRef(mode);
  const cbRef = useRef({ onSelectField, onDraftChange, onPolygonComplete, onScoutPoint, onSoilPoint, onWeedPoint });
  modeRef.current = mode;
  cbRef.current = { onSelectField, onDraftChange, onPolygonComplete, onScoutPoint, onSoilPoint, onWeedPoint };

  const renderDraft = () => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const pts = draftRef.current;
    const src = map.getSource("draft") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    const features: GeoJSON.Feature[] = [];
    if (pts.length) {
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: pts.length > 1 ? pts : [pts[0], pts[0]] },
      });
      for (const p of pts) {
        features.push({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: p } });
      }
    }
    src.setData({ type: "FeatureCollection", features });
  };

  useImperativeHandle(ref, () => ({
    finishDraw() {
      const pts = draftRef.current;
      if (pts.length >= 3) {
        const ring = [...pts, pts[0]]; // close the ring
        cbRef.current.onPolygonComplete(ring);
      }
      draftRef.current = [];
      cbRef.current.onDraftChange(0);
      renderDraft();
    },
    cancelDraw() {
      draftRef.current = [];
      cbRef.current.onDraftChange(0);
      renderDraft();
    },
    flyToField(field) {
      const map = mapRef.current;
      if (!map) return;
      const ring = field.geometry.coordinates[0];
      const b = ring.reduce(
        (acc, [lng, lat]) => [
          Math.min(acc[0], lng),
          Math.min(acc[1], lat),
          Math.max(acc[2], lng),
          Math.max(acc[3], lat),
        ],
        [Infinity, Infinity, -Infinity, -Infinity]
      );
      map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 120, duration: 700, maxZoom: 17 });
    },
  }));

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      // Milliken Reservoir seismic station, Napa — City of Napa land.
      center: [-122.24, 38.38],
      zoom: 13.5,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), "top-left");

    map.on("load", () => {
      map.addSource("fields", { type: "geojson", data: fieldsToGeoJSON(fields, selectedFieldId) });
      map.addLayer({
        id: "fields-fill",
        type: "fill",
        source: "fields",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["case", ["get", "selected"], 0.5, 0.28],
        },
      });
      map.addLayer({
        id: "fields-line",
        type: "line",
        source: "fields",
        paint: {
          "line-color": ["case", ["get", "selected"], "#ffffff", ["get", "color"]],
          "line-width": ["case", ["get", "selected"], 3, 2],
        },
      });

      map.addSource("scouts", { type: "geojson", data: scoutsToGeoJSON(fields) });
      map.addLayer({
        id: "scouts-pt",
        type: "circle",
        source: "scouts",
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "interpolate", ["linear"], ["get", "health"],
            1, "#e5533c", 3, "#f5c542", 5, "#4fd06a",
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addSource("soil", { type: "geojson", data: soilToGeoJSON(fields) });
      map.addLayer({
        id: "soil-pt",
        type: "circle",
        source: "soil",
        paint: {
          // Blue = wet, brown = dry; grey when moisture wasn't recorded.
          "circle-radius": 6,
          "circle-color": [
            "case",
            ["<", ["get", "moisture"], 0], "#9aa0a6",
            ["interpolate", ["linear"], ["get", "moisture"], 0, "#b07a43", 50, "#4f9dd0", 100, "#2f6fb0"],
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addSource("weeds", { type: "geojson", data: weedsToGeoJSON(fields) });
      map.addLayer({
        id: "weeds-pt",
        type: "circle",
        source: "weeds",
        paint: {
          "circle-radius": ["get", "size"],
          // Active weeds = red target; cleared = muted green.
          "circle-color": ["case", ["==", ["get", "cleared"], 1], "#6b8f5a", "#e5443c"],
          "circle-opacity": ["case", ["==", ["get", "cleared"], 1], 0.55, 0.85],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addSource("draft", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "draft-line",
        type: "line",
        source: "draft",
        paint: { "line-color": "#7ee081", "line-width": 2, "line-dasharray": [2, 1] },
      });
      map.addLayer({
        id: "draft-pt",
        type: "circle",
        source: "draft",
        filter: ["==", ["geometry-type"], "Point"],
        paint: { "circle-radius": 5, "circle-color": "#7ee081", "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
      });

      readyRef.current = true;
      fitToFields();
    });

    map.on("click", (e) => {
      const m = modeRef.current;
      if (m === "draw") {
        draftRef.current = [...draftRef.current, [e.lngLat.lng, e.lngLat.lat]];
        cbRef.current.onDraftChange(draftRef.current.length);
        renderDraft();
        return;
      }
      if (m === "scout") {
        cbRef.current.onScoutPoint(e.lngLat.lng, e.lngLat.lat);
        return;
      }
      if (m === "soil") {
        cbRef.current.onSoilPoint(e.lngLat.lng, e.lngLat.lat);
        return;
      }
      if (m === "weed") {
        cbRef.current.onWeedPoint(e.lngLat.lng, e.lngLat.lat);
        return;
      }
      const hit = map.queryRenderedFeatures(e.point, { layers: ["fields-fill"] });
      if (hit.length) cbRef.current.onSelectField(hit[0].properties?.id as string);
    });

    map.on("mousemove", (e) => {
      const m = modeRef.current;
      map.getCanvas().style.cursor =
        m === "draw" || m === "scout" || m === "soil" || m === "weed" ? "crosshair" : "";
      if (m === "view") {
        const hit = map.queryRenderedFeatures(e.point, { layers: ["fields-fill"] });
        map.getCanvas().style.cursor = hit.length ? "pointer" : "";
      }
    });

    function fitToFields() {
      if (!fields.length) return;
      const all = fields.flatMap((f) => f.geometry.coordinates[0]);
      const b = all.reduce(
        (acc, [lng, lat]) => [
          Math.min(acc[0], lng), Math.min(acc[1], lat),
          Math.max(acc[2], lng), Math.max(acc[3], lat),
        ],
        [Infinity, Infinity, -Infinity, -Infinity]
      );
      map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 100, duration: 0, maxZoom: 16 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync field + scout data when they change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource("fields") as maplibregl.GeoJSONSource | undefined)?.setData(
      fieldsToGeoJSON(fields, selectedFieldId)
    );
    (map.getSource("scouts") as maplibregl.GeoJSONSource | undefined)?.setData(scoutsToGeoJSON(fields));
    (map.getSource("soil") as maplibregl.GeoJSONSource | undefined)?.setData(soilToGeoJSON(fields));
    (map.getSource("weeds") as maplibregl.GeoJSONSource | undefined)?.setData(weedsToGeoJSON(fields));
  }, [fields, selectedFieldId]);

  // Toggle layer visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (map.getLayer("scouts-pt"))
      map.setLayoutProperty("scouts-pt", "visibility", layers.scouts ? "visible" : "none");
    if (map.getLayer("soil-pt"))
      map.setLayoutProperty("soil-pt", "visibility", layers.soil ? "visible" : "none");
    if (map.getLayer("weeds-pt"))
      map.setLayoutProperty("weeds-pt", "visibility", layers.weeds ? "visible" : "none");
  }, [layers]);

  return <div ref={containerRef} className="h-full w-full" />;
});

export default FarmMap;
