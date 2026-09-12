import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { farmAccessWhere } from "@/lib/access";

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
      fields: { select: { centerLat: true, centerLng: true } },
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
    return { id: f.id, name: f.name, location: f.location, center, team };
  });

  return NextResponse.json({ user, farms: data });
}
