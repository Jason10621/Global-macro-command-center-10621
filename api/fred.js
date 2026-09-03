// ─────────────────────────────────────────────────────────────
// Vercel Serverless Function.   호출 경로: /api/fred
//
//  ▷ 왜 필요한가? (Phase 8 - 레벨업 단계)
//    FRED(미국 세인트루이스 연준) API는
//      1) API 키가 필요하고
//      2) 브라우저에서 직접 부르면 CORS 정책에 막힙니다.
//    그래서 "브라우저 → 우리 서버 함수(/api/fred) → FRED" 순서로 우회합니다.
//    이 함수는 Vercel이 서버에서 실행하므로 CORS 제한이 없고, API 키도 숨길 수 있습니다.
//
//  ▷ 설정 방법
//    1) FRED 키 무료 발급: https://fredaccount.stlouisfed.org/apikeys
//    2) Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
//       이름: FRED_API_KEY   값: (발급받은 키)
//    3) 재배포하면 이 함수가 process.env.FRED_API_KEY 로 키를 읽습니다.
//
//  ▷ 로컬에서 테스트하려면
//    `npm i -g vercel` 후 `vercel dev` 로 실행하면 /api 경로가 살아납니다.
//    (일반 `npm run dev`(Vite)에는 /api가 없으므로 이 기능은 배포 후 확인하세요.)
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // 쿼리스트링에서 series_id(필수), start(선택) 를 꺼냅니다.
  //   예: /api/fred?series_id=CPIAUCSL&start=2015-01-01
  const { series_id, start = "2015-01-01" } = req.query;

  if (!series_id) {
    return res.status(400).json({ error: "series_id 쿼리 파라미터가 필요합니다." });
  }

  const key = process.env.FRED_API_KEY;
  if (!key) {
    return res
      .status(500)
      .json({ error: "서버에 FRED_API_KEY 환경변수가 설정되지 않았습니다." });
  }

  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${encodeURIComponent(series_id)}` +
    `&observation_start=${encodeURIComponent(start)}` +
    `&file_type=json&api_key=${key}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      throw new Error(`FRED 응답 오류 (HTTP ${upstream.status})`);
    }
    const data = await upstream.json();

    // CDN이 이 응답을 1시간 캐시하도록 해서 FRED 호출 수를 아낍니다.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: String(err) });
  }
}
