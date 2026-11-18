"use client";

import { useState } from "react";

export function LoginPanel() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!res.ok) {
      setError("비밀번호가 맞지 않습니다.");
      return;
    }
    window.location.href = "/";
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ maxWidth: 360 }}>
      <h1 style={{ marginTop: 0, fontSize: 20 }}>로그인</h1>
      <p className="muted">이 기기의 금융 화면입니다.</p>
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", margin: "8px 0 12px" }}
      />
      <button type="submit" disabled={pending || password.length === 0}>들어가기</button>
      {error ? <p className="muted">{error}</p> : null}
    </form>
  );
}
