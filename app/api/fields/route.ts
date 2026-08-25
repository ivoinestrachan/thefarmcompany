import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { farmAccessWhere } from "@/lib/access";
import { ringAreaAcres, ringCentroid } from "@/lib/geo";

const clean = (v: unknown, max = 200) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

/** Validate a GeoJSON Polygon with a single outer ring of [lng,lat] pairs. */
function parseRing(geometry: unknown): number[][] | null {
  if (!geometry || typeof geometry !== "object") return null;
  const g = geometry as { type?: string; coordinates?: unknown };
  if (g.type !== "Polygon" || !Array.isArray(g.coordinates)) return null;
  const ring = g.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 3) return null;
  for (const pt of ring) {
    if (
      !Array.isArray(pt) ||
      pt.length < 2 ||
      typeof pt[0] !== "number" ||
      typeof pt[1] !== "number" ||
      pt[0] < -180 || pt[0] > 180 || pt[1] < -90 || pt[1] > 90
    )
      return null;
  }
  return ring as number[][];
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const farmId = clean(body.farmId, 40);
  const name = clean(body.name, 160);
  const landType = clean(body.landType, 40) || "Field";
  const ring = parseRing(body.geometry);

  if (!name) return NextResponse.json({ error: "Name this field." }, { status: 400 });
  if (!ring) return NextResponse.json({ error: "Draw a valid boundary." }, { status: 400 });

  // Ownership: the farm must belong to the signed-in user.
  const farm = await prisma.farm.findFirst({ where: { id: farmId, ...farmAccessWhere(user.id) } });
  if (!farm) return NextResponse.json({ error: "Farm not found." }, { status: 404 });

  const center = ringCentroid(ring);
  const field = await prisma.field.create({
    data: {
      farmId,
      name,
      landType,
      geometry: { type: "Polygon", coordinates: [ring] },
      areaAcres: ringAreaAcres(ring),
      centerLat: center.lat,
      centerLng: center.lng,
    },
  });
  return NextResponse.json({ field });
}
