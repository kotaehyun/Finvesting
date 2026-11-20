import { NextResponse } from "next/server";
import { loginBackoffMs, passwordsMatch, SESSION_COOKIE, SESSION_TTL_MS, signSession } from "@finvesting/core";
import { appPassword, defaultUserId, sessionSecret } from "../../../../lib/app-session";

let loginFailures = 0;

export async function POST(req: Request) {
  const password = appPassword();
  if (!password) return NextResponse.json({ ok: true, open: true });
  const secret = sessionSecret();
  if (!secret) {
    console.warn("APP_PASSWORD is set but SESSION_SECRET is missing");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const body: unknown = await req.json().catch(() => null);
  const given = body && typeof body === "object" && "password" in body && typeof body.password === "string"
    ? body.password
    : "";
  if (!passwordsMatch(given, password)) {
    loginFailures += 1;
    await new Promise((resolve) => setTimeout(resolve, loginBackoffMs(loginFailures)));
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  loginFailures = 0;
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
