import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

/* Proxy USDA NAIP (0.6 m aerial) for a bbox so the 3D view can use it as a
   same-origin WebGL texture. Public-domain imagery from The National Map. */
const NAIP =
  "https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/exportImage";

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = new URL(req.url).searchParams;
  const nums = ["minLng", "minLat", "maxLng", "maxLat"].map((k) => Number(p.get(k)));
  if (nums.some((n) => !Number.isFinite(n)))
    return NextResponse.json({ error: "Bad bbox." }, { status: 400 });
  const [minLng, minLat, maxLng, maxLat] = nums;

  const size = Math.min(2048, Math.max(256, Number(p.get("size")) || 1024));
  const url =
    `${NAIP}?bbox=${minLng},${minLat},${maxLng},${maxLat}` +
    `&bboxSR=4326&imageSR=4326&size=${size},${size}&format=jpg&f=image`;

  try {
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok) return NextResponse.json({ error: "Imagery unavailable." }, { status: 502 });
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagery fetch failed." }, { status: 502 });
  }
}
