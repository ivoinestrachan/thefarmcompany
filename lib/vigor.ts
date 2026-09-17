import type { Field } from "@/components/os/types";

/* Vine-vigor heatmap: a visible-band greenness index (VARI) computed from the
   free NAIP aerial, colour-ramped and clipped to the field polygons. It's a
   real vegetation index (not true NDVI — no near-infrared band). Runs in the
   browser (uses canvas). Shared by the 2D map and the 3D view. */

export type VigorPoint = { lng: number; lat: number; score: number; color: string };
export type VigorCell = { lng: number; lat: number; t: number; color: string };
export type VigorResult = {
  url: string;
  coordinates: [[number, number], [number, number], [number, number], [number, number]];
  points: VigorPoint[];
  cells: VigorCell[];
  cellMeters: number;
  bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number };
};

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
export function vigorColor(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t)) * (VIGOR_STOPS.length - 1);
  const i = Math.floor(x), f = x - i;
  const a = VIGOR_STOPS[i], b = VIGOR_STOPS[Math.min(VIGOR_STOPS.length - 1, i + 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

export async function computeVigor(fields: Field[]): Promise<VigorResult> {
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

  // A few of the most-stressed, spread-out spots to flag as problems.
  const cand: { gx: number; gy: number; t: number }[] = [];
  const step = Math.max(20, Math.floor(S / 16));
  for (let gy = step / 2; gy < S; gy += step)
    for (let gx = step / 2; gx < S; gx += step) {
      const i = Math.floor(gy) * S + Math.floor(gx);
      if (maskData[i * 4 + 3] < 128 || Number.isNaN(vari[i])) continue;
      cand.push({ gx, gy, t: Math.max(0, Math.min(1, (vari[i] - lo) / span)) });
    }
  cand.sort((a, b) => a.t - b.t);
  const chosen: typeof cand = [];
  const minPx = S * 0.13;
  for (const c of cand) {
    if (c.t > 0.45) break;
    if (chosen.every((o) => Math.hypot(o.gx - c.gx, o.gy - c.gy) > minPx)) {
      chosen.push(c);
      if (chosen.length >= 5) break;
    }
  }
  const points: VigorPoint[] = chosen.map((c) => {
    const [cr, cg, cb] = vigorColor(c.t);
    return {
      lng: minLng + (c.gx / S) * (maxLng - minLng),
      lat: maxLat - (c.gy / S) * (maxLat - minLat),
      score: Math.round(c.t * 100),
      color: `rgb(${cr | 0},${cg | 0},${cb | 0})`,
    };
  });

  // Coarse cell grid → a discrete mosaic (like drone vigor tiles) for 3D.
  const GRID = 70;
  const cstep = S / GRID;
  const midLat = (minLat + maxLat) / 2;
  const widthM = (maxLng - minLng) * 111320 * Math.cos((midLat * Math.PI) / 180);
  const cellMeters = widthM / GRID;
  const cells: VigorCell[] = [];
  for (let gy = cstep / 2; gy < S; gy += cstep)
    for (let gx = cstep / 2; gx < S; gx += cstep) {
      const i = Math.floor(gy) * S + Math.floor(gx);
      if (maskData[i * 4 + 3] < 128 || Number.isNaN(vari[i])) continue;
      const t = Math.max(0, Math.min(1, (vari[i] - lo) / span));
      const [cr, cg, cb] = vigorColor(t);
      cells.push({
        lng: minLng + (gx / S) * (maxLng - minLng),
        lat: maxLat - (gy / S) * (maxLat - minLat),
        t,
        color: `rgb(${cr | 0},${cg | 0},${cb | 0})`,
      });
    }

  return {
    url: out.toDataURL("image/png"),
    coordinates: [[minLng, maxLat], [maxLng, maxLat], [maxLng, minLat], [minLng, minLat]],
    points,
    cells,
    cellMeters,
    bounds: { minLng, minLat, maxLng, maxLat },
  };
}
