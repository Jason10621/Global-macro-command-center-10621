// ─────────────────────────────────────────────────────────────
// 두 지표의 "같이 움직이는 정도"를 숫자로 재는 아주 작은 통계 도우미.
// 관계 분석(산점도) 화면에서 상관계수 표시와 추세선 그리기에 씁니다.
//
//  ▷ 왜 필요한가?
//    산점도만 보면 "대충 우상향 같다" 수준의 눈대중만 됩니다.
//    피어슨 상관계수(r)와 추세선(최소제곱 직선)을 얹으면
//    "얼마나 강하게" 같이/반대로 움직이는지를 정량적으로 말할 수 있습니다.
//
//  ▷ 한계 (화면에도 명시)
//    상관은 인과가 아닙니다. 표본(연도 수)이 적으면 r이 크게 흔들리고,
//    제3의 요인(예: 경기 사이클) 때문에 우연히 같이 움직일 수도 있습니다.
// ─────────────────────────────────────────────────────────────

// pairs: [{ x:number, y:number }, ...]  (관계 분석 데이터는 { year, x, y } 형태라 그대로 넣으면 됩니다)

/**
 * 피어슨 상관계수 r 을 계산합니다. (-1 ~ +1)
 *   +1에 가까울수록 "완벽히 같이", -1에 가까울수록 "완벽히 반대", 0이면 "선형 관계 없음".
 * @returns {number|null}  표본이 3개 미만이거나 한쪽 분산이 0이면 null
 */
export function pearson(pairs) {
  const pts = pairs.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const n = pts.length;
  if (n < 3) return null;

  const meanX = pts.reduce((s, p) => s + p.x, 0) / n;
  const meanY = pts.reduce((s, p) => s + p.y, 0) / n;

  let sxy = 0, sxx = 0, syy = 0;
  for (const p of pts) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null; // 한 축의 값이 전부 같으면 상관을 정의할 수 없음
  return sxy / Math.sqrt(sxx * syy);
}

/**
 * 최소제곱 회귀 직선 y = slope·x + intercept 를 구합니다. (추세선용)
 * @returns {{slope:number, intercept:number}|null}
 */
export function linearFit(pairs) {
  const pts = pairs.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const n = pts.length;
  if (n < 2) return null;

  const meanX = pts.reduce((s, p) => s + p.x, 0) / n;
  const meanY = pts.reduce((s, p) => s + p.y, 0) / n;

  let sxy = 0, sxx = 0;
  for (const p of pts) {
    const dx = p.x - meanX;
    sxy += dx * (p.y - meanY);
    sxx += dx * dx;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  return { slope, intercept: meanY - slope * meanX };
}

/**
 * 추세선을 산점도에 그릴 수 있도록 양 끝 두 점 [{x,y},{x,y}] 으로 만들어 줍니다.
 */
export function trendLinePoints(pairs) {
  const fit = linearFit(pairs);
  if (!fit) return null;
  const xs = pairs.map((p) => p.x).filter(Number.isFinite);
  if (xs.length < 2) return null;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return [
    { x: minX, y: fit.slope * minX + fit.intercept },
    { x: maxX, y: fit.slope * maxX + fit.intercept },
  ];
}

/**
 * r 값을 사람이 읽는 문구 + 색 톤으로 바꿉니다. (risk.js의 tone 체계와 동일하게 green/amber/gray)
 * 강도 구간(0.7 / 0.4)은 사회과학에서 흔히 쓰는 러프한 기준을 참고해 제가 정한 것입니다.
 */
export function describeCorrelation(r) {
  if (r == null) return { label: "판정 불가", tone: "gray", note: "표본이 부족하거나 한 축의 값이 일정합니다." };
  const a = Math.abs(r);
  const dir = r > 0 ? "양(+)의" : "음(−)의";
  const strength = a >= 0.7 ? "강한" : a >= 0.4 ? "뚜렷한" : a >= 0.2 ? "약한" : "거의 없는";
  const tone = a >= 0.4 ? "green" : a >= 0.2 ? "amber" : "gray";
  const note =
    a < 0.2
      ? "두 지표가 뚜렷한 선형 관계를 보이지 않습니다."
      : `연도별로 한 지표가 오를 때 다른 지표가 ${r > 0 ? "같이 오르는" : "반대로 내리는"} 경향이 ${strength === "강한" ? "강하게" : "어느 정도"} 나타납니다.`;
  return { label: `${strength} ${dir} 상관 (r = ${r.toFixed(2)})`, tone, note };
}
