// ─────────────────────────────────────────────────────────────
// IMF 데이터를 가져오는 "클라이언트 쪽" 도우미.
// 실제 IMF 호출은 서버 함수(프로젝트 루트의 api/imf.js)가 대신합니다.
//
// ⚠️ 로컬 `npm run dev`(Vite)에는 /api 경로가 없습니다.
//    Vercel에 배포한 뒤(또는 `vercel dev`)에만 동작합니다.
//    → 이 앱에서 IMF 전망은 "있으면 좋은 부가 정보"로 다루고,
//      실패해도 화면 나머지는 정상 동작하도록 설계했습니다.
// ─────────────────────────────────────────────────────────────

// 이 앱에서 쓰는 IMF 지표: 코드 → 화면 표시용 정보
export const IMF_INDICATORS = [
  { code: "NGDP_RPCH", label: "GDP 성장률", unit: "%" },
  { code: "PCPIPCH", label: "물가상승률", unit: "%" },
  { code: "LUR", label: "실업률", unit: "%" },
  { code: "GGXWDG_NGDP", label: "정부부채", unit: "% of GDP" },
  { code: "BCA_NGDPD", label: "경상수지", unit: "% of GDP" },
];

/**
 * IMF 지표 하나의 연도별 값(과거 + 전망)을 가져옵니다.
 * @param {string} indicator  IMF 지표 코드 (IMF_INDICATORS 참고)
 * @param {string} iso3       3글자 국가 코드
 * @returns {Promise<Array<{year:number, value:number}>>} 연도 오름차순
 */
export async function fetchImfSeries(indicator, iso3) {
  const res = await fetch(
    `/api/imf?indicator=${encodeURIComponent(indicator)}&country=${encodeURIComponent(iso3)}`
  );
  if (!res.ok) throw new Error(`IMF 프록시 오류 (HTTP ${res.status})`);

  const json = await res.json();
  // 응답 형태: { values: { <indicator>: { <ISO3>: { "1980": 2.5, ... } } } }
  const byYear = json?.values?.[indicator]?.[iso3];
  if (!byYear) return [];

  return Object.entries(byYear)
    .map(([year, value]) => ({ year: Number(year), value: Number(value) }))
    .filter((d) => !Number.isNaN(d.value))
    .sort((a, b) => a.year - b.year);
}

/**
 * IMF_INDICATORS 전체를 한 국가에 대해 동시에 가져옵니다. (경제 전망 카드용)
 * 하나라도 실패하면 그 지표는 건너뛰고 나머지는 반환합니다.
 * @returns {Promise<Record<string, Array<{year:number, value:number}>>>}
 */
export async function fetchImfOutlook(iso3) {
  const results = await Promise.allSettled(
    IMF_INDICATORS.map((i) => fetchImfSeries(i.code, iso3))
  );
  const out = {};
  results.forEach((r, idx) => {
    if (r.status === "fulfilled" && r.value.length > 0) {
      out[IMF_INDICATORS[idx].code] = r.value;
    }
  });
  if (Object.keys(out).length === 0) {
    throw new Error("IMF 전망 데이터를 불러오지 못했습니다. (배포 환경에서만 동작)");
  }
  return out;
}
