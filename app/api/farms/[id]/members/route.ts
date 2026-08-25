import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { farmAccessWhere } from "@/lib/access";

const clean = (v: unknown, max = 254) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);
const ROLES = new Set(["manager", "scout", "member"]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: farmId } = await ctx.params;
  const farm = await prisma.farm.findFirst({ where: { id: farmId, ...farmAccessWhere(user.id) } });
  if (!farm) return NextResponse.json({ error: "Farm not found." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = clean(body.email).toLowerCase();
  const role = ROLES.has(String(body.role)) ? String(body.role) : "member";
  if (!email) return NextResponse.json({ error: "Enter an email." }, { status: 400 });

  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee)
    return NextResponse.json(
      { error: "No account with that email yet — ask them to sign up first." },
      { status: 404 }
    );
  if (invitee.id === farm.userId)
    return NextResponse.json({ error: "That's the farm owner." }, { status: 409 });

  await prisma.farmMember.upsert({
    where: { farmId_userId: { farmId, userId: invitee.id } },
    update: { role },
    create: { farmId, userId: invitee.id, role },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: farmId } = await ctx.params;
  const farm = await prisma.farm.findFirst({ where: { id: farmId, ...farmAccessWhere(user.id) } });
  if (!farm) return NextResponse.json({ error: "Farm not found." }, { status: 404 });

  const userId = clean(new URL(req.url).searchParams.get("userId"), 40);
  if (!userId) return NextResponse.json({ error: "Missing user." }, { status: 400 });

  await prisma.farmMember.deleteMany({ where: { farmId, userId } });
  return NextResponse.json({ ok: true });
}
