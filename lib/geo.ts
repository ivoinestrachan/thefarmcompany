/* Geodesic helpers for field polygons. Rings are [lng, lat] pairs. */

const EARTH_RADIUS_M = 6378137;
const SQM_PER_ACRE = 4046.8564224;

const toRad = (d: number) => (d * Math.PI) / 180;

/** Spherical polygon area in square metres (same method as turf.area). */
export function ringAreaSqm(ring: number[][]): number {
  if (ring.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];
    total += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

export function ringAreaAcres(ring: number[][]): number {
  return ringAreaSqm(ring) / SQM_PER_ACRE;
}

/** Simple centroid of the ring vertices — good enough for map labels. */
export function ringCentroid(ring: number[][]): { lng: number; lat: number } {
  const closed =
    ring.length > 1 &&
    Math.abs(ring[0][0] - ring[ring.length - 1][0]) < 1e-9 &&
    Math.abs(ring[0][1] - ring[ring.length - 1][1]) < 1e-9;
  const pts = closed ? ring.slice(0, -1) : ring;
  const sum = pts.reduce(
    (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
    { lng: 0, lat: 0 }
  );
  return { lng: sum.lng / pts.length, lat: sum.lat / pts.length };
}
