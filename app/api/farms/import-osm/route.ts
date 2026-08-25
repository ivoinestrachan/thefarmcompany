import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { fetchOsmFields } from "@/lib/osm";

const clean = (v: unknown, max = 200) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

/* Create a farm populated with REAL field boundaries from OpenStreetMap for a
   given bounding box — vineyards/orchards/farmland with their crop tags. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name, 160) || "Imported farm";
  const location = clean(body.location, 200);
  const nums = ["minLng", "minLat", "maxLng", "maxLat"].map((k) => Number(body[k]));
  if (nums.some((n) => !Number.isFinite(n)))
    return NextResponse.json({ error: "Provide a valid bbox." }, { status: 400 });
  const [minLng, minLat, maxLng, maxLat] = nums;
  const limit = Math.min(40, Math.max(1, Number(body.limit) || 20));

  let osm;
  try {
    osm = await fetchOsmFields({ minLng, minLat, maxLng, maxLat }, limit);
  } catch {
    return NextResponse.json({ error: "Couldn't reach OpenStreetMap." }, { status: 502 });
  }
  if (osm.length === 0)
    return NextResponse.json({ error: "No mapped fields in that area." }, { status: 404 });

  const farm = await prisma.farm.create({
    data: { userId: user.id, name, location: location || null },
  });

  for (const f of osm) {
    const field = await prisma.field.create({
      data: {
        farmId: farm.id,
        name: f.name,
        landType: f.landType,
        geometry: { type: "Polygon", coordinates: [f.ring] },
        areaAcres: f.areaAcres,
        centerLat: f.center.lat,
        centerLng: f.center.lng,
      },
    });
    if (f.crop) {
      await prisma.planting.create({
        data: { fieldId: field.id, crop: f.crop, status: "growing" },
      });
    }
  }

  return NextResponse.json({ farm, imported: osm.length });
}
