import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { farmAccessWhere } from "@/lib/access";
import { cropColor, NO_CROP_COLOR } from "@/lib/crops";

/* Everything the mobile app needs on launch: the user's farms (with a map
   centre) and each farm's team members (the laborers you can dispatch). */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farms = await prisma.farm.findMany({
    where: farmAccessWhere(user.id),
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      members: { include: { user: true } },
      fields: { include: { plantings: { orderBy: { createdAt: "desc" } } } },
    },
  });

  const data = farms.map((f) => {
    const pts = f.fields;
    const center =
      pts.length > 0
        ? {
            lat: pts.reduce((a, p) => a + p.centerLat, 0) / pts.length,
            lng: pts.reduce((a, p) => a + p.centerLng, 0) / pts.length,
          }
        : { lat: 38.38, lng: -122.24 };
    const team = [
      { id: f.user.id, name: f.user.name, email: f.user.email, role: "owner" },
      ...f.members.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role })),
    ];
    // Field outlines as {latitude,longitude} rings, coloured by crop (matches web).
    const fields = pts.map((fl) => {
      const geo = fl.geometry as { coordinates?: number[][][] };
      const ring = geo.coordinates?.[0] ?? [];
      const growing = fl.plantings.find((p) => p.status === "growing");
      const crop = (growing ?? fl.plantings[0])?.crop ?? null;
      return {
        id: fl.id,
        name: fl.name,
        crop,
        color: crop ? cropColor(crop) : NO_CROP_COLOR,
        coords: ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      };
    });
    return { id: f.id, name: f.name, location: f.location, center, team, fields };
  });

  return NextResponse.json({ user, farms: data });
}
