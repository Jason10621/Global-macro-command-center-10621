// ─────────────────────────────────────────────────────────────
// 추이 차트에 세로선으로 겹쳐 보여줄 "주요 경제 사건" 목록.
//
//  ▷ 왜 필요한가?
//    "2020년에 실업률이 왜 튀었지?" 같은 물음에 차트만으로는 답이 안 됩니다.
//    금융위기·팬데믹 같은 굵직한 사건을 연도 세로선으로 얹으면
//    지표의 급변 지점을 한눈에 맥락과 연결할 수 있습니다.
//
//  ▷ 범위와 한계
//    전 세계 공통 사건(GLOBAL) 위주로 소수만 선별했고, 국가별 사건은
//    이 앱이 다루는 몇 나라만 짧게 넣었습니다. 해석을 돕는 참고용이며
//    "이 사건이 이 지표를 움직였다"는 인과 주장은 아닙니다.
//    연간 지표(x축이 연도)에서만 사용합니다.
// ─────────────────────────────────────────────────────────────

// 전 세계 공통 사건
export const GLOBAL_EVENTS = [
  { year: 2008, label: "글로벌 금융위기" },
  { year: 2010, label: "유럽 재정위기" },
  { year: 2014, label: "국제유가 급락" },
  { year: 2020, label: "코로나19 팬데믹" },
  { year: 2022, label: "인플레이션·금리 급등" },
];

// 국가별 사건 (World Bank ISO 2글자 코드 기준). 필요한 나라만 짧게.
export const COUNTRY_EVENTS = {
  KR: [{ year: 2017, label: "사드 갈등·수출 둔화" }],
  US: [{ year: 2018, label: "미·중 무역분쟁" }],
  CN: [{ year: 2015, label: "증시 급락·위안화 절하" }],
  TR: [{ year: 2018, label: "리라 위기" }],
  BR: [{ year: 2015, label: "정치·재정 위기 침체" }],
  GB: [{ year: 2016, label: "브렉시트 국민투표" }],
  ZA: [{ year: 2020, label: "국가신용 투기등급 강등" }],
  AR: [{ year: 2018, label: "페소 위기·IMF 구제금융" }],
};

/**
 * 특정 연도 구간에 걸치는 사건만 골라 돌려줍니다. (전 세계 + 해당 국가)
 * @param {number} startYear
 * @param {number} endYear
 * @param {string} [countryCode]  World Bank ISO2 코드
 * @returns {Array<{year:number, label:string, scope:"global"|"country"}>}  연도 오름차순
 */
export function eventsForRange(startYear, endYear, countryCode) {
  const inRange = (e) => e.year >= startYear && e.year <= endYear;
  const out = GLOBAL_EVENTS.filter(inRange).map((e) => ({ ...e, scope: "global" }));
  const local = COUNTRY_EVENTS[countryCode] ?? [];
  out.push(...local.filter(inRange).map((e) => ({ ...e, scope: "country" })));
  return out.sort((a, b) => a.year - b.year);
}
