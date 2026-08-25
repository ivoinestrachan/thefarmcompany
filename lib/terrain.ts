/* Real elevation for a plot's bounding box, from the free Open-Meteo elevation
   API (no key, CORS-enabled, up to 100 points/request). We sample an N×N grid
   and bilinearly interpolate it to displace the 3D terrain. */

export type Bounds = { minLng: number; minLat: number; maxLng: number; maxLat: number };

export type ElevationGrid = {
  n: number;
  values: number[]; // row-major, length n*n; row = lat (south→north), col = lng (west→east)
  min: number;
  max: number;
  bounds: Bounds;
  /** metres spanned by the longer (west–east) axis — for scaling to scene units */
  widthMeters: number;
};

export function boundsOfRing(ring: number[][]): Bounds {
  const lngs = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return {
    minLng: Math.min(...lngs),
    minLat: Math.min(...lats),
    maxLng: Math.max(...lngs),
    maxLat: Math.max(...lats),
  };
}

export async function fetchElevationGrid(bounds: Bounds, n = 10): Promise<ElevationGrid> {
  const { minLng, minLat, maxLng, maxLat } = bounds;
  const lats: number[] = [];
  const lngs: number[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      lats.push(minLat + ((maxLat - minLat) * r) / (n - 1));
      lngs.push(minLng + ((maxLng - minLng) * c) / (n - 1));
    }
  }

  const url =
    `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(",")}` +
    `&longitude=${lngs.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("elevation fetch failed");
  const data = (await res.json()) as { elevation: number[] };
  const values = data.elevation ?? [];
  if (values.length !== n * n) throw new Error("unexpected elevation length");

  const midLat = (minLat + maxLat) / 2;
  const widthMeters = (maxLng - minLng) * 111320 * Math.cos((midLat * Math.PI) / 180);

  return {
    n,
    values,
    min: Math.min(...values),
    max: Math.max(...values),
    bounds,
    widthMeters: Math.max(1, widthMeters),
  };
}

/** Bilinear elevation (metres) at normalized u (west→east) / v (south→north), 0..1. */
export function sampleElevation(g: ElevationGrid, u: number, v: number): number {
  const fc = Math.min(g.n - 1, Math.max(0, u * (g.n - 1)));
  const fr = Math.min(g.n - 1, Math.max(0, v * (g.n - 1)));
  const c0 = Math.floor(fc), r0 = Math.floor(fr);
  const c1 = Math.min(g.n - 1, c0 + 1), r1 = Math.min(g.n - 1, r0 + 1);
  const tc = fc - c0, tr = fr - r0;
  const at = (r: number, c: number) => g.values[r * g.n + c];
  const top = at(r0, c0) * (1 - tc) + at(r0, c1) * tc;
  const bot = at(r1, c0) * (1 - tc) + at(r1, c1) * tc;
  return top * (1 - tr) + bot * tr;
}
