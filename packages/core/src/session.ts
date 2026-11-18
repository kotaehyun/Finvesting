/** 쿠키 세션. 비밀번호는 인자로만 받고 저장하지 않는다. 사용자는 한 명이다. */

export const SESSION_COOKIE = "finvesting_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function utf8(value: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(value);
  const copy = new Uint8Array(encoded.byteLength);
  copy.set(encoded);
  return copy;
}

function b64url(data: Uint8Array): string {
  let bin = "";
  for (const byte of data) bin += String.fromCharCode(byte);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fixedEqual(a: string, b: string): boolean {
  const left = utf8(a);
  const right = utf8(b);
  const len = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < len; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, utf8(payload));
  return b64url(new Uint8Array(sig));
}

export function passwordsMatch(input: string, expected: string): boolean {
  return fixedEqual(input, expected);
}

export async function signSession(userId: string, secret: string, now = Date.now()): Promise<string> {
  const exp = String(now + SESSION_TTL_MS);
  const body = `${userId}.${exp}`;
  return `${body}.${await hmac(body, secret)}`;
}

/** 서명이 맞고 만료 전이며 사용자 아이디에 점이 없을 때만 아이디를 돌려준다. */
export async function readSession(token: string, secret: string, now = Date.now()): Promise<string | null> {
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!userId || !exp || !sig || !/^\d+$/.test(exp)) return null;
  if (Number(exp) <= now) return null;
  const expected = await hmac(`${userId}.${exp}`, secret);
  if (!fixedEqual(sig, expected)) return null;
  return userId;
}

export function cookieValue(header: string | null | undefined, name: string): string {
  if (!header) return "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      return "";
    }
  }
  return "";
}
