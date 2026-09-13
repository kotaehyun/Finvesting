"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { trpc } from "@/lib/trpc";
import { CHAT_STARTERS } from "./starters";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const ask = trpc.chat.ask.useMutation();

  async function send(text = input) {
    const q = text.trim();
    if (!q || ask.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
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
      <p className="muted">자산·현금흐름·보유·뉴스·거시지표를 바탕으로 로컬 LLM이 답합니다. 아래 목록을 누르면 바로 묻습니다. (Ollama 실행 필요)</p>
      <div className="starters" aria-label="대화 목록">
        {CHAT_STARTERS.map((g) => (
          <section key={g.group}>
            <h2>{g.group}</h2>
            <div className="starter-list">
              {g.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="starter"
                  disabled={ask.isPending}
                  title={item.prompt}
                  onClick={() => send(item.prompt)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} className={`card ${m.role === "user" ? "user" : ""}`}>
            <h3>{m.role === "user" ? "나" : "비서"}</h3>
            {m.role === "assistant"
              ? <div className="md"><ReactMarkdown>{m.content}</ReactMarkdown></div>
              : <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>}
          </div>
        ))}
        {ask.isPending && <div className="muted">생각 중…</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          // 한글 IME 조합 중 Enter는 무시 (조합 확정 + 전송이 겹쳐 마지막 글자가 따로 전송되는 문제)
          onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          placeholder="예: 지금 환율·금리 상황에서 미국 ETF 추가 매수가 맞을까?"
          style={{ flex: 1 }}
        />
        <button onClick={send} disabled={ask.isPending}>보내기</button>
      </div>
    </>
  );
}
