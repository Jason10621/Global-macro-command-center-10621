// ─────────────────────────────────────────────────────────────
// AI에게 줄 "지금 화면의 경제 데이터 요약" + 행동 규칙(시스템 프롬프트)을 만듭니다.
//
//  ▷ 핵심 아이디어 (grounding)
//    AI가 기억에 의존해 숫자를 지어내지 않도록, 앱이 이미 불러온 실제 데이터
//    (최근값·리스크 신호·종합 점수·IMF 전망)를 텍스트로 붙여 주고
//    "이 데이터에 근거해서 답하고, 없으면 없다고 말하라"고 지시합니다.
//
//  ▷ 안전장치
//    - 투자 권유 금지 (앱 푸터·과제 규정과 같은 원칙)
//    - 이 앱의 리스크 규칙·점수는 학습용 단순 규칙임을 AI도 알고 있도록 명시
// ─────────────────────────────────────────────────────────────
import { INDICATORS, CATEGORIES } from "./indicators.js";
import { assessRisk } from "./risk.js";
import { computeCategoryScores } from "./riskScore.js";
import { IMF_INDICATORS } from "../api/imf.js";

const RULES = `당신은 "Global Macro Command Center" 웹사이트 전용 경제 도우미입니다.
- 한국어로, 고등학생도 이해할 수 있게 쉽고 간결하게(보통 6문장 이내) 답합니다.
- 아래 [현재 화면 데이터]에 있는 숫자는 그대로 인용하고, 없는 숫자는 지어내지 말고 "이 화면 데이터에는 없다"고 말합니다.
- 일반 경제 개념(인플레이션, 금리, 경상수지 등)은 설명해도 되지만, 데이터와 일반 상식을 구분해서 말합니다.
- 특정 주식·코인·환율 매수/매도 같은 투자 조언은 하지 않습니다. 요청받으면 정중히 거절하고 판단 근거 정리만 도와줍니다.
- 이 사이트의 리스크 신호와 종합 점수는 학습용 단순 규칙(공식 신용등급 아님)이라는 점을 필요할 때 짚어줍니다.
- 경제와 무관한 질문에는 경제 질문을 도와드릴 수 있다고만 안내합니다.`;

const fmt = (v, d = 1) => (v == null ? "-" : Number(v).toFixed(d));

/**
 * @param {{countryName:string, dataById:object, riskScore:object|null, imfOutlook:object|null}} p
 * @returns {string} 시스템 프롬프트
 */
export function buildSystemPrompt(p) {
  if (!p) {
    return `${RULES}\n\n[현재 화면 데이터]\n(단일 국가 화면이 아니어서 특정 국가 데이터가 없습니다. 일반 경제 질문에 답하고, 구체적 수치는 "단일 국가" 탭에서 국가를 고르면 알려줄 수 있다고 안내하세요.)`;
  }
  const { countryName, dataById, riskScore, imfOutlook } = p;
  const lines = [];

  lines.push(`국가: ${countryName}`);
  if (riskScore) {
    lines.push(
      `종합 리스크 스코어: ${riskScore.score}/100 (${riskScore.grade}) — 안정 ${riskScore.counts.green} · 주의 ${riskScore.counts.amber} · 위험 ${riskScore.counts.red}`
    );
  }

  const cats = computeCategoryScores(dataById).filter((c) => c.score != null);
  if (cats.length) lines.push("카테고리별 점수: " + cats.map((c) => `${c.label} ${c.score}`).join(", "));

  lines.push("", "지표별 최근값 (World Bank):");
  for (const ind of INDICATORS) {
    const s = dataById?.[ind.id] ?? [];
    const last = s[s.length - 1];
    if (!last) continue;
    const risk = ind.riskType ? assessRisk(ind.riskType, last.value) : null;
    const catLabel = CATEGORIES.find((c) => c.key === ind.category)?.label;
    lines.push(
      `- [${catLabel}] ${ind.label}: ${fmt(last.value, ind.decimals ?? 1)}${ind.unit} (${last.year}년)` +
        (risk ? ` → ${risk.level}: ${risk.note}` : "")
    );
  }

  if (imfOutlook && Object.keys(imfOutlook).length) {
    const thisYear = new Date().getFullYear();
    const years = [thisYear, thisYear + 1, thisYear + 2];
    lines.push("", `IMF 전망 (${years.join("/")}, 소수 첫째 자리):`);
    for (const ind of IMF_INDICATORS) {
      const s = imfOutlook[ind.code];
      if (!s) continue;
      const by = new Map(s.map((d) => [d.year, d.value]));
      lines.push(`- ${ind.label}: ` + years.map((y) => `${y}년 ${fmt(by.get(y))}`).join(", ") + ` (${ind.unit})`);
    }
  }

  return `${RULES}\n\n[현재 화면 데이터]\n${lines.join("\n")}`;
}

// 현재 화면 맥락에 맞는 추천 질문
export function suggestedQuestions(countryName) {
  return countryName
    ? [
        `${countryName} 경제에서 지금 가장 걱정되는 점은?`,
        "종합 리스크 스코어는 어떻게 읽어야 해?",
        "IMF 전망을 한 줄로 요약해줘",
      ]
    : ["경상수지 적자는 왜 위험할 수 있어?", "인플레이션이 높으면 금리는 왜 올라가?", "장단기 금리 역전이 뭐야?"];
}
