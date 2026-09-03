// ─────────────────────────────────────────────────────────────
// Vercel Serverless Function.   호출 경로: /api/imf
//
//  ▷ 왜 필요한가?
//    IMF DataMapper API(https://www.imf.org/external/datamapper)는
//      - API 키는 필요 없지만
//      - 응답에 CORS 허용 헤더가 없어서 브라우저에서 직접 부르면 막힙니다.
//    그래서 "브라우저 → 우리 서버 함수(/api/imf) → IMF" 순서로 우회합니다.
//    이 함수는 Vercel 서버에서 실행되므로 CORS 제한을 받지 않습니다.
//
//  ▷ IMF DataMapper가 주는 것
//    World Bank가 "과거 실측치"라면, IMF는 세계경제전망(WEO)에 기반한
//    "향후 몇 년치 전망(estimate/forecast)"까지 함께 줍니다.
//    → 이 앱에서는 "경제가 앞으로 어디로 향하는가"를 보여주는 데 씁니다.
//
//  ▷ 로컬 테스트: `npm i -g vercel` 후 `vercel dev`
//    (일반 `npm run dev`(Vite)에는 /api 경로가 없으므로 배포 후 확인하세요.)
// ─────────────────────────────────────────────────────────────

// 이 앱이 허용하는 IMF 지표 코드만 통과시킵니다. (임의 요청 방지)
const ALLOWED = new Set([
  "NGDP_RPCH", // Real GDP growth (실질 GDP 성장률)
  "PCPIPCH", // Inflation rate, average consumer prices (물가상승률)
  "LUR", // Unemployment rate (실업률)
  "GGXWDG_NGDP", // General government gross debt, % of GDP (정부부채)
  "GGXCNL_NGDP", // General government net lending/borrowing, % of GDP (재정수지)
  "BCA_NGDPD", // Current account balance, % of GDP (경상수지)
  "NGDPDPC", // GDP per capita, current USD (1인당 GDP)
]);

export default async function handler(req, res) {
  // 예: /api/imf?indicator=NGDP_RPCH&country=KOR
  const { indicator, country } = req.query;

  if (!indicator || !country) {
    return res
      .status(400)
      .json({ error: "indicator 와 country 쿼리 파라미터가 모두 필요합니다." });
  }
  if (!ALLOWED.has(indicator)) {
    return res.status(400).json({ error: `허용되지 않은 지표 코드입니다: ${indicator}` });
  }
  // 국가 코드는 알파벳 3글자만 (간단한 형식 검증)
  if (!/^[A-Za-z]{3}$/.test(country)) {
    return res.status(400).json({ error: "country 는 ISO 3글자 코드여야 합니다." });
  }

  const url =
    `https://www.imf.org/external/datamapper/api/v1/` +
    `${encodeURIComponent(indicator)}/${encodeURIComponent(country.toUpperCase())}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      throw new Error(`IMF 응답 오류 (HTTP ${upstream.status})`);
    }
    const data = await upstream.json();

    // CDN이 이 응답을 6시간 캐시하도록 해서 IMF 호출 수를 아낍니다.
    res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: String(err) });
  }
}
