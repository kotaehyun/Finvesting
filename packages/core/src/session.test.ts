import { describe, expect, it } from "vitest";
import {
  cookieValue,
  loginBackoffMs,
  loginGate,
  passwordsMatch,
  readSession,
  SESSION_COOKIE,
  SESSION_SECRET_MIN_LENGTH,
  SESSION_TTL_MS,
  sessionSecretUsable,
  signSession,
} from "./session";

const userId = "00000000-0000-0000-0000-000000000001";
const secret = "test-secret";

describe("쿠키 세션", () => {
  it("서명한 토큰은 같은 비밀번호로 읽힌다", async () => {
    const now = 1_700_000_000_000;
    const token = await signSession(userId, secret, now);
    expect(await readSession(token, secret, now + 1000)).toBe(userId);
  });

  it("비밀번호가 다르거나 만료되면 거절한다", async () => {
    const now = 1_700_000_000_000;
    const token = await signSession(userId, secret, now);
    expect(await readSession(token, "other", now)).toBeNull();
    expect(await readSession(token, secret, now + SESSION_TTL_MS + 1)).toBeNull();
    expect(passwordsMatch("nope", secret)).toBe(false);
    expect(passwordsMatch(secret, secret)).toBe(true);
  });

  it("서명을 고치면 거절한다", async () => {
    const token = await signSession(userId, secret, 1_700_000_000_000);
    const flipped = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    expect(await readSession(flipped, secret)).toBeNull();
  });

  it("로그인 실패 지연은 횟수 × 500ms, 최대 5초", () => {
    expect(loginBackoffMs(1)).toBe(500);
    expect(loginBackoffMs(3)).toBe(1_500);
    expect(loginBackoffMs(20)).toBe(5_000);
    expect(loginBackoffMs(0)).toBe(0);
  });

  it("쿠키 헤더에서 세션 값만 꺼낸다", () => {
    expect(cookieValue(`a=1; ${SESSION_COOKIE}=abc`, SESSION_COOKIE)).toBe("abc");
    expect(cookieValue(null, SESSION_COOKIE)).toBe("");
  });

  it("SESSION_SECRET은 32자 미만이면 쓸 수 없다", () => {
    expect(sessionSecretUsable("")).toBe(false);
    expect(sessionSecretUsable("short")).toBe(false);
    expect(sessionSecretUsable("x".repeat(SESSION_SECRET_MIN_LENGTH - 1))).toBe(false);
    expect(sessionSecretUsable("x".repeat(SESSION_SECRET_MIN_LENGTH))).toBe(true);
  });

  it("nextAllowedAt 전이면 비교 없이 거절한다", () => {
    expect(loginGate(1_000, null)).toEqual({ allowed: true });
    expect(loginGate(1_000, 1_000)).toEqual({ allowed: true });
    expect(loginGate(1_000, 2_500)).toEqual({ allowed: false, retryAfterSec: 2 });
  });
});
