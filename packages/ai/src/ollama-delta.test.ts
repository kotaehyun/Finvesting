import assert from "node:assert/strict";
import { test } from "node:test";
import { ollamaChatDelta } from "./ollama-delta.ts";

test("ollama 스트림 한 줄은 토큰만 꺼낸다", () => {
  assert.equal(ollamaChatDelta(""), "");
  assert.equal(ollamaChatDelta('{"message":{"content":"안"}}'), "안");
  assert.equal(ollamaChatDelta('{"done":false,"message":{"content":""}}'), "");
});
