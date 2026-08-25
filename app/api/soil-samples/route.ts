import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

const clean = (v: unknown, max = 200) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

/** Optional numeric field, clamped to a sane range; null when blank. */
function num(v: unknown, min: number, max: number): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
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

  const fieldId = clean(body.fieldId, 40);
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
    return NextResponse.json({ error: "Invalid location." }, { status: 400 });

  const field = await prisma.field.findFirst({
    where: { id: fieldId, farm: { userId: user.id } },
  });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  const sample = await prisma.soilSample.create({
    data: {
      fieldId,
      lat,
      lng,
      moisture: num(body.moisture, 0, 100),
      ph: num(body.ph, 0, 14),
      temperature: num(body.temperature, -50, 80),
      nitrogen: num(body.nitrogen, 0, 10000),
      phosphorus: num(body.phosphorus, 0, 10000),
      potassium: num(body.potassium, 0, 10000),
      note: clean(body.note, 500) || null,
    },
  });
  return NextResponse.json({ sample });
}
