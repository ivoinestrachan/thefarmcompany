import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { farmAccessWhere } from "@/lib/access";

/* The worm mission file: a plot's operating geofence plus the weed waypoints
   to service, ranked by density. This is the literal interface the Wiggler
   consumes — standard GeoJSON so any robot stack can read it. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const field = await prisma.field.findFirst({
    where: { id, farm: farmAccessWhere(user.id) },
    include: {
      farm: true,
      plantings: { where: { status: "growing" }, orderBy: { createdAt: "desc" }, take: 1 },
      weeds: { where: { status: "active" } },
    },
  });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  const priority: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const geometry = field.geometry as { type: string; coordinates: number[][][] };

  const mission = {
    type: "FeatureCollection" as const,
    properties: {
      generator: "The Farming Company · farmOS",
      version: 1,
      farm: field.farm.name,
      plot: field.name,
      crop: field.plantings[0]?.crop ?? null,
      areaAcres: field.areaAcres,
      weedTargets: field.weeds.length,
      exportedAtIso: new Date().toISOString(),
    },
    features: [
      {
        type: "Feature" as const,
        properties: { role: "geofence", name: field.name },
        geometry,
      },
      ...field.weeds
        .sort((a, b) => (priority[b.density] ?? 0) - (priority[a.density] ?? 0))
        .map((w, i) => ({
          type: "Feature" as const,
          properties: {
            role: "weed_target",
            order: i + 1,
            density: w.density,
            priority: priority[w.density] ?? 2,
            species: w.species,
          },
          geometry: { type: "Point" as const, coordinates: [w.lng, w.lat] },
        })),
    ],
  };

  const filename = `mission-${field.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.geojson`;
  return new NextResponse(JSON.stringify(mission, null, 2), {
    headers: {
      "Content-Type": "application/geo+json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
