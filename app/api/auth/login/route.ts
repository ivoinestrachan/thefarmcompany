import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

const clean = (v: unknown, max = 254) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = clean(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message either way — don't reveal whether the email exists.
  const invalid = () =>
    NextResponse.json({ error: "Wrong email or password." }, { status: 401 });

  if (!user) return invalid();
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return invalid();

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
