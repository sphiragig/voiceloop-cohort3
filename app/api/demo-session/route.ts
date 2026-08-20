import { NextResponse } from "next/server";
import {
  createDemoSession,
  demoCookieName,
  demoSessionMaxAge,
  isSameOriginBrowserRequest,
  isDemoProtectionConfigured,
  rateLimit,
} from "@/lib/server/demo-protection";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isDemoProtectionConfigured()) {
    return NextResponse.json({ error: "Demo protection is not configured." }, { status: 503 });
  }
  if (!isSameOriginBrowserRequest(request)) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }
  const limited = rateLimit(request, "session", 20, 60_000);
  if (limited) return limited;

  const response = NextResponse.json({ ready: true });
  response.cookies.set(demoCookieName, createDemoSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api",
    maxAge: demoSessionMaxAge,
  });
  return response;
}
