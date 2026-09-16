"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Field, Report } from "./types";
import { primaryCrop, cropColor, NO_CROP_COLOR } from "@/lib/crops";

export type FarmMapHandle = {
  finishDraw: () => void;
  cancelDraw: () => void;
  flyToField: (field: Field) => void;
};

type Mode = "view" | "draw" | "scout" | "soil" | "weed" | "problem";

type LayerToggles = { scouts: boolean; soil: boolean; weeds: boolean; problems: boolean; vigor: boolean };

/* --- Vine-vigor heatmap: a visible-band greenness index (VARI) computed from
   the free NAIP aerial, colour-ramped and clipped to the field polygons. It's
   a real vegetation index (not true NDVI — no near-infrared band). --- */

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });
}

const VIGOR_STOPS: [number, number, number][] = [
  [215, 25, 28], [253, 174, 97], [255, 255, 191], [166, 217, 106], [26, 150, 64],
];
function vigorColor(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t)) * (VIGOR_STOPS.length - 1);
  const i = Math.floor(x), f = x - i;
  const a = VIGOR_STOPS[i], b = VIGOR_STOPS[Math.min(VIGOR_STOPS.length - 1, i + 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

async function computeVigor(fields: Field[]): Promise<{ url: string; coordinates: [[number,number],[number,number],[number,number],[number,number]] }> {
  const S = 1024;
  const all = fields.flatMap((f) => f.geometry.coordinates[0]);
  const lngs = all.map((p) => p[0]), lats = all.map((p) => p[1]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);

  const img = await loadImage(`/api/naip?minLng=${minLng}&minLat=${minLat}&maxLng=${maxLng}&maxLat=${maxLat}&size=${S}`);
  const src = document.createElement("canvas");
  src.width = src.height = S;
  const sctx = src.getContext("2d")!;
  sctx.drawImage(img, 0, 0, S, S);
  const data = sctx.getImageData(0, 0, S, S).data;

  // Polygon mask (per-pixel) so we only score/paint inside the field.
  const mask = document.createElement("canvas");
  mask.width = mask.height = S;
  const mctx = mask.getContext("2d")!;
  mctx.fillStyle = "#fff";
  for (const f of fields) {
    const ring = f.geometry.coordinates[0];
    mctx.beginPath();
    ring.forEach(([lng, lat], idx) => {
      const px = ((lng - minLng) / (maxLng - minLng)) * S;
      const py = ((maxLat - lat) / (maxLat - minLat)) * S;
      idx === 0 ? mctx.moveTo(px, py) : mctx.lineTo(px, py);
    });
    mctx.closePath();
    mctx.fill();
  }
  const maskData = mctx.getImageData(0, 0, S, S).data;

  // Pass 1: greenness index (VARI) for inside pixels → percentile stretch so
  // even a low-contrast field shows its relative vigor variation.
  const vari = new Float32Array(S * S);
  const inside: number[] = [];
  for (let i = 0; i < S * S; i++) {
    if (maskData[i * 4 + 3] < 128) { vari[i] = NaN; continue; }
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const v = (g - r) / (g + r - b || 1);
    vari[i] = v;
    inside.push(v);
  }
  inside.sort((a, b) => a - b);
  const lo = inside[Math.floor(inside.length * 0.03)] ?? -0.1;
  const hi = inside[Math.floor(inside.length * 0.97)] ?? 0.3;
  const span = hi - lo || 1;

  const out = document.createElement("canvas");
  out.width = out.height = S;
  const octx = out.getContext("2d")!;
  const outImg = octx.createImageData(S, S);
  const od = outImg.data;
  for (let i = 0; i < S * S; i++) {
    if (Number.isNaN(vari[i])) { od[i * 4 + 3] = 0; continue; }
    const t = (vari[i] - lo) / span;
    const [cr, cg, cb] = vigorColor(t);
    od[i * 4] = cr; od[i * 4 + 1] = cg; od[i * 4 + 2] = cb; od[i * 4 + 3] = 225;
  }
  octx.putImageData(outImg, 0, 0);

  return {
    url: out.toDataURL("image/png"),
    coordinates: [[minLng, maxLat], [maxLng, maxLat], [maxLng, minLat], [minLng, minLat]],
  };
}

type Props = {
  fields: Field[];
  reports: Report[];
  selectedFieldId: string | null;
  mode: Mode;
  layers: LayerToggles;
  onSelectField: (id: string) => void;
  onSelectReport: (id: string) => void;
  onDraftChange: (vertices: number) => void;
  onPolygonComplete: (ring: number[][]) => void;
  onScoutPoint: (lng: number, lat: number) => void;
  onSoilPoint: (lng: number, lat: number) => void;
  onWeedPoint: (lng: number, lat: number) => void;
  onProblemPoint: (lng: number, lat: number) => void;
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

const SEV_COLOR: Record<string, string> = { high: "#e5443c", medium: "#e8863c", low: "#e0c020" };
const reportsToGeoJSON = (reports: Report[]) => ({
  type: "FeatureCollection" as const,
  features: reports.map((r) => ({
    type: "Feature" as const,
    properties: {
      id: r.id,
      color: r.status === "resolved" ? "#4fd06a" : SEV_COLOR[r.severity] ?? "#e8863c",
      resolved: r.status === "resolved" ? 1 : 0,
    },
    geometry: { type: "Point" as const, coordinates: [r.lng, r.lat] },
  })),
});

const FarmMap = forwardRef<FarmMapHandle, Props>(function FarmMap(
  { fields, reports, selectedFieldId, mode, layers, onSelectField, onSelectReport, onDraftChange, onPolygonComplete, onScoutPoint, onSoilPoint, onWeedPoint, onProblemPoint },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const draftRef = useRef<number[][]>([]);
  // Keep latest props/mode accessible inside stable event handlers.
  const modeRef = useRef(mode);
  const cbRef = useRef({ onSelectField, onSelectReport, onDraftChange, onPolygonComplete, onScoutPoint, onSoilPoint, onWeedPoint, onProblemPoint });
  modeRef.current = mode;
  cbRef.current = { onSelectField, onSelectReport, onDraftChange, onPolygonComplete, onScoutPoint, onSoilPoint, onWeedPoint, onProblemPoint };

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

      // Problem reports — the big, high-contrast markers (severity colour,
      // green when resolved), drawn above everything else.
      map.addSource("reports", { type: "geojson", data: reportsToGeoJSON(reports) });
      map.addLayer({
        id: "reports-halo",
        type: "circle",
        source: "reports",
        paint: {
          "circle-radius": 13,
          "circle-color": ["get", "color"],
          "circle-opacity": ["case", ["==", ["get", "resolved"], 1], 0.15, 0.25],
        },
      });
      map.addLayer({
        id: "reports-pt",
        type: "circle",
        source: "reports",
        paint: {
          "circle-radius": 8,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
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
      if (m === "problem") {
        cbRef.current.onProblemPoint(e.lngLat.lng, e.lngLat.lat);
        return;
      }
      // Problem markers take priority over field selection.
      const rHit = map.queryRenderedFeatures(e.point, { layers: ["reports-pt"] });
      if (rHit.length) {
        cbRef.current.onSelectReport(rHit[0].properties?.id as string);
        return;
      }
      const hit = map.queryRenderedFeatures(e.point, { layers: ["fields-fill"] });
      if (hit.length) cbRef.current.onSelectField(hit[0].properties?.id as string);
    });

    map.on("mousemove", (e) => {
      const m = modeRef.current;
      map.getCanvas().style.cursor =
        m === "draw" || m === "scout" || m === "soil" || m === "weed" || m === "problem" ? "crosshair" : "";
      if (m === "view") {
        const hit = map.queryRenderedFeatures(e.point, { layers: ["reports-pt", "fields-fill"] });
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

  // Sync problem reports when they change (or get filtered).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource("reports") as maplibregl.GeoJSONSource | undefined)?.setData(reportsToGeoJSON(reports));
  }, [reports]);

  // Re-fit the view when the set of fields changes (e.g. switching farms).
  const fieldKeyRef = useRef("");
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !fields.length) return;
    const key = fields.map((f) => f.id).join(",");
    if (key === fieldKeyRef.current) return;
    fieldKeyRef.current = key;
    const all = fields.flatMap((f) => f.geometry.coordinates[0]);
    const b = all.reduce(
      (acc, [lng, lat]) => [
        Math.min(acc[0], lng), Math.min(acc[1], lat),
        Math.max(acc[2], lng), Math.max(acc[3], lat),
      ],
      [Infinity, Infinity, -Infinity, -Infinity]
    );
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 100, duration: 800, maxZoom: 16 });
  }, [fields]);

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
    for (const id of ["reports-pt", "reports-halo"])
      if (map.getLayer(id))
        map.setLayoutProperty(id, "visibility", layers.problems ? "visible" : "none");
  }, [layers]);

  // Vine-vigor heatmap (computed from NAIP) for the SELECTED field — the
  // precision-ag "inspect one block" workflow. Sharp NAIP at field scale.
  const vigorKeyRef = useRef("");
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const target = fields.filter((f) => f.id === selectedFieldId);
    if (!layers.vigor || target.length === 0) {
      if (map.getLayer("vigor-lyr")) map.setLayoutProperty("vigor-lyr", "visibility", "none");
      return;
    }
    const key = target.map((f) => f.id).join(",");
    const show = (url: string, coordinates: [[number,number],[number,number],[number,number],[number,number]]) => {
      const m = mapRef.current;
      if (!m) return;
      const existing = m.getSource("vigor") as maplibregl.ImageSource | undefined;
      if (existing) {
        existing.updateImage({ url, coordinates });
      } else {
        m.addSource("vigor", { type: "image", url, coordinates });
        m.addLayer(
          {
            id: "vigor-lyr",
            type: "raster",
            source: "vigor",
            paint: { "raster-opacity": 0.8, "raster-resampling": "nearest" },
          },
          m.getLayer("fields-line") ? "fields-line" : undefined
        );
      }
      if (m.getLayer("vigor-lyr")) m.setLayoutProperty("vigor-lyr", "visibility", "visible");
    };

    if (key === vigorKeyRef.current && map.getSource("vigor")) {
      if (map.getLayer("vigor-lyr")) map.setLayoutProperty("vigor-lyr", "visibility", "visible");
      return;
    }
    computeVigor(target)
      .then(({ url, coordinates }) => {
        vigorKeyRef.current = key;
        show(url, coordinates);
      })
      .catch(() => {});
  }, [layers.vigor, fields, selectedFieldId]);

  return <div ref={containerRef} className="h-full w-full" />;
});

export default FarmMap;
