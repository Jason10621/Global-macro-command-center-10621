// ─────────────────────────────────────────────────────────────
// Vercel Serverless Function.   호출 경로: /api/chat
//
//  ▷ 왜 필요한가?
//    Gemini API는 키가 필요합니다. 키를 브라우저 코드에 넣으면 누구나 훔쳐 쓸 수 있으니,
//    Vercel 배포에서는 키를 서버 환경변수(GEMINI_API_KEY)에만 두고
//    "브라우저 → /api/chat → Gemini" 순서로 중계합니다.
//
//  ▷ GitHub Pages는?
//    정적 호스팅이라 이 함수가 없습니다. 그 경우 앱이 자동으로
//    "사용자가 직접 입력한 본인 Gemini 키(브라우저에만 저장)"로 폴백합니다. (src/api/gemini.js)
//
//  ▷ 남용 방지: 길이 제한 + 허용 모델 고정. (학교 프로젝트 수준의 최소 방어)
// ─────────────────────────────────────────────────────────────

// 항상 최신을 가리키는 별칭 + 과부하/종료 시 가벼운 모델 폴백 (src/api/gemini.js 와 같은 이유)
const MODELS = [process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"];
const MAX_SYSTEM = 12000; // 시스템 프롬프트(경제 데이터 요약) 최대 글자 수
const MAX_TURNS = 12; // 대화 최대 턴 수
const MAX_TEXT = 2000; // 한 메시지 최대 글자 수

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 지원합니다." });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "서버에 GEMINI_API_KEY가 설정되어 있지 않습니다." });

  const { system, contents } = req.body ?? {};
  if (!Array.isArray(contents) || contents.length === 0 || contents.length > MAX_TURNS) {
    return res.status(400).json({ error: "contents 형식이 올바르지 않습니다." });
  }
  const clean = contents.map((c) => ({
    role: c?.role === "model" ? "model" : "user",
    parts: [{ text: String(c?.parts?.[0]?.text ?? "").slice(0, MAX_TEXT) }],
  }));

  try {
    let upstream, data;
    for (const model of MODELS) {
      upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: String(system ?? "").slice(0, MAX_SYSTEM) }] },
            contents: clean,
            generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
          }),
        }
      );
      data = await upstream.json();
      if (upstream.ok || ![404, 429, 503].includes(upstream.status)) break;
    }
    if (!upstream.ok) {
      return res.status(502).json({ error: data?.error?.message ?? `Gemini 오류 (HTTP ${upstream.status})` });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: String(err) });
  }
}
