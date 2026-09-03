// ─────────────────────────────────────────────────────────────
// DBnomics API 호출 전용 파일.  (경기 국면 화면에서 사용)
//
//  ▷ DBnomics(db.nomics.world)는 무엇인가?
//    프랑스 CEPREMAP이 운영하는 "경제 데이터 허브"입니다.
//    IMF·OECD·Eurostat·World Bank·각국 중앙은행 등 90여 개 기관의 데이터를
//    하나의 통일된 JSON API로 다시 제공합니다.
//    - API 키 불필요 + CORS 허용(Access-Control-Allow-Origin: *) → 브라우저 직접 호출 OK.
//
//  ▷ 여기서 가져오는 것: OECD 경기 판단 지표 3종 (월간)
//    - CLI   (Composite Leading Indicator, 경기선행지수):
//            6~9개월 뒤 경기 흐름을 미리 보여주는 지수. 100 = 장기 추세.
//    - BCI   (Business Confidence, 기업경기실사지수): 기업들이 느끼는 체감 경기.
//    - CCI   (Consumer Confidence, 소비자심리지수): 가계가 느끼는 체감 경기.
//    세 지표 모두 "100보다 크면 장기 평균보다 좋음, 작으면 나쁨"으로 읽습니다.
//
//  ▷ 데이터셋: OECD / DSD_STES@DF_CLI
//    시리즈 코드 형식:  {ISO3}.M.{지표}.IX._Z.AA.IX._Z.H
//      M  = Monthly,  AA = amplitude-adjusted(진폭 조정, 100 기준으로 비교 쉬움)
// ─────────────────────────────────────────────────────────────

const BASE = "https://api.db.nomics.world/v22";
const DATASET = "OECD/DSD_STES@DF_CLI";

// 화면에서 쓰는 짧은 이름 → OECD 지표 코드
const METRIC_CODE = {
  cli: "LI", // Composite leading indicator
  bci: "BCICP", // Business confidence
  cci: "CCICP", // Consumer confidence
};

// {ISO3}, 지표키 → 전체 시리즈 ID 문자열
function seriesId(iso3, metricKey) {
  return `${DATASET}/${iso3}.M.${METRIC_CODE[metricKey]}.IX._Z.AA.IX._Z.H`;
}

/**
 * 한 국가의 CLI·BCI·CCI 월간 시계열을 "한 번의 요청"으로 가져옵니다.
 *
 * @param {string} iso3  3글자 국가 코드 (indicators.js의 ISO3 표에서 변환)
 * @returns {Promise<{
 *   cli: Array<{date:string, value:number}>,
 *   bci: Array<{date:string, value:number}>,
 *   cci: Array<{date:string, value:number}>
 * }>}
 */
export async function fetchLeadingIndicators(iso3) {
  const keys = ["cli", "bci", "cci"];
  const ids = keys.map((k) => seriesId(iso3, k)).join(",");

  const res = await fetch(
    `${BASE}/series?series_ids=${encodeURIComponent(ids)}&observations=1`
  );
  if (!res.ok) throw new Error(`DBnomics 서버 응답 오류 (HTTP ${res.status})`);

  const json = await res.json();
  const docs = json?.series?.docs ?? [];
  if (docs.length === 0) {
    throw new Error("이 국가의 OECD 경기 지표를 찾지 못했습니다.");
  }

  // 지표 코드(LI/BCICP/CCICP)로 어떤 시리즈인지 구분해 정리합니다.
  const out = { cli: [], bci: [], cci: [] };
  for (const doc of docs) {
    // series_code 예: "KOR.M.LI.IX._Z.AA.IX._Z.H" → 3번째 조각이 지표 코드
    const metricCode = doc.series_code.split(".")[2];
    const key = keys.find((k) => METRIC_CODE[k] === metricCode);
    if (!key) continue;

    // period("2026-05")와 value를 짝지어 null 제거 후 시간순 정렬
    const points = doc.period
      .map((date, i) => ({ date, value: doc.value[i] }))
      .filter((p) => p.value !== null && p.value !== undefined && !Number.isNaN(p.value))
      .sort((a, b) => a.date.localeCompare(b.date));

    out[key] = points;
  }
  return out;
}
