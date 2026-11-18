import { describe, expect, it } from "vitest";
import {
  cookieValue,
  passwordsMatch,
  readSession,
  SESSION_COOKIE,
  SESSION_TTL_MS,
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

  it("쿠키 헤더에서 세션 값만 꺼낸다", () => {
    expect(cookieValue(`a=1; ${SESSION_COOKIE}=abc`, SESSION_COOKIE)).toBe("abc");
    expect(cookieValue(null, SESSION_COOKIE)).toBe("");
  });
});
