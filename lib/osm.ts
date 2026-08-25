/* Pull REAL farm field boundaries from OpenStreetMap via the Overpass API.
   Vineyards, orchards and farmland come back as polygons with crop tags —
   actual mapped fields we can import as plots so the app runs on real data. */

import { ringAreaAcres, ringCentroid } from "@/lib/geo";

export type OsmField = {
  name: string;
  landType: string;
  crop: string | null;
  ring: number[][]; // [lng, lat] closed ring
  areaAcres: number;
  center: { lng: number; lat: number };
};

export type Bbox = { minLng: number; minLat: number; maxLng: number; maxLat: number };

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function overpassFetch(query: string): Promise<Response> {
  let lastErr: unknown;
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (res.ok) return res;
      lastErr = new Error(`overpass ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("overpass failed");
}

function cropFor(tags: Record<string, string>): { landType: string; crop: string | null } {
  const lu = tags.landuse;
  if (lu === "vineyard") return { landType: "Vineyard", crop: tags.crop || "Wine Grapes" };
  if (lu === "orchard") {
    const trees = tags.trees || tags.crop || "";
    const map: Record<string, string> = {
      olive_trees: "Olives", olives: "Olives",
      almond_trees: "Almonds", walnut_trees: "Walnuts",
      apple_trees: "Apples", orange_trees: "Oranges",
    };
    return { landType: "Orchard", crop: map[trees] || tags.crop || "Orchard" };
  }
  return { landType: "Field", crop: tags.crop || null };
}

export async function fetchOsmFields(bbox: Bbox, limit = 20): Promise<OsmField[]> {
  const { minLat, minLng, maxLat, maxLng } = bbox;
  const b = `${minLat},${minLng},${maxLat},${maxLng}`;
  const query =
    `[out:json][timeout:25];(` +
    `way["landuse"="vineyard"](${b});` +
    `way["landuse"="orchard"](${b});` +
    `way["landuse"="farmland"](${b});` +
    `);out geom tags;`;

  const res = await overpassFetch(query);
  const data = (await res.json()) as {
    elements: { type: string; geometry?: { lat: number; lon: number }[]; tags?: Record<string, string> }[];
  };

  const fields: OsmField[] = [];
  for (const el of data.elements) {
    if (el.type !== "way" || !el.geometry || el.geometry.length < 4) continue;
    const ring = el.geometry.map((p) => [p.lon, p.lat]);
    // Ensure the ring is closed.
    const first = ring[0], last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
    const tags = el.tags || {};
    const { landType, crop } = cropFor(tags);
    const areaAcres = ringAreaAcres(ring);
    if (areaAcres < 0.5 || areaAcres > 2000) continue; // drop slivers + oddities
    const center = ringCentroid(ring);
    fields.push({
      name: tags.name || `${landType} ${fields.length + 1}`,
      landType,
      crop,
      ring,
      areaAcres,
      center,
    });
  }

  // Biggest fields first, capped.
  return fields.sort((a, b) => b.areaAcres - a.areaAcres).slice(0, limit);
}
