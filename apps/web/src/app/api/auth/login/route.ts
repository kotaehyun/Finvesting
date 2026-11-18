import { NextResponse } from "next/server";
import { passwordsMatch, SESSION_COOKIE, SESSION_TTL_MS, signSession } from "@finvesting/core";
import { appPassword, defaultUserId } from "../../../../lib/app-session";

export async function POST(req: Request) {
  const secret = appPassword();
  if (!secret) return NextResponse.json({ ok: true, open: true });
  const body: unknown = await req.json().catch(() => null);
  const password = body && typeof body === "object" && "password" in body && typeof body.password === "string"
    ? body.password
    : "";
  if (!passwordsMatch(password, secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
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
