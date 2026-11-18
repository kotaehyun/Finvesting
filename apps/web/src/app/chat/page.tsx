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
  const [pending, setPending] = useState(false);
  const sessions = trpc.chat.sessions.useQuery();
  const utils = trpc.useUtils();
  const abortRef = useRef<AbortController | null>(null);
  const turnRef = useRef(0);
  const sessionRef = useRef<string | null>(null);
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
  }, [messages, pending]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 24), 200)}px`;
  }, [input]);

  function stop() {
    abortRef.current?.abort();
  }

  async function send(text = input) {
    const q = text.trim();
    if (!q || pending) return;
    const id = ++turnRef.current;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setPending(true);
    const ac = new AbortController();
    abortRef.current = ac;
    let acc = "";
    const still = () => turnRef.current === id;
    try {
      const stream = await utils.client.chat.askStream.mutate({
        sessionId: sessionRef.current ?? undefined,
        content: q,
      }, { signal: ac.signal });
      for await (const part of stream) {
        if (!still()) return;
        if (part.sessionId) sessionRef.current = part.sessionId;
        if (!part.delta) continue;
        acc += part.delta;
        setMessages([...next, { role: "assistant", content: acc }]);
      }
      if (!still()) return;
      if (!acc && !ac.signal.aborted) {
        setMessages([...next, { role: "assistant", content: "응답이 비었습니다." }]);
      }
    } catch (e) {
      if (!still()) return;
      const aborted = ac.signal.aborted;
      const note = aborted ? "멈췄습니다." : `오류: ${e instanceof Error ? e.message : String(e)}`;
      setMessages([...next, { role: "assistant", content: acc ? `${acc}\n\n${note}` : note }]);
    } finally {
      void utils.chat.sessions.invalidate();
      if (still()) {
        setPending(false);
        abortRef.current = null;
      }
    }
  }

  async function openSession(id: string) {
    if (pending) return;
    try {
      const thread = await utils.client.chat.thread.query({ sessionId: id });
      sessionRef.current = id;
      setMessages(thread.messages);
      setMore(false);
    } catch (e) {
      setMessages([{ role: "assistant", content: `오류: ${e instanceof Error ? e.message : String(e)}` }]);
    }
  }

  function reset() {
    turnRef.current += 1;
    abortRef.current?.abort();
    setPending(false);
    sessionRef.current = null;
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
          <button type="button" className="chat-ghost" onClick={reset}>새 대화</button>
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
                    disabled={pending}
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
            {sessions.data && sessions.data.length > 0 ? (
              <div className="chat-suggest" aria-label="이전 대화" style={{ marginTop: 16 }}>
                {sessions.data.map((s) => (
                  <button key={s.id} type="button" disabled={pending} onClick={() => void openSession(s.id)}>
                    <strong>{s.title}</strong>
                    <span>{new Date(s.updatedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <ol className="chat-log">
            {messages.map((m, i) => (
              <li key={i} className={`chat-row ${m.role}`}>
                <div className="chat-bubble">
                  {m.role === "assistant" ? (
                    m.content
                      ? <div className="md"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                      : <span className="chat-wait">생각 중…</span>
                  ) : (
                    <div className="chat-plain">{m.content}</div>
                  )}
                </div>
              </li>
            ))}
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
          {pending ? (
            <button type="button" onClick={stop} aria-label="멈추기">멈추기</button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="보내기">보내기</button>
          )}
        </label>
        <p className="chat-foot">로컬 Ollama. 답은 오는 대로 이어 붙입니다. 대화는 이 기기에 남습니다. Enter 전송 · Shift+Enter 줄바꿈</p>
      </form>
    </div>
  );
}
