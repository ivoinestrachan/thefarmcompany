import { NextResponse } from "next/server";

/* Allow the Expo web build (served on a different port) to call the mobile API
   routes cross-origin, including preflight. */
export function middleware(req: Request) {
  const res =
    req.method === "OPTIONS" ? new NextResponse(null, { status: 204 }) : NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export const config = {
  matcher: ["/api/mobile/:path*", "/api/auth/mobile-login"],
};
