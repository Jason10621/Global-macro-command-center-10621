// ─────────────────────────────────────────────────────────────
// "국가 목록"과 "지표 목록"을 한 파일에서 관리합니다.
// 새 국가나 새 지표를 넣고 싶으면 이 배열에만 항목을 추가하면 됩니다.
// (화면 코드는 이 목록을 그대로 반복 렌더링하므로 따로 고칠 필요가 없습니다.)
//
// 이 앱은 "국가 경제의 흐름"을 여러 각도에서 보기 위해 지표를 5개 묶음(카테고리)으로 나눕니다.
//   1) 물가·성장·고용   — 거시경제의 기본 체온계
//   2) 기업·시장         — 그 나라 안의 기업/주식시장이 얼마나 크고 활발한가
//   3) 재정·부채         — 정부 살림살이가 튼튼한가
//   4) 대외·교역         — 다른 나라와의 거래에서 흑자/적자인가
//   5) 금융·통화         — 돈의 값(금리)과 양(통화량)이 어떻게 움직이나
// ─────────────────────────────────────────────────────────────

// ISO 2글자(World Bank) → ISO 3글자(OECD·IMF) 변환표.
// 경기선행지수(OECD)와 경제전망(IMF)은 3글자 코드를 쓰기 때문에 필요합니다.
export const ISO3 = {
  KR: "KOR", US: "USA", JP: "JPN", CN: "CHN", DE: "DEU", GB: "GBR",
  FR: "FRA", IN: "IND", BR: "BRA", TR: "TUR", IT: "ITA", CA: "CAN",
  ES: "ESP", AU: "AUS", MX: "MEX", ID: "IDN", ZA: "ZAF",
};

// code = World Bank가 쓰는 ISO 2글자 국가 코드
// hasCycle = OECD 경기선행지수(CLI)가 제공되는 나라인지 (경기 국면 화면에서 사용)
export const COUNTRIES = [
  { code: "KR", name: "대한민국", hasCycle: true },
  { code: "US", name: "미국", hasCycle: true },
  { code: "JP", name: "일본", hasCycle: true },
  { code: "CN", name: "중국", hasCycle: true },
  { code: "DE", name: "독일", hasCycle: true },
  { code: "GB", name: "영국", hasCycle: true },
  { code: "FR", name: "프랑스", hasCycle: true },
  { code: "IN", name: "인도", hasCycle: true },
  { code: "BR", name: "브라질", hasCycle: true },
  { code: "TR", name: "튀르키예", hasCycle: true },
  { code: "IT", name: "이탈리아", hasCycle: true },
  { code: "CA", name: "캐나다", hasCycle: true },
  { code: "ES", name: "스페인", hasCycle: true },
  { code: "AU", name: "호주", hasCycle: true },
  { code: "MX", name: "멕시코", hasCycle: true },
  { code: "ID", name: "인도네시아", hasCycle: true },
  { code: "ZA", name: "남아프리카공화국", hasCycle: true },
];

// 카테고리(지표 묶음) 정의. order 순서대로 탭이 그려집니다.
export const CATEGORIES = [
  { key: "core", label: "물가·성장·고용", about: "거시경제의 기본 상태를 보는 3대 지표" },
  { key: "market", label: "기업·시장", about: "국내 기업과 주식시장의 규모·활력" },
  { key: "fiscal", label: "재정·부채", about: "정부 살림살이의 건전성" },
  { key: "external", label: "대외·교역", about: "다른 나라와의 거래·자본 흐름" },
  { key: "finance", label: "금융·통화", about: "돈의 값(금리)과 양(통화량)" },
];

// ── 지표 한 개의 형식 ─────────────────────────────────────────
// key      : 앱 내부에서 쓰는 짧은 이름
// id       : World Bank 지표 코드
// label    : 화면에 보일 한글 이름
// unit     : 값 뒤에 붙일 단위
// category : 위 CATEGORIES 중 어디에 속하는지
// riskType : risk.js에서 어떤 판정 규칙을 쓸지 (없으면 리스크 신호 없이 추이만 표시)
// good     : "high" | "low" | "neutral" — 값이 높은 게 좋은지/나쁜지 (개요 화면 색상용)
// about    : 카드 하단에 보여줄 짧은 설명
// decimals : 표시 소수 자리 (기본 1)
export const INDICATORS = [
  // ── 1. 물가·성장·고용 ──────────────────────────────────────
  {
    key: "inflation", id: "FP.CPI.TOTL.ZG", label: "물가상승률", unit: "%",
    category: "core", riskType: "inflation", good: "neutral",
    about: "소비자물가지수(CPI)의 전년 대비 상승률",
  },
  {
    key: "gdpGrowth", id: "NY.GDP.MKTP.KD.ZG", label: "GDP 성장률", unit: "%",
    category: "core", riskType: "gdpGrowth", good: "high",
    about: "물가 영향을 제거한 실질 GDP의 전년 대비 성장률",
  },
  {
    key: "unemployment", id: "SL.UEM.TOTL.ZS", label: "실업률", unit: "%",
    category: "core", riskType: "unemployment", good: "low",
    about: "경제활동인구 중 실업자 비율 (ILO 모형 추정치)",
  },
  {
    key: "youthUnemployment", id: "SL.UEM.1524.ZS", label: "청년 실업률", unit: "%",
    category: "core", riskType: "youthUnemployment", good: "low",
    about: "15~24세 경제활동인구 중 실업자 비율",
  },
  {
    key: "gdpPerCapita", id: "NY.GDP.PCAP.KD", label: "1인당 실질 GDP", unit: "$",
    category: "core", good: "high", decimals: 0,
    about: "인구 1명당 실질 GDP (2015년 불변 미국 달러)",
  },

  // ── 2. 기업·시장 ──────────────────────────────────────────
  {
    key: "marketCap", id: "CM.MKT.LCAP.GD.ZS", label: "상장사 시가총액", unit: "% of GDP",
    category: "market", riskType: "marketCap", good: "neutral",
    about: "국내 상장기업 시가총액 합계 ÷ GDP. 주식시장이 경제 규모에 비해 얼마나 큰지",
  },
  {
    key: "listedFirms", id: "CM.MKT.LDOM.NO", label: "상장기업 수", unit: "개",
    category: "market", good: "high", decimals: 0,
    about: "증권거래소에 상장된 국내 기업의 총 수",
  },
  {
    key: "stocksTraded", id: "CM.MKT.TRAD.GD.ZS", label: "주식 거래대금", unit: "% of GDP",
    category: "market", good: "neutral",
    about: "1년간 거래된 주식 금액 ÷ GDP. 시장이 얼마나 활발한지",
  },
  {
    key: "turnover", id: "CM.MKT.TRNR", label: "시장 회전율", unit: "%",
    category: "market", good: "neutral",
    about: "거래대금 ÷ 시가총액. 투자자들이 주식을 얼마나 자주 사고파는지",
  },
  {
    key: "privateCredit", id: "FS.AST.PRVT.GD.ZS", label: "민간부문 신용", unit: "% of GDP",
    category: "market", riskType: "privateCredit", good: "neutral",
    about: "은행 등이 기업·가계에 빌려준 돈 ÷ GDP. 너무 빠르게 커지면 부채 위험",
  },
  {
    key: "newBusiness", id: "IC.BUS.NDNS.ZS", label: "신규 창업 밀도", unit: "건",
    category: "market", good: "high", decimals: 2,
    about: "생산가능인구(15~64세) 1,000명당 새로 등록된 법인 수",
  },
  {
    key: "industryShare", id: "NV.IND.TOTL.ZS", label: "산업 부가가치 비중", unit: "% of GDP",
    category: "market", good: "neutral",
    about: "제조업·건설·광공업이 GDP에서 차지하는 비중",
  },
  {
    key: "hiTechExports", id: "TX.VAL.TECH.MF.ZS", label: "첨단제품 수출 비중", unit: "%",
    category: "market", good: "high",
    about: "제조업 수출 중 항공·컴퓨터·의약 등 첨단 기술제품이 차지하는 비중",
  },

  // ── 3. 재정·부채 ──────────────────────────────────────────
  {
    key: "govDebt", id: "GC.DOD.TOTL.GD.ZS", label: "중앙정부 부채", unit: "% of GDP",
    category: "fiscal", riskType: "govDebt", good: "low",
    about: "중앙정부가 진 빚의 총액 ÷ GDP",
  },
  {
    key: "fiscalBalance", id: "GC.NLD.TOTL.GD.ZS", label: "재정수지", unit: "% of GDP",
    category: "fiscal", riskType: "fiscalBalance", good: "high",
    about: "정부의 (수입 − 지출) ÷ GDP. 마이너스면 적자",
  },
  {
    key: "taxRevenue", id: "GC.TAX.TOTL.GD.ZS", label: "조세수입", unit: "% of GDP",
    category: "fiscal", good: "neutral",
    about: "정부가 걷은 세금 ÷ GDP",
  },

  // ── 4. 대외·교역 ──────────────────────────────────────────
  {
    key: "currentAccount", id: "BN.CAB.XOKA.GD.ZS", label: "경상수지", unit: "% of GDP",
    category: "external", riskType: "currentAccount", good: "high",
    about: "무역·소득 등 대외 거래의 종합 수지 ÷ GDP. 마이너스면 적자",
  },
  {
    key: "tradeOpenness", id: "NE.TRD.GNFS.ZS", label: "무역 개방도", unit: "% of GDP",
    category: "external", good: "neutral",
    about: "(수출 + 수입) ÷ GDP. 경제가 대외 무역에 얼마나 의존하는지",
  },
  {
    key: "fdiInflow", id: "BX.KLT.DINV.WD.GD.ZS", label: "외국인 직접투자", unit: "% of GDP",
    category: "external", good: "high",
    about: "외국 자본이 공장·회사 설립 등에 투자한 순유입액 ÷ GDP",
  },
  {
    key: "reservesMonths", id: "FI.RES.TOTL.MO", label: "외환보유액", unit: "개월",
    category: "external", riskType: "reservesMonths", good: "high",
    about: "외환보유액으로 수입 대금을 몇 개월 치 낼 수 있는지 (3개월이 안전선)",
  },

  // ── 5. 금융·통화 ──────────────────────────────────────────
  {
    key: "lendingRate", id: "FR.INR.LEND", label: "대출금리", unit: "%",
    category: "finance", riskType: "lendingRate", good: "low",
    about: "은행이 기업·가계에 돈을 빌려줄 때 매기는 평균 금리",
  },
  {
    key: "realRate", id: "FR.INR.RINR", label: "실질금리", unit: "%",
    category: "finance", good: "neutral",
    about: "대출금리에서 물가상승률(GDP 디플레이터)을 뺀 금리",
  },
  {
    key: "broadMoney", id: "FM.LBL.BMNY.ZG", label: "광의통화(M2) 증가율", unit: "%",
    category: "finance", riskType: "broadMoney", good: "neutral",
    about: "시중에 풀린 넓은 의미의 돈(현금+예금 등)의 전년 대비 증가율",
  },
];

// key로 지표 하나를 찾습니다. 없으면 첫 번째(물가상승률)를 돌려줍니다.
export function getIndicator(key) {
  return INDICATORS.find((i) => i.key === key) ?? INDICATORS[0];
}

// code로 국가 하나를 찾습니다.
export function getCountry(code) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

// 특정 카테고리에 속한 지표만 골라 돌려줍니다.
export function indicatorsByCategory(categoryKey) {
  return INDICATORS.filter((i) => i.category === categoryKey);
}
