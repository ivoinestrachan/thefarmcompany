import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

const clean = (v: unknown, max = 200) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

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
  const crop = clean(body.crop, 120);
  const variety = clean(body.variety, 120);
  const status = clean(body.status, 20) || "growing";
  const plantedOnRaw = clean(body.plantedOn, 30);
  const plantedOn = plantedOnRaw ? new Date(plantedOnRaw) : null;

  if (!crop) return NextResponse.json({ error: "What's the crop?" }, { status: 400 });

  // Ownership check: field -> farm -> user.
  const field = await prisma.field.findFirst({
    where: { id: fieldId, farm: { userId: user.id } },
  });
  if (!field) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  const planting = await prisma.planting.create({
    data: {
      fieldId,
      crop,
      variety: variety || null,
      status,
      plantedOn: plantedOn && !isNaN(plantedOn.getTime()) ? plantedOn : null,
    },
  });
  return NextResponse.json({ planting });
}
