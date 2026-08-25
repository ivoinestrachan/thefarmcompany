import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import Console from "@/components/os/Console";
import type { Farm } from "@/components/os/types";

export const dynamic = "force-dynamic";

export default async function OsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const farms = await prisma.farm.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      fields: {
        orderBy: { createdAt: "asc" },
        include: {
          plantings: { orderBy: { createdAt: "desc" } },
          scouts: { orderBy: { createdAt: "desc" } },
          soil: { orderBy: { createdAt: "desc" } },
          weeds: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  // Serialize Dates → strings for the client component.
  const data: Farm[] = farms.map((f) => ({
    id: f.id,
    name: f.name,
    location: f.location,
    fields: f.fields.map((fl) => ({
      id: fl.id,
      name: fl.name,
      landType: fl.landType,
      geometry: fl.geometry as Farm["fields"][number]["geometry"],
      areaAcres: fl.areaAcres,
      centerLat: fl.centerLat,
      centerLng: fl.centerLng,
      plantings: fl.plantings.map((p) => ({
        id: p.id,
        crop: p.crop,
        variety: p.variety,
        status: p.status,
        plantedOn: p.plantedOn ? p.plantedOn.toISOString() : null,
      })),
      scouts: fl.scouts.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        health: s.health,
        weedPressure: s.weedPressure,
        note: s.note,
        photo: s.photo,
        createdAt: s.createdAt.toISOString(),
      })),
      soil: fl.soil.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        moisture: s.moisture,
        ph: s.ph,
        temperature: s.temperature,
        nitrogen: s.nitrogen,
        phosphorus: s.phosphorus,
        potassium: s.potassium,
        note: s.note,
        createdAt: s.createdAt.toISOString(),
      })),
      weeds: fl.weeds.map((w) => ({
        id: w.id,
        lat: w.lat,
        lng: w.lng,
        density: w.density,
        species: w.species,
        note: w.note,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      })),
    })),
  }));

  return <Console user={{ id: user.id, name: user.name, email: user.email }} farms={data} />;
}
