import { NextRequest, NextResponse } from "next/server";
import { FIELDS } from "@/lib/soil";
import { getFieldReadings } from "@/lib/sensor-source";

/* -------------------------------------------------------------------------- */
/*  GET /api/sensors?field=<id>                                                */
/*                                                                            */
/*  Returns the latest window of soil readings for a field. Data comes from    */
/*  the real probe gateway when it's configured (see lib/sensor-source), and   */
/*  from the built-in generator otherwise, so the endpoint always responds.    */
/* -------------------------------------------------------------------------- */

// Readings change every second — never statically cache this route.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("field") ?? FIELDS[0].id;
  const field = FIELDS.find((f) => f.id === id);

  if (!field) {
    return NextResponse.json(
      { error: `Unknown field "${id}". Known fields: ${FIELDS.map((f) => f.id).join(", ")}.` },
      { status: 400 }
    );
  }

  try {
    const readings = await getFieldReadings(field);
    return NextResponse.json(readings, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read sensors." }, { status: 502 });
  }
}
