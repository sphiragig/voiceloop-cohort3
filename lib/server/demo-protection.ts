import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const demoCookieName = "voiceloop_demo_session";
export const demoSessionMaxAge = 60 * 60;

type RateEntry = { count: number; resetAt: number };
const globalRateState = globalThis as typeof globalThis & { voiceLoopRateLimits?: Map<string, RateEntry> };
const rateLimits = globalRateState.voiceLoopRateLimits ??= new Map<string, RateEntry>();

function secret() {
  if (process.env.VOICELOOP_DEMO_TOKEN) return process.env.VOICELOOP_DEMO_TOKEN;
  return process.env.NODE_ENV === "production" ? "" : process.env.OPENAI_API_KEY || "";
}

export function isDemoProtectionConfigured() {
  return Boolean(secret());
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isSameOriginBrowserRequest(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const fetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (fetchSite !== "same-origin") return false;
  if (origin && origin !== requestOrigin) return false;
  if (referer && new URL(referer).origin !== requestOrigin) return false;
  return Boolean(origin || referer);
}

export function createDemoSession() {
  const payload = `${Math.floor(Date.now() / 1000)}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${signature(payload)}`;
}

function validSession(request: Request) {
  const raw = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${demoCookieName}=`))
    ?.slice(demoCookieName.length + 1);
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const issuedAt = Number(parts[0]);
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  return Number.isFinite(issuedAt) && age >= 0 && age <= demoSessionMaxAge && equal(parts[2], signature(payload));
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

export function rateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${clientKey(request)}`;
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count <= limit) return null;
  return NextResponse.json(
    { error: "Too many requests. Please wait and try again." },
    { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))) } },
  );
}

export function protectDemoRoute(request: Request, scope: string, limit: number, windowMs = 60_000) {
  if (!secret()) return NextResponse.json({ error: "Demo protection is not configured." }, { status: 503 });
  if (!isSameOriginBrowserRequest(request) || !validSession(request)) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }
  return rateLimit(request, scope, limit, windowMs);
}
