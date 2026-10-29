import { useEffect, useRef, useState } from "react";
import { askGemini, NEED_KEY, readUserKey, writeUserKey } from "../api/gemini.js";
import { buildSystemPrompt, suggestedQuestions } from "../lib/aiContext.js";
import { useAiContext } from "../hooks/useAiContext.jsx";

// ─────────────────────────────────────────────────────────────
// 사이트 전용 경제 AI 도우미 (Gemini). 화면 오른쪽 아래 떠 있는 채팅 패널.
//
//  - 지금 보고 있는 국가의 실제 데이터(점수·지표·IMF 전망)를 시스템 프롬프트로 함께 보내
//    "숫자를 지어내지 않고 화면 데이터에 근거해" 답하게 합니다. (lib/aiContext.js)
//  - 키 경로: Vercel이면 서버 함수(/api/chat), 아니면 사용자 본인 키(브라우저에만 저장).
// ─────────────────────────────────────────────────────────────
export function AiAssistant() {
  const { page } = useAiContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // {role:"user"|"model", text}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needKey, setNeedKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, needKey, open]);

  async function send(text, base = messages) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...base, { role: "user", text: q }];
    setMessages(next);
    setInput("");
    setError("");
    setNeedKey(false);
    setBusy(true);
    try {
      const reply = await askGemini(buildSystemPrompt(page), next.slice(-10));
      setMessages([...next, { role: "model", text: reply }]);
    } catch (err) {
      if (err.message === NEED_KEY) {
        setNeedKey(true); // 사용자 메시지는 남겨 두고, 키 저장 후 재시도
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function saveKey() {
    const k = keyInput.trim();
    if (!k) return;
    writeUserKey(k);
    setKeyInput("");
    setNeedKey(false);
    // 마지막 사용자 질문으로 다시 시도
    const last = messages[messages.length - 1];
    if (last?.role === "user") send(last.text, messages.slice(0, -1));
  }

  const suggestions = suggestedQuestions(page?.countryName);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-neutral-700"
        >
          <span aria-hidden>✦</span> 경제 AI에게 질문
        </button>
      )}

      {open && (
        <div className="fixed inset-x-3 bottom-3 z-40 flex h-[min(34rem,calc(100vh-2rem))] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[24rem]">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold">경제 AI 도우미</p>
              <p className="text-[11px] text-neutral-400">
                {page ? `${page.countryName} 화면 데이터 기반` : "일반 경제 질문"} · Gemini
              </p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    setMessages([]);
                    setError("");
                    setNeedKey(false);
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                >
                  새 대화
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="rounded-lg px-2 py-1 text-lg leading-none text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[13.5px] leading-relaxed">
            {messages.length === 0 && (
              <div>
                <p className="text-neutral-500">
                  지금 보고 있는 데이터를 바탕으로 경제 질문에 답해 드려요. 투자 조언은 하지 않아요.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-2xl border border-neutral-200 px-3.5 py-2 text-left text-neutral-700 transition hover:bg-neutral-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {busy && <p className="text-xs text-neutral-400">답변 작성 중…</p>}
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}

            {needKey && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                <p className="font-medium">Gemini API 키가 필요해요</p>
                <p className="mt-1 leading-relaxed">
                  이 사이트는 서버가 없어 개발자 키를 숨길 수 없습니다. 본인의 무료 키를 입력하면
                  <b> 이 브라우저에만</b> 저장되고 다른 곳으로 전송되지 않습니다(Google로 직접 호출).{" "}
                  <a
                    className="underline"
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                  >
                    키 발급받기
                  </a>
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveKey()}
                    placeholder="AIza..."
                    autoComplete="off"
                    className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  <button
                    onClick={saveKey}
                    className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    저장
                  </button>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-neutral-100 px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="경제에 대해 물어보세요"
              maxLength={500}
              className="min-w-0 flex-1 rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40"
            >
              전송
            </button>
          </form>
          {readUserKey() && (
            <button
              onClick={() => {
                writeUserKey("");
                setNeedKey(false);
                setError("저장된 키를 삭제했습니다.");
              }}
              className="border-t border-neutral-100 py-1.5 text-[11px] text-neutral-400 hover:text-neutral-600"
            >
              저장된 내 API 키 삭제
            </button>
          )}
        </div>
      )}
    </>
  );
}
