import { NextResponse } from "next/server";
import {
  loginBackoffMs,
  loginGate,
  passwordsMatch,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  sessionSecretUsable,
  signSession,
} from "@finvesting/core";
import { appPassword, defaultUserId, sessionSecret } from "../../../../lib/app-session";

let loginFailures = 0;
let nextAllowedAt: number | null = null;

export async function POST(req: Request) {
  const password = appPassword();
  if (!password) return NextResponse.json({ ok: true, open: true });
  const secret = sessionSecret();
  if (!sessionSecretUsable(secret)) {
    console.warn("APP_PASSWORD is set but SESSION_SECRET is missing or shorter than 32 characters");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const now = Date.now();
  const gate = loginGate(now, nextAllowedAt);
  if (!gate.allowed) {
    return NextResponse.json({ ok: false }, {
      status: 429,
      headers: { "Retry-After": String(gate.retryAfterSec) },
    });
  }
  const body: unknown = await req.json().catch(() => null);
  const given = body && typeof body === "object" && "password" in body && typeof body.password === "string"
    ? body.password
    : "";
  if (!passwordsMatch(given, password)) {
    loginFailures += 1;
    nextAllowedAt = now + loginBackoffMs(loginFailures);
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  loginFailures = 0;
  nextAllowedAt = null;
  const token = await signSession(defaultUserId(), secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
