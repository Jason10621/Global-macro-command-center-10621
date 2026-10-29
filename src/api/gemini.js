// ─────────────────────────────────────────────────────────────
// Gemini 호출 "클라이언트 쪽" 도우미. (IMF·FRED와 같은 이중 경로 구조)
//
//   1) /api/chat 서버 함수 — Vercel 배포 + GEMINI_API_KEY 환경변수가 있을 때. 키가 서버에만 있어 안전.
//   2) 사용자 본인 키 — GitHub Pages 같은 정적 호스팅에서는 서버 함수가 없으므로,
//      사용자가 자기 Gemini 키(무료 발급: https://aistudio.google.com/apikey)를 입력하면
//      그 키를 "이 브라우저의 localStorage에만" 저장하고 Gemini에 직접 호출합니다.
//      (Gemini API는 CORS를 허용하므로 브라우저에서 바로 호출 가능)
//
//  ▷ 왜 개발자 키를 정적 사이트에 박지 않나?
//    정적 파일에 넣은 키는 개발자도구로 누구나 볼 수 있어 곧바로 도용됩니다.
// ─────────────────────────────────────────────────────────────

const MODEL = "gemini-2.5-flash";
const KEY_STORAGE = "gmcc:geminiKey:v1";

export const NEED_KEY = "NEED_KEY";

export function readUserKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}
export function writeUserKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* 저장 불가 환경 — 이번 세션 동안만 메모리에 유지되지 않음 */
  }
}

// 서버 함수 사용 가능 여부를 한 번 실패하면 기억해 불필요한 404 요청을 줄입니다.
let proxyUnavailable = false;

function extractText(data) {
  const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!text) {
    const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
    throw new Error(reason ? `응답이 비어 있습니다 (${reason})` : "응답이 비어 있습니다.");
  }
  return text;
}

/**
 * @param {string} system  경제 데이터 요약 + 규칙이 담긴 시스템 프롬프트
 * @param {Array<{role:"user"|"model", text:string}>} history  대화 기록 (마지막이 사용자 질문)
 * @returns {Promise<string>} 모델 답변
 */
export async function askGemini(system, history) {
  const contents = history.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));

  if (!proxyUnavailable) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, contents }),
      });
      if (res.ok) return extractText(await res.json());
      // 404/405(함수 없음) · 503(서버 키 없음) → 사용자 키 경로로 폴백
      if ([404, 405, 501, 503].includes(res.status)) proxyUnavailable = true;
      else throw new Error((await res.json().catch(() => ({})))?.error ?? `AI 서버 오류 (HTTP ${res.status})`);
    } catch (err) {
      if (!(err instanceof TypeError)) throw err; // 네트워크 오류(TypeError)만 폴백
      proxyUnavailable = true;
    }
  }

  const key = readUserKey();
  if (!key) throw new Error(NEED_KEY);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 400 || res.status === 403) {
      throw new Error(data?.error?.message || "API 키가 올바르지 않습니다. 키를 다시 확인해주세요.");
    }
    throw new Error(data?.error?.message || `Gemini 오류 (HTTP ${res.status})`);
  }
  return extractText(data);
}
