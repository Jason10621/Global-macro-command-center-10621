// ─────────────────────────────────────────────────────────────
// "여러 지표의 리스크 신호(안정/주의/위험)" → 국가 하나의 종합 건강 점수(0~100).
//
//  ▷ 어떻게 계산하나
//    1) risk.js 규칙이 있는 지표만 대상으로, 각 지표의 최근값을 판정.
//    2) 신호를 점수로 환산:  green(안정)=90, amber(주의)=55, red(위험)=20.
//    3) 대상 지표들의 평균을 내 100점 만점 점수로.
//    4) 점수 구간을 A~D 등급 + 색 톤으로 라벨링.
//
//  ▷ 왜 "평균"인가 (한계도 함께)
//    지표마다 중요도가 다르지만, 가중치를 제가 임의로 정하면 근거가 약해집니다.
//    그래서 "동일 가중 평균"이라는 가장 단순하고 설명 가능한 방식을 택했습니다.
//    이 점수는 공식 국가신용등급이 아니라, 이 앱의 규칙을 요약한 학습용 지표입니다.
// ─────────────────────────────────────────────────────────────
import { INDICATORS, CATEGORIES } from "./indicators.js";
import { assessRisk } from "./risk.js";

const TONE_POINTS = { green: 90, amber: 55, red: 20 };

// 지표 하나의 "최근값 → 점수(0~100)". 판정 불가면 null.
function scoreOne(ind, dataById) {
  if (!ind.riskType) return null;
  const series = dataById?.[ind.id] ?? [];
  const latest = series.length ? series[series.length - 1] : null;
  if (!latest || latest.value == null) return null;
  const risk = assessRisk(ind.riskType, latest.value);
  return TONE_POINTS[risk.tone] ?? null;
}

// 점수 → 등급. 구간(75/55/40)은 제가 정한 단순 기준입니다.
function gradeFor(score) {
  if (score >= 75) return { grade: "양호", tone: "green" };
  if (score >= 55) return { grade: "보통", tone: "amber" };
  if (score >= 40) return { grade: "주의", tone: "amber" };
  return { grade: "취약", tone: "red" };
}

/**
 * @param {Record<string, Array<{year:number,value:number}>>} dataById  useAllIndicators 결과
 * @returns {{
 *   score:number, grade:string, tone:string,
 *   counts:{green:number, amber:number, red:number},
 *   items: Array<{key,label,category,tone,level,value,points}>,  // points 낮은 순(취약한 지표 먼저)
 *   n:number
 * } | null}   판정 가능한 지표가 하나도 없으면 null
 */
export function computeRiskScore(dataById) {
  if (!dataById) return null;

  const items = [];
  for (const ind of INDICATORS) {
    if (!ind.riskType) continue;
    const series = dataById[ind.id] ?? [];
    const latest = series.length ? series[series.length - 1] : null;
    if (!latest || latest.value == null) continue;

    const risk = assessRisk(ind.riskType, latest.value);
    const points = TONE_POINTS[risk.tone];
    if (points == null) continue; // gray(정보 없음)는 평균에서 제외

    items.push({
      key: ind.key,
      label: ind.label,
      category: ind.category,
      tone: risk.tone,
      level: risk.level,
      note: risk.note,
      value: latest.value,
      year: latest.year,
      points,
    });
  }

  if (items.length === 0) return null;

  const score = Math.round(items.reduce((s, x) => s + x.points, 0) / items.length);
  const counts = { green: 0, amber: 0, red: 0 };
  items.forEach((x) => (counts[x.tone] += 1));
  items.sort((a, b) => a.points - b.points); // 취약한 지표가 앞에 오도록

  const { grade, tone } = gradeFor(score);
  return { score, grade, tone, counts, items, n: items.length };
}

/**
 * 카테고리별 평균 점수(0~100). 레이더 차트("이 나라는 재정은 튼튼한데 대외는 약하다")용.
 * @returns {Array<{key:string, label:string, score:number|null, n:number}>}  CATEGORIES 순서
 */
export function computeCategoryScores(dataById) {
  return CATEGORIES.map((cat) => {
    const pts = INDICATORS
      .filter((i) => i.category === cat.key)
      .map((i) => scoreOne(i, dataById))
      .filter((p) => p != null);
    return {
      key: cat.key,
      label: cat.label,
      score: pts.length ? Math.round(pts.reduce((s, p) => s + p, 0) / pts.length) : null,
      n: pts.length,
    };
  });
}

export { gradeFor };
