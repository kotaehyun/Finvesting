"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { trpc } from "@/lib/trpc";
import { CHAT_STARTERS } from "./starters";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [more, setMore] = useState(false);
  const ask = trpc.chat.ask.useMutation();
  const threadRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setInput(q);
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 24), 200)}px`;
  }, [input]);

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

  function reset() {
    if (ask.isPending) return;
    setMessages([]);
    setInput("");
    setMore(false);
    const u = new URL(window.location.href);
    if (u.searchParams.has("q")) {
      u.searchParams.delete("q");
      window.history.replaceState({}, "", `${u.pathname}${u.search}`);
    }
    boxRef.current?.focus();
  }

  const empty = messages.length === 0;
  const shown = more
    ? CHAT_STARTERS
    : CHAT_STARTERS.map((g) => ({ group: g.group, items: g.items.slice(0, 1) }));

  return (
    <div className="chat-shell">
      <header className="chat-top">
        <h1>투자 봇AI</h1>
        {messages.length > 0 ? (
          <button type="button" className="chat-ghost" onClick={reset} disabled={ask.isPending}>새 대화</button>
        ) : null}
      </header>
      <div className="chat-thread" ref={threadRef}>
        {empty ? (
          <div className="chat-empty">
            <p className="chat-hello">무엇을 도와드릴까요?</p>
            <p className="muted">자산·현금흐름·보유·뉴스를 이 기기 로컬 LLM이 봅니다. 매수는 단정하지 않습니다.</p>
            <div className="chat-suggest" aria-label="대화 제안">
              {shown.map((g) =>
                g.items.map((item) => (
                  <button
                    key={`${g.group}-${item.label}`}
                    type="button"
                    disabled={ask.isPending}
                    title={item.prompt}
                    onClick={() => void send(item.prompt)}
                  >
                    <strong>{item.label}</strong>
                    <span>{g.group}</span>
                  </button>
                )),
              )}
            </div>
            {more ? null : (
              <button type="button" className="chat-ghost" onClick={() => setMore(true)}>다른 질문</button>
            )}
          </div>
        ) : (
          <ol className="chat-log">
            {messages.map((m, i) => (
              <li key={i} className={`chat-row ${m.role}`}>
                <div className="chat-bubble">
                  {m.role === "assistant" ? (
                    <div className="md"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                  ) : (
                    <div className="chat-plain">{m.content}</div>
                  )}
                </div>
              </li>
            ))}
            {ask.isPending ? (
              <li className="chat-row assistant" aria-live="polite">
                <div className="chat-bubble"><span className="chat-wait">생각 중…</span></div>
              </li>
            ) : null}
          </ol>
        )}
      </div>
      <form
        className="chat-dock"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="chat-composer">
          <textarea
            ref={boxRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="메시지 보내기"
            aria-label="메시지"
            autoComplete="off"
          />
          <button type="submit" disabled={ask.isPending || !input.trim()} aria-label="보내기">보내기</button>
        </label>
        <p className="chat-foot">로컬 Ollama. 대화는 저장하지 않습니다. Enter 전송 · Shift+Enter 줄바꿈</p>
      </form>
    </div>
  );
}
