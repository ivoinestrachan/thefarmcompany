import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { farmAccessWhere } from "@/lib/access";

const clean = (v: unknown, max = 500) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);
const SEVERITY = new Set(["low", "medium", "high"]);
const MAX_PHOTO = 1_800_000;

function serialize(r: {
  id: string; farmId: string; lat: number; lng: number; crop: string | null;
  issue: string | null; severity: string; note: string | null; photo: string | null;
  status: string; createdAt: Date;
  createdBy: { name: string } | null; assignedTo: { id: string; name: string } | null;
}) {
  return {
    id: r.id, farmId: r.farmId, lat: r.lat, lng: r.lng, crop: r.crop, issue: r.issue,
    severity: r.severity, note: r.note, photo: r.photo, status: r.status,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy?.name ?? null,
    assignedTo: r.assignedTo ? { id: r.assignedTo.id, name: r.assignedTo.name } : null,
  };
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farmId = new URL(req.url).searchParams.get("farmId") || undefined;
  const reports = await prisma.report.findMany({
    where: { farm: farmAccessWhere(user.id), ...(farmId ? { farmId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { createdBy: true, assignedTo: true },
  });
  return NextResponse.json({ reports: reports.map(serialize) });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const farmId = clean(body.farmId, 40);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const severity = SEVERITY.has(String(body.severity)) ? String(body.severity) : "medium";
  const photo =
    typeof body.photo === "string" && body.photo.startsWith("data:image/")
      ? body.photo.slice(0, MAX_PHOTO)
      : null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return NextResponse.json({ error: "Location required." }, { status: 400 });

  const farm = await prisma.farm.findFirst({ where: { id: farmId, ...farmAccessWhere(user.id) } });
  if (!farm) return NextResponse.json({ error: "Farm not found." }, { status: 404 });

  const report = await prisma.report.create({
    data: {
      farmId, createdById: user.id, lat, lng, severity, photo,
      crop: clean(body.crop, 120) || null,
      issue: clean(body.issue, 160) || null,
      note: clean(body.note, 500) || null,
    },
    include: { createdBy: true, assignedTo: true },
  });
  return NextResponse.json({ report: serialize(report) });
}

// Assign to a laborer / change status.
export async function PATCH(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = clean(body.id, 40);
  const existing = await prisma.report.findFirst({
    where: { id, farm: farmAccessWhere(user.id) },
  });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const data: { assignedToId?: string | null; status?: string } = {};
  if ("assignedToId" in body) {
    const aid = clean(body.assignedToId, 40) || null;
    data.assignedToId = aid;
    if (aid && existing.status === "open") data.status = "assigned";
  }
  if (typeof body.status === "string" && ["open", "assigned", "resolved"].includes(body.status)) {
    data.status = body.status;
  }

  const report = await prisma.report.update({
    where: { id },
    data,
    include: { createdBy: true, assignedTo: true },
  });
  return NextResponse.json({ report: serialize(report) });
}
