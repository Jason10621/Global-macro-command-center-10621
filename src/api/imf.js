// ─────────────────────────────────────────────────────────────
// IMF 데이터를 가져오는 "클라이언트 쪽" 도우미.
//
// 두 가지 경로를 시도합니다.
//   1) /api/imf 서버 함수 (프로젝트 루트의 api/imf.js) — Vercel 배포·`vercel dev`에서 동작.
//   2) 정적 스냅샷 public/data/imf-outlook.json — 위 경로가 없을 때(로컬 `npm run dev`,
//      GitHub Pages 등 서버 함수가 없는 정적 호스팅)의 폴백.
//      이 파일은 `npm run build` 때 scripts/fetch-imf-outlook.mjs 가 미리 받아 생성합니다.
//      (IMF DataMapper는 브라우저 직접 호출 시 CORS로 막히지만, 빌드 시점의 Node
//       환경에는 CORS 제한이 없어 미리 받아둘 수 있습니다.)
//
// 즉 IMF 전망은 어느 배포 환경에서든 표시되며, 다만 정적 스냅샷 폴백을 쓸 때는
// 값이 "마지막 빌드 시점" 기준이라는 점만 다릅니다.
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
 * IMF 지표 하나의 연도별 값(과거 + 전망)을 /api/imf 프록시로 가져옵니다.
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

// 정적 스냅샷(public/data/imf-outlook.json)은 앱 전체에서 한 번만 받으면 되므로
// 모듈 스코프에 캐시해 둡니다. 형태: { [ISO3]: { [indicatorCode]: [{year,value}] } }
let staticOutlookPromise = null;
function loadStaticOutlook() {
  if (!staticOutlookPromise) {
    // import.meta.env.BASE_URL: GitHub Pages처럼 하위 경로(/저장소이름/)에 배포될 때도
    // 정적 파일 경로가 맞도록 vite.config.js의 base 값을 그대로 씁니다.
    const base = import.meta.env.BASE_URL ?? "/";
    staticOutlookPromise = fetch(`${base}data/imf-outlook.json`).then((res) => {
      if (!res.ok) throw new Error(`정적 IMF 스냅샷 로드 실패 (HTTP ${res.status})`);
      return res.json();
    });
  }
  return staticOutlookPromise;
}

/**
 * IMF_INDICATORS 전체를 한 국가에 대해 가져옵니다. (경제 전망 카드용)
 * 먼저 /api/imf 프록시로 시도하고, 그게 전부 실패하면(=서버 함수가 없는 정적
 * 호스팅) 빌드 시점에 미리 받아둔 정적 스냅샷으로 폴백합니다.
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
  if (Object.keys(out).length > 0) return out;

  // /api/imf 를 하나도 못 썼다 → 정적 스냅샷 폴백
  const snapshot = await loadStaticOutlook();
  const fallback = snapshot?.[iso3];
  if (!fallback || Object.keys(fallback).length === 0) {
    throw new Error("IMF 전망 데이터를 불러오지 못했습니다.");
  }
  return fallback;
}
