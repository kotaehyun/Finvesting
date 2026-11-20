import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@finvesting/core";

export function appPassword(): string {
  return process.env.APP_PASSWORD?.trim() ?? "";
}

export function sessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() ?? "";
}

export function defaultUserId(): string {
  return process.env.DEFAULT_USER_ID?.trim() || "00000000-0000-0000-0000-000000000001";
}

/** 비밀번호가 없으면 열려 있다. 있으면 서명 키로 이 사용자 쿠키만 통과한다. */
export async function isAuthed(): Promise<boolean> {
  const password = appPassword();
  if (!password) return true;
  const secret = sessionSecret();
  if (!secret) {
    console.warn("APP_PASSWORD is set but SESSION_SECRET is missing");
    return false;
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  return (await readSession(token, secret)) === defaultUserId();
}
