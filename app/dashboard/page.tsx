import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { farmAccessWhere } from "@/lib/access";
import Console from "@/components/os/Console";
import type { Farm, Report } from "@/components/os/types";

export const dynamic = "force-dynamic";

export default async function OsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const farms = await prisma.farm.findMany({
    where: farmAccessWhere(user.id),
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
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
    team: [
      { id: f.user.id, name: f.user.name, email: f.user.email, role: "owner" },
      ...f.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
    ],
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

  // Disease/problem reports (created on mobile or web) across the user's farms.
  const reportRows = await prisma.report.findMany({
    where: { farm: farmAccessWhere(user.id) },
    orderBy: { createdAt: "desc" },
    include: { createdBy: true, assignedTo: true },
  });
  const reports: Report[] = reportRows.map((r) => ({
    id: r.id,
    farmId: r.farmId,
    lat: r.lat,
    lng: r.lng,
    crop: r.crop,
    category: r.category,
    issue: r.issue,
    severity: r.severity,
    note: r.note,
    photo: r.photo,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy?.name ?? null,
    assignedTo: r.assignedTo ? { id: r.assignedTo.id, name: r.assignedTo.name } : null,
  }));

  return (
    <Console
      user={{ id: user.id, name: user.name, email: user.email }}
      farms={data}
      reports={reports}
    />
  );
}
