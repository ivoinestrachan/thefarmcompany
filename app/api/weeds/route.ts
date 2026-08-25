import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { farmAccessWhere, fieldAccessWhere } from "@/lib/access";

const clean = (v: unknown, max = 200) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);
const DENSITY = new Set(["low", "medium", "high"]);

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const fieldId = clean(body.fieldId, 40);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const density = DENSITY.has(String(body.density)) ? String(body.density) : "medium";
  const species = clean(body.species, 120);
  const note = clean(body.note, 500);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
    return NextResponse.json({ error: "Invalid location." }, { status: 400 });

  const field = await prisma.field.findFirst({
    where: { id: fieldId, farm: farmAccessWhere(user.id) },
  });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  const weed = await prisma.weedPin.create({
    data: { fieldId, lat, lng, density, species: species || null, note: note || null },
  });
  return NextResponse.json({ weed });
}

// Toggle a weed pin between active and cleared.
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = clean(body.id, 40);
  const status = clean(body.status, 20) === "cleared" ? "cleared" : "active";

  // Ownership: pin -> field -> farm -> user.
  const pin = await prisma.weedPin.findFirst({
    where: { id, field: fieldAccessWhere(user.id) },
  });
  if (!pin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const weed = await prisma.weedPin.update({ where: { id }, data: { status } });
  return NextResponse.json({ weed });
}
