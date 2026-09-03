// ─────────────────────────────────────────────────────────────
// OECD 경기선행지수(CLI)를 "경기 4국면" 중 하나로 해석하는 규칙.
//
//  경기는 보통 [회복 → 확장 → 둔화 → 수축]을 돌고 돕니다. ("경기 순환")
//  CLI를 두 축으로 나눠 지금이 어느 국면인지 읽습니다.
//    - 세로축: CLI가 100(장기 추세)보다 위인가 아래인가  → "수준"
//    - 가로축: 최근 몇 달간 CLI가 오르고 있나 내리고 있나  → "방향(모멘텀)"
//
//        방향 ↑ (상승)          방향 ↓ (하락)
//   ┌────────────────────┬────────────────────┐
//   │  회복 (100 미만·상승) │  둔화 (100 초과·하락) │
//   ├────────────────────┼────────────────────┤
//   │  확장 (100 초과·상승) │  수축 (100 미만·하락) │
//   └────────────────────┴────────────────────┘
//
//  ※ 이 4국면 구분과 "모멘텀 = 최근 3개월 변화" 같은 세부 규칙은
//    OECD의 공식 국면 판정이 아니라, 개념을 참고해 내가 단순화한 것입니다.
// ─────────────────────────────────────────────────────────────

// 최근 n개월간의 변화량(모멘텀)을 계산합니다. 데이터가 짧으면 있는 만큼만.
export function momentum(series, months = 3) {
  if (!series || series.length < 2) return 0;
  const last = series[series.length - 1].value;
  const idx = Math.max(0, series.length - 1 - months);
  return last - series[idx].value;
}

/**
 * CLI 시계열 → 현재 경기 국면 해석.
 * @param {Array<{date:string, value:number}>} cliSeries
 * @returns {{
 *   phase: "확장"|"둔화"|"수축"|"회복"|"정보 없음",
 *   tone: "green"|"amber"|"red"|"gray",
 *   level: number|null, mom: number, rising: boolean,
 *   note: string
 * }}
 */
export function readBusinessCycle(cliSeries) {
  if (!cliSeries || cliSeries.length < 4) {
    return {
      phase: "정보 없음", tone: "gray", level: null, mom: 0, rising: false,
      note: "국면을 판단할 만큼 데이터가 충분하지 않습니다.",
    };
  }

  const level = cliSeries[cliSeries.length - 1].value;
  const mom = momentum(cliSeries, 3);
  const rising = mom >= 0;
  const above = level >= 100;

  let phase, tone, note;
  if (above && rising) {
    phase = "확장"; tone = "green";
    note = "경기선행지수가 장기 추세를 웃돌며 계속 오르는 중 — 성장세가 이어질 가능성.";
  } else if (above && !rising) {
    phase = "둔화"; tone = "amber";
    note = "아직 추세 위에 있지만 상승세가 꺾임 — 성장 속도가 느려지는 국면.";
  } else if (!above && !rising) {
    phase = "수축"; tone = "red";
    note = "추세를 밑도는 데다 계속 내려가는 중 — 경기 위축 국면.";
  } else {
    phase = "회복"; tone = "amber";
    note = "아직 추세 아래지만 바닥을 딛고 반등하는 중 — 회복 초입 가능성.";
  }

  return { phase, tone, level, mom, rising, note };
}

/**
 * 심리지수(BCI/CCI) 한 값을 짧게 해석합니다. 100 기준.
 */
export function readConfidence(value) {
  if (value == null || Number.isNaN(value)) {
    return { label: "정보 없음", tone: "gray" };
  }
  if (value >= 101) return { label: "낙관", tone: "green" };
  if (value >= 99.5) return { label: "중립", tone: "amber" };
  return { label: "비관", tone: "red" };
}
