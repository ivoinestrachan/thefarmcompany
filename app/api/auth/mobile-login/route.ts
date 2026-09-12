import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken } from "@/lib/auth";

const clean = (v: unknown, max = 254) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

/* Token login for the mobile app — returns a bearer token instead of setting
   an httpOnly cookie. */
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
  const invalid = () => NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  if (!user) return invalid();
  if (!(await verifyPassword(password, user.passwordHash))) return invalid();

  const token = await createSessionToken(user.id);
  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
