// ─────────────────────────────────────────────────────────────
// FRED(미국 세인트루이스 연준) 데이터를 가져오는 "클라이언트 쪽" 도우미.
//
// FRED는 ① API 키가 필요하고 ② 브라우저 직접 호출이 CORS로 막힙니다.
// 그래서 두 경로를 시도합니다. (IMF 전망과 같은 구조)
//   1) /api/fred 서버 함수 — Vercel 배포 + FRED_API_KEY 환경변수가 있을 때.
//   2) 정적 스냅샷 public/data/fred.json — 서버 함수가 없는 정적 호스팅(GitHub Pages).
//      빌드 시 scripts/fetch-fred-data.mjs 가 (CI 시크릿 FRED_API_KEY 로) 미리 받아 둡니다.
//
// 둘 다 없으면 이 기능은 조용히 비활성화됩니다. (fetchFredBundle → null)
// FRED 키 무료 발급: https://fredaccount.stlouisfed.org/apikeys
// ─────────────────────────────────────────────────────────────

// 이 앱이 보여주는 미국 고빈도 지표. (전부 % 단위라 같은 스타일로 그립니다)
export const FRED_SERIES = [
  {
    id: "T10Y2Y",
    label: "장단기 금리차 (10년−2년)",
    unit: "%",
    about:
      "마이너스면 '장단기 금리 역전' — 과거 미국 경기침체를 몇 분기 앞서 나타낸 신호로 자주 언급됩니다.",
    refLine: 0,
  },
  {
    id: "FEDFUNDS",
    label: "연방기금금리",
    unit: "%",
    about: "미 연준의 정책금리(월평균). 통화정책이 완화적인지 긴축적인지를 봅니다.",
  },
  {
    id: "UNRATE",
    label: "실업률",
    unit: "%",
    about: "미국 실업률(월간, 계절조정). World Bank 연간치보다 반응이 빠릅니다.",
  },
];

/**
 * FRED 시리즈 하나의 시계열을 /api/fred 프록시로 가져옵니다.
 * @returns {Promise<Array<{date:string, value:number}>>}
 */
export async function fetchFredSeries(seriesId, start = "2015-01-01") {
  const res = await fetch(
    `/api/fred?series_id=${encodeURIComponent(seriesId)}&start=${start}`
  );
  if (!res.ok) throw new Error(`FRED 프록시 오류 (HTTP ${res.status})`);

  const json = await res.json();
  // FRED는 값이 없을 때 "." 문자열을 넣으므로 걸러냅니다.
  return (json.observations ?? [])
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: Number(o.value) }))
    .filter((o) => !Number.isNaN(o.value));
}

// 정적 스냅샷은 앱에서 한 번만 받으면 되므로 캐시합니다.
let staticFredPromise = null;
function loadStaticFred() {
  if (!staticFredPromise) {
    const base = import.meta.env.BASE_URL ?? "/";
    staticFredPromise = fetch(`${base}data/fred.json`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return staticFredPromise;
}

/**
 * FRED_SERIES 전체를 가져옵니다. (미국 고빈도 패널용)
 * 프록시 → 정적 스냅샷 순으로 시도하고, 둘 다 없으면 null 을 돌려줍니다.
 * @returns {Promise<Record<string, Array<{date:string,value:number}>> | null>}
 */
export async function fetchFredBundle() {
  try {
    const settled = await Promise.allSettled(
      FRED_SERIES.map((s) => fetchFredSeries(s.id))
    );
    const out = {};
    settled.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value.length > 0) out[FRED_SERIES[i].id] = r.value;
    });
    if (Object.keys(out).length > 0) return out;
  } catch {
    /* 프록시 없음 — 정적 스냅샷으로 */
  }

  const snapshot = await loadStaticFred();
  return snapshot && Object.keys(snapshot).length > 0 ? snapshot : null;
}
