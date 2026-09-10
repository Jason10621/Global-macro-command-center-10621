// ─────────────────────────────────────────────────────────────
// 화면에서 쓰는 "데이터 불러오기" 훅 모음.
// 모두 useAsync 위에 얇게 얹은 것이라 각자 몇 줄뿐입니다.
// ─────────────────────────────────────────────────────────────
import { useAsync } from "./useAsync.js";
import {
  fetchManyIndicators,
  fetchCountryProfile,
} from "../api/worldBank.js";
import { fetchLeadingIndicators } from "../api/dbnomics.js";
import { fetchImfOutlook } from "../api/imf.js";
import { INDICATORS, ISO3 } from "../lib/indicators.js";

// 모든 World Bank 지표를 한 국가에 대해 한 번에 불러옵니다. (개요 그리드용)
// data 형태: { "FP.CPI.TOTL.ZG": [{year,value}...], ... }
// countryCode 가 비어 있으면(국가 비교 화면의 "3번째 국가 없음") 즉시 빈 결과를 돌려줍니다.
export function useAllIndicators(countryCode) {
  const ids = INDICATORS.map((i) => i.id);
  return useAsync(
    () => (countryCode ? fetchManyIndicators(countryCode, ids) : Promise.resolve({})),
    [countryCode],
    {}
  );
}

// 국가 기본 정보(지역·소득수준·수도).
export function useCountryProfile(countryCode) {
  return useAsync(() => fetchCountryProfile(countryCode), [countryCode], null);
}

// OECD 경기선행지수 3종(CLI·BCI·CCI). ISO2 → ISO3 변환 후 호출.
export function useLeadingIndicators(countryCode) {
  const iso3 = ISO3[countryCode];
  return useAsync(() => fetchLeadingIndicators(iso3), [countryCode], null);
}

// IMF 경제 전망(과거 + 향후 몇 년). 프록시/정적 스냅샷 둘 다 실패할 수 있으니
// "있으면 좋은 부가 정보"로 취급해 실패해도 화면 나머지는 그대로 둡니다.
export function useImfOutlook(countryCode) {
  const iso3 = ISO3[countryCode];
  return useAsync(() => fetchImfOutlook(iso3), [countryCode], {}, true);
}
