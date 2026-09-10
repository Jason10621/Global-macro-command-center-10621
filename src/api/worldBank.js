// ─────────────────────────────────────────────────────────────
// World Bank Open Data API 호출 전용 파일. (이 앱의 주력 데이터 소스)
//
//  ▷ 왜 World Bank인가?
//    - API 키가 필요 없습니다. (가입/발급 없이 바로 사용)
//    - CORS가 열려 있어 브라우저에서 fetch()로 직접 부를 수 있습니다.
//      → 백엔드 서버나 프록시가 전혀 필요 없습니다. (학교 프로젝트 MVP에 최적)
//    - 200여 개국 × 수천 개 지표를 같은 포맷으로 제공 → 국가 비교에 이상적.
//
//  ▷ 이 파일의 역할
//    "데이터를 어떻게 가져오는가"만 담당합니다.
//    화면(React 컴포넌트) 코드와 분리해 두면, 나중에 API를 바꾸거나
//    지표를 추가할 때 이 파일만 수정하면 됩니다.
// ─────────────────────────────────────────────────────────────

const BASE = "https://api.worldbank.org/v2";

// World Bank 응답은 항상 [ 메타정보객체, 데이터배열 ] 2칸짜리 배열입니다.
// 데이터배열을 꺼내고, 배열이 아니면(=에러) 메시지를 뽑아 예외를 던집니다.
function unwrap(json) {
  const [meta, rows] = json;
  if (!Array.isArray(rows)) {
    const apiMessage = meta?.[0]?.message?.[0]?.value;
    throw new Error(apiMessage || "해당 국가/지표의 데이터를 찾을 수 없습니다.");
  }
  return rows;
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank 서버 응답 오류 (HTTP ${res.status})`);
  return res.json();
}

/**
 * 특정 국가 + 특정 지표의 여러 해 데이터를 가져옵니다.
 * @returns {Promise<Array<{year:number, value:number}>>} 과거→최근 순으로 정렬된 배열
 */
export async function fetchIndicatorSeries(
  countryCode,
  indicatorId,
  startYear = 2000,
  endYear = 2025
) {
  //   format=json      → JSON으로 응답
  //   per_page=500     → 한 번에 넉넉히 (기본 50이라 잘릴 수 있음)
  //   date=2000:2025   → 이 기간만
  const url =
    `${BASE}/country/${countryCode}/indicator/${indicatorId}` +
    `?format=json&per_page=500&date=${startYear}:${endYear}`;

  const rows = unwrap(await getJSON(url));

  // 화면에서 쓰기 좋은 형태로 가공:
  //   - value가 null인 해(아직 미집계)는 제거
  //   - { year, value } 로 단순화
  //   - 연도 오름차순 정렬 (차트를 왼쪽=과거, 오른쪽=최근으로 그리기 위함)
  return rows
    .filter((r) => r.value !== null)
    .map((r) => ({ year: Number(r.date), value: r.value }))
    .sort((a, b) => a.year - b.year);
}

/**
 * 한 국가에 대해 여러 지표를 "한 번의 요청"으로 가져옵니다. (개요 화면용)
 * World Bank는 indicator 자리에 세미콜론으로 여러 코드를 넣고 source=2를 붙이면
 * 한꺼번에 응답해 줍니다. → 지표 20여 개도 요청 1번으로 끝나 빠릅니다.
 *
 * @param {string} countryCode
 * @param {string[]} indicatorIds
 * @returns {Promise<Record<string, Array<{year:number, value:number}>>>}
 *          { "FP.CPI.TOTL.ZG": [{year,value}...], ... } 형태
 */
export async function fetchManyIndicators(
  countryCode,
  indicatorIds,
  startYear = 2000,
  endYear = 2025
) {
  const url =
    `${BASE}/country/${countryCode}/indicator/${indicatorIds.join(";")}` +
    `?source=2&format=json&per_page=2000&date=${startYear}:${endYear}`;

  const rows = unwrap(await getJSON(url));

  // 지표 코드별로 { year, value } 배열을 모읍니다.
  const byIndicator = {};
  for (const id of indicatorIds) byIndicator[id] = [];

  for (const r of rows) {
    if (r.value === null) continue;
    const id = r.indicator?.id;
    if (!byIndicator[id]) continue;
    byIndicator[id].push({ year: Number(r.date), value: r.value });
  }
  for (const id of indicatorIds) {
    byIndicator[id].sort((a, b) => a.year - b.year);
  }
  return byIndicator;
}

/**
 * 국가 기본 정보(지역, 소득 수준, 수도 등)를 가져옵니다. (국가 개요 카드용)
 * @returns {Promise<{name:string, region:string, incomeLevel:string, capitalCity:string, iso3:string}|null>}
 */
export async function fetchCountryProfile(countryCode) {
  const rows = unwrap(await getJSON(`${BASE}/country/${countryCode}?format=json`));
  const c = rows[0];
  if (!c) return null;
  return {
    name: c.name,
    region: c.region?.value || "",
    incomeLevel: c.incomeLevel?.value || "",
    capitalCity: c.capitalCity || "",
    iso3: c.id || "",
  };
}

/**
 * 같은 국가에 대해 서로 다른 두 지표를 가져와 "연도"를 기준으로 합칩니다.
 * 산점도(Scatter)에서 x축·y축에 다른 지표를 놓을 때 사용합니다.
 *
 * @param {number} lag  시차(년). 0이면 같은 해끼리 짝지음.
 *   양수면 "y를 lag년 뒤(미래)의 값"과 짝지어, x가 y를 선행하는지(예: 신용팽창 →
 *   몇 년 뒤 성장 둔화)를 봅니다. 음수면 반대로 y의 과거값과 짝짓습니다.
 * @returns {Promise<Array<{year:number, x:number, y:number}>>} 두 지표가 모두 있는 해만
 */
export async function fetchIndicatorPair(
  countryCode,
  indicatorXId,
  indicatorYId,
  startYear = 2000,
  endYear = 2025,
  lag = 0
) {
  // Promise.all: 두 요청을 "동시에" 보내고 둘 다 끝날 때까지 기다립니다.
  // 시차를 두면 짝지을 y 연도가 조회 구간을 벗어날 수 있어 넉넉히 받아옵니다.
  const [xSeries, ySeries] = await Promise.all([
    fetchIndicatorSeries(countryCode, indicatorXId, startYear, endYear),
    fetchIndicatorSeries(countryCode, indicatorYId, startYear - Math.abs(lag), endYear + Math.abs(lag)),
  ]);

  const yByYear = new Map(ySeries.map((d) => [d.year, d.value]));

  return xSeries
    .filter((d) => yByYear.has(d.year + lag)) // x(t) 와 y(t+lag) 가 모두 있어야 점을 찍음
    .map((d) => ({ year: d.year, x: d.value, y: yByYear.get(d.year + lag) }));
}
