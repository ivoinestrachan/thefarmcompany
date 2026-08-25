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

export type FarmMapHandle = {
  finishDraw: () => void;
  cancelDraw: () => void;
  flyToField: (field: Field) => void;
};

type Mode = "view" | "draw" | "scout";

type Props = {
  fields: Field[];
  selectedFieldId: string | null;
  mode: Mode;
  onSelectField: (id: string) => void;
  onDraftChange: (vertices: number) => void;
  onPolygonComplete: (ring: number[][]) => void;
  onScoutPoint: (lng: number, lat: number) => void;
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
  features: fields.map((f) => ({
    type: "Feature" as const,
    properties: { id: f.id, name: f.name, selected: f.id === selectedId },
    geometry: f.geometry,
  })),
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

const FarmMap = forwardRef<FarmMapHandle, Props>(function FarmMap(
  { fields, selectedFieldId, mode, onSelectField, onDraftChange, onPolygonComplete, onScoutPoint },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const draftRef = useRef<number[][]>([]);
  // Keep latest props/mode accessible inside stable event handlers.
  const modeRef = useRef(mode);
  const cbRef = useRef({ onSelectField, onDraftChange, onPolygonComplete, onScoutPoint });
  modeRef.current = mode;
  cbRef.current = { onSelectField, onDraftChange, onPolygonComplete, onScoutPoint };

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
      center: [-98.5, 39.8],
      zoom: 3.5,
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
          "fill-color": ["case", ["get", "selected"], "#7ee081", "#ffe14d"],
          "fill-opacity": ["case", ["get", "selected"], 0.35, 0.12],
        },
      });
      map.addLayer({
        id: "fields-line",
        type: "line",
        source: "fields",
        paint: {
          "line-color": ["case", ["get", "selected"], "#7ee081", "#ffe14d"],
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
      const hit = map.queryRenderedFeatures(e.point, { layers: ["fields-fill"] });
      if (hit.length) cbRef.current.onSelectField(hit[0].properties?.id as string);
    });

    map.on("mousemove", (e) => {
      const m = modeRef.current;
      map.getCanvas().style.cursor = m === "draw" || m === "scout" ? "crosshair" : "";
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
  }, [fields, selectedFieldId]);

  return <div ref={containerRef} className="absolute inset-0" />;
});

export default FarmMap;
