"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const ask = trpc.chat.ask.useMutation();

  async function send() {
    if (!input.trim()) return;
    const next: Msg[] = [...messages, { role: "user", content: input }];
    setMessages(next); setInput("");
    try {
      const r = await ask.mutateAsync({ messages: next });
      setMessages([...next, { role: "assistant", content: r.answer }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `오류: ${e instanceof Error ? e.message : String(e)}` }]);
    }
  }

  return (
    <>
      <h1>투자 비서</h1>
      <p className="muted">수집된 뉴스·거시지표를 바탕으로 로컬 LLM이 답합니다. (Ollama 실행 필요)</p>
      <div style={{ display: "grid", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} className="card" style={{ background: m.role === "user" ? "#8881" : "transparent" }}>
            <h3>{m.role === "user" ? "나" : "비서"}</h3>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {ask.isPending && <div className="muted">생각 중…</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="예: 지금 환율·금리 상황에서 미국 ETF 추가 매수가 맞을까?" style={{ flex: 1, padding: 10 }} />
        <button onClick={send} disabled={ask.isPending}>보내기</button>
      </div>
    </>
  );
}
