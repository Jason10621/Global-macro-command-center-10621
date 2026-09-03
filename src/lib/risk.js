// ─────────────────────────────────────────────────────────────
// "지표 값 하나 → 사람이 이해할 수 있는 리스크 신호"로 바꾸는 규칙 모음.
//
//   level : 화면에 크게 보여줄 한 단어 (안정 / 주의 / 위험 ...)
//   tone  : 색 이름 (green / amber / red / gray) → UI에서 색 클래스로 변환
//   note  : 왜 그렇게 판정했는지 한 줄 설명
//
// ※ 아래 임계값(4%, 8%, 90% 등)은 통상적인 경제 상식과 국제기구가 자주 쓰는
//   경험적 기준(예: 물가안정목표 약 2%, IMF의 외환보유액 3개월 적정선,
//   EU의 정부부채 60%·재정적자 3% 준거치)을 참고해 "내가 직접 정한 단순 규칙"입니다.
//   전문 기관의 공식 판정이 아니며, 사용자 피드백을 받아 조정할 예정입니다.
//   (이 주석은 "AI가 짜도 되지만 본인이 설명할 수 있어야 한다"는 과제 규정 대비용입니다.)
// ─────────────────────────────────────────────────────────────

// ── 1. 물가·성장·고용 ────────────────────────────────────────

// 물가상승률: 낮아도(디플레) 문제, 너무 높아도 문제
function inflationRisk(v) {
  if (v < 0) return { level: "디플레 주의", tone: "amber", note: "물가 하락은 소비·투자 위축 신호일 수 있음" };
  if (v <= 4) return { level: "안정", tone: "green", note: "연 2~4%는 일반적으로 안정권으로 봄" };
  if (v <= 8) return { level: "주의", tone: "amber", note: "물가 상승 압력이 다소 높음" };
  return { level: "위험", tone: "red", note: "고물가 — 실질소득 감소·경제 불안 확대" };
}

// GDP 성장률: 마이너스면 침체, 너무 높으면 과열 의심
function gdpGrowthRisk(v) {
  if (v < 0) return { level: "위험", tone: "red", note: "역성장 — 경기 침체 국면 가능성" };
  if (v < 1.5) return { level: "주의", tone: "amber", note: "성장세 둔화" };
  if (v <= 6) return { level: "안정", tone: "green", note: "완만하고 건전한 성장세" };
  return { level: "과열 의심", tone: "amber", note: "고성장 — 물가·부채 동반 점검 필요" };
}

// 실업률: 낮을수록 좋음
function unemploymentRisk(v) {
  if (v <= 4) return { level: "안정", tone: "green", note: "완전고용에 가까운 수준" };
  if (v <= 7) return { level: "주의", tone: "amber", note: "노동시장에 다소 부담" };
  return { level: "위험", tone: "red", note: "고실업 — 소비 위축·사회적 비용 증가" };
}

// 청년 실업률: 보통 전체 실업률보다 2~3배 높으므로 기준선을 올려 잡음
function youthUnemploymentRisk(v) {
  if (v <= 10) return { level: "안정", tone: "green", note: "청년 고용이 비교적 원활" };
  if (v <= 20) return { level: "주의", tone: "amber", note: "청년층 일자리 진입에 부담" };
  return { level: "위험", tone: "red", note: "청년 고실업 — 인적자본 손실·사회 불안 요인" };
}

// ── 2. 기업·시장 ────────────────────────────────────────────

// 상장사 시가총액(% GDP): 너무 낮으면 자본시장이 얕고, 극단적으로 높으면 거품 우려
function marketCapRisk(v) {
  if (v < 40) return { level: "시장 얕음", tone: "amber", note: "자본시장 규모가 경제에 비해 작음" };
  if (v <= 150) return { level: "안정", tone: "green", note: "경제 규모에 걸맞은 자본시장" };
  return { level: "과열 의심", tone: "amber", note: "시가총액이 GDP를 크게 상회 — 밸류에이션 점검" };
}

// 민간부문 신용(% GDP): 빠르게 커지면 금융위기 선행 신호로 자주 언급됨
function privateCreditRisk(v) {
  if (v <= 100) return { level: "안정", tone: "green", note: "민간 부채 수준이 관리 범위" };
  if (v <= 180) return { level: "주의", tone: "amber", note: "민간 부채가 다소 높음 — 금리 상승에 취약" };
  return { level: "위험", tone: "red", note: "과다 부채 — 금융 불안 시 충격 확대 우려" };
}

// ── 3. 재정·부채 ────────────────────────────────────────────

// 중앙정부 부채(% GDP): EU 준거치(60%)를 기준으로 삼음
function govDebtRisk(v) {
  if (v <= 60) return { level: "안정", tone: "green", note: "국제적으로 통용되는 60% 준거치 이하" };
  if (v <= 90) return { level: "주의", tone: "amber", note: "부채 부담이 커지는 구간" };
  return { level: "위험", tone: "red", note: "고부채 — 이자 부담·신용도 하락 위험" };
}

// 재정수지(% GDP): EU 준거치(-3%)를 기준으로. 흑자면 여유
function fiscalBalanceRisk(v) {
  if (v >= 0) return { level: "안정", tone: "green", note: "재정 흑자 — 여력 있음" };
  if (v >= -3) return { level: "안정", tone: "green", note: "적자지만 -3% 준거치 이내" };
  if (v >= -6) return { level: "주의", tone: "amber", note: "재정적자가 다소 큼" };
  return { level: "위험", tone: "red", note: "대규모 적자 — 부채 급증 우려" };
}

// ── 4. 대외·교역 ────────────────────────────────────────────

// 경상수지(% GDP): 큰 적자는 통화·외채 위험. 흑자는 대체로 안전(과도한 불균형은 논외)
function currentAccountRisk(v) {
  if (v >= -2) return { level: "안정", tone: "green", note: "대외 거래가 균형 또는 흑자" };
  if (v >= -5) return { level: "주의", tone: "amber", note: "경상적자 — 외국 자본 유입에 의존" };
  return { level: "위험", tone: "red", note: "대규모 경상적자 — 통화 약세·외채 위험" };
}

// 외환보유액(수입 몇 개월분): IMF가 자주 쓰는 3개월 적정선
function reservesMonthsRisk(v) {
  if (v >= 3) return { level: "안정", tone: "green", note: "수입 3개월분 이상 — 국제 통용 적정선" };
  if (v >= 2) return { level: "주의", tone: "amber", note: "완충 여력이 얇음" };
  return { level: "위험", tone: "red", note: "외환 완충 부족 — 대외 충격에 취약" };
}

// ── 5. 금융·통화 ────────────────────────────────────────────

// 대출금리: 절대 수준으로 (물가가 높은 나라는 자연히 금리도 높으니 참고용)
function lendingRateRisk(v) {
  if (v <= 7) return { level: "안정", tone: "green", note: "차입 비용이 완만" };
  if (v <= 15) return { level: "주의", tone: "amber", note: "높은 차입 비용 — 투자·소비에 부담" };
  return { level: "위험", tone: "red", note: "매우 높은 금리 — 물가·신용 불안 동반 가능" };
}

// 광의통화(M2) 증가율: 너무 빠르면 인플레 압력, 마이너스면 신용 수축
function broadMoneyRisk(v) {
  if (v < 0) return { level: "주의", tone: "amber", note: "통화량 감소 — 신용 위축 신호" };
  if (v <= 12) return { level: "안정", tone: "green", note: "완만한 통화 증가" };
  if (v <= 20) return { level: "주의", tone: "amber", note: "통화 증가세가 빠름 — 물가 압력" };
  return { level: "위험", tone: "red", note: "급격한 통화 팽창 — 고인플레 위험" };
}

// riskType 문자열 → 실제 판정 함수 연결
const RULES = {
  inflation: inflationRisk,
  gdpGrowth: gdpGrowthRisk,
  unemployment: unemploymentRisk,
  youthUnemployment: youthUnemploymentRisk,
  marketCap: marketCapRisk,
  privateCredit: privateCreditRisk,
  govDebt: govDebtRisk,
  fiscalBalance: fiscalBalanceRisk,
  currentAccount: currentAccountRisk,
  reservesMonths: reservesMonthsRisk,
  lendingRate: lendingRateRisk,
  broadMoney: broadMoneyRisk,
};

/**
 * @param {string} riskType  indicators.js의 riskType 값
 * @param {number|null|undefined} value
 */
export function assessRisk(riskType, value) {
  const rule = RULES[riskType];
  if (!rule || value == null || Number.isNaN(value)) {
    return { level: "정보 없음", tone: "gray", note: "판정할 값이 없습니다." };
  }
  return rule(value);
}

// tone 이름 → Tailwind 클래스 묶음. 여러 컴포넌트에서 재사용합니다.
export const TONE_CLASSES = {
  green: { dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
  amber: { dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  red: { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
  gray: { dot: "bg-neutral-400", text: "text-neutral-500", bg: "bg-neutral-100" },
};
