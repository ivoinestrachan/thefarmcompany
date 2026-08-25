import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

const clean = (v: unknown, max = 200) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const farms = await prisma.farm.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { fields: true },
  });
  return NextResponse.json({ farms });
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

  const name = clean(body.name, 160);
  const location = clean(body.location, 200);
  if (!name) return NextResponse.json({ error: "Name your farm." }, { status: 400 });

  const farm = await prisma.farm.create({
    data: { userId: user.id, name, location: location || null },
  });
  return NextResponse.json({ farm });
}
