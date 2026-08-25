import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { farmAccessWhere } from "@/lib/access";

const clean = (v: unknown, max = 200) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

const WEED = new Set(["none", "low", "medium", "high"]);
// ~1.3MB of base64 — plenty for a downscaled scouting photo.
const MAX_PHOTO = 1_800_000;

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
  const health = Math.min(5, Math.max(1, Math.round(Number(body.health) || 3)));
  const weedPressure = WEED.has(String(body.weedPressure)) ? String(body.weedPressure) : "none";
  const note = clean(body.note, 500);
  const photo =
    typeof body.photo === "string" && body.photo.startsWith("data:image/")
      ? body.photo.slice(0, MAX_PHOTO)
      : null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
    return NextResponse.json({ error: "Invalid location." }, { status: 400 });

  const field = await prisma.field.findFirst({
    where: { id: fieldId, farm: farmAccessWhere(user.id) },
  });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  const observation = await prisma.observation.create({
    data: { fieldId, lat, lng, health, weedPressure, note: note || null, photo },
  });
  return NextResponse.json({ observation });
}
