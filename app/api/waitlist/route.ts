import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const clean = (v: unknown, max = 200) =>
  (typeof v === "string" ? v : "").trim().slice(0, max);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  const farm = clean(body.farm, 160);
  const location = clean(body.location, 160);
  const site = clean(body.site, 300);

  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (!farm) {
    return NextResponse.json({ error: "Please enter your farm name." }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: "Please enter your location." }, { status: 400 });
  }

  try {
    await prisma.signup.create({
      data: { name, email, farm, location, site: site || null },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("waitlist: db error", err);
    return NextResponse.json(
      { error: "Couldn't submit right now. Please try again." },
      { status: 500 }
    );
  }
}
