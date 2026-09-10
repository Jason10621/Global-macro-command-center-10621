import { useMemo, useState } from "react";
import {
  COUNTRIES,
  CATEGORIES,
  getIndicator,
  getCountry,
  indicatorsByCategory,
} from "../lib/indicators.js";
import {
  useAllIndicators,
  useCountryProfile,
  useImfOutlook,
} from "../hooks/useMacroData.js";
import { computeRiskScore } from "../lib/riskScore.js";
import { Select, Spinner, ErrorBox } from "../components/ui.jsx";
import { IndicatorTabs } from "../components/IndicatorTabs.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { RiskCard } from "../components/RiskCard.jsx";
import { RiskScoreCard } from "../components/RiskScoreCard.jsx";
import { TrendChart } from "../components/TrendChart.jsx";
import { OverviewGrid } from "../components/OverviewGrid.jsx";
import { CountryHeaderCard } from "../components/CountryHeaderCard.jsx";
import { ForecastCard } from "../components/ForecastCard.jsx";

// ─────────────────────────────────────────────────────────────
// [단일 국가] 화면.
//   1) 국가 선택 + 국가 개요 카드
//   2) 카테고리 탭(물가·성장·고용 / 기업·시장 / 재정·부채 / 대외·교역 / 금융·통화)
//   3) 그 카테고리 지표들을 타일 격자로 한눈에 (OverviewGrid)
//   4) 타일 하나를 고르면 최근값·리스크·추이 차트 상세
//   5) 맨 아래 IMF 경제 전망
//
// ▷ 데이터 호출은 useAllIndicators 한 번뿐 — World Bank 지표 20여 개를
//   세미콜론으로 이어 붙여 한 요청으로 받아옵니다. 타일과 상세 차트가 이걸 공유합니다.
// ─────────────────────────────────────────────────────────────
export function SingleCountryView() {
  const [countryCode, setCountryCode] = useState("KR");
  const [categoryKey, setCategoryKey] = useState("core");
  const [indicatorKey, setIndicatorKey] = useState("inflation");

  const country = getCountry(countryCode);
  const indicator = getIndicator(indicatorKey);

  const { status, data: dataById, error } = useAllIndicators(countryCode);
  const profile = useCountryProfile(countryCode);
  const imf = useImfOutlook(countryCode);

  // 종합 리스크 스코어: 지표 응답이 성공했을 때만 계산 (dataById가 바뀔 때만 재계산)
  const riskScore = useMemo(
    () => (status === "success" ? computeRiskScore(dataById) : null),
    [status, dataById]
  );

  // 카테고리를 바꾸면, 선택 지표를 그 카테고리의 첫 지표로 맞춥니다.
  function selectCategory(key) {
    setCategoryKey(key);
    const first = indicatorsByCategory(key)[0];
    if (first) setIndicatorKey(first.key);
  }

  const series = dataById[indicator.id] ?? [];
  const latest = series.length ? series[series.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* ── 국가 선택 ── */}
      <div className="w-full sm:max-w-xs">
        <Select
          label="국가"
          value={countryCode}
          onChange={setCountryCode}
          options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
        />
      </div>

      {/* ── 국가 개요 ── */}
      <CountryHeaderCard
        name={country.name}
        profile={profile.data}
        scoreBadge={riskScore ? { score: riskScore.score, grade: riskScore.grade, tone: riskScore.tone } : null}
      />

      {/* ── 카테고리 탭 ── */}
      <div>
        <IndicatorTabs
          items={CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
          value={categoryKey}
          onChange={selectCategory}
          size="sm"
        />
        <p className="mt-2 px-1 text-xs text-neutral-400">
          {CATEGORIES.find((c) => c.key === categoryKey)?.about}
        </p>
      </div>

      {/* ── 상태별 화면 ── */}
      {status === "loading" && <Spinner />}
      {status === "error" && <ErrorBox message={error} />}

      {status === "success" && (
        <>
          {/* 종합 리스크 스코어 요약 */}
          <RiskScoreCard score={riskScore} />

          {/* 카테고리 지표 한눈에 보기 */}
          <OverviewGrid
            categoryKey={categoryKey}
            dataById={dataById}
            selectedKey={indicatorKey}
            onSelect={setIndicatorKey}
          />

          {/* 선택 지표 상세 */}
          {latest ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                  label={`${country.name} · ${indicator.label}`}
                  value={latest.value}
                  unit={indicator.unit}
                  year={latest.year}
                  about={indicator.about}
                  decimals={indicator.decimals}
                />
                {indicator.riskType ? (
                  <RiskCard riskType={indicator.riskType} value={latest.value} />
                ) : (
                  <StatCard
                    label="이 지표는"
                    value={null}
                    unit=""
                    about="리스크 신호 없이 추이만 봅니다. 값의 방향(상승/하락)과 다른 나라와의 상대 비교로 해석하세요."
                  />
                )}
              </div>

              <TrendChart
                title={`${indicator.label} 추이 (${series[0].year}–${latest.year})`}
                data={series}
                unit={indicator.unit === "%" ? "%" : ""}
                lines={[{ dataKey: "value", name: indicator.label, color: "#0071e3" }]}
                refLine={
                  ["fiscalBalance", "currentAccount"].includes(indicator.key) ? 0 : undefined
                }
              />
            </>
          ) : (
            <ErrorBox message={`${country.name}의 ${indicator.label} 데이터가 없습니다. 다른 지표를 선택해 보세요.`} />
          )}

          {/* IMF 전망 */}
          <ForecastCard
            outlook={imf.status === "success" ? imf.data : {}}
            error={imf.status === "error"}
          />
        </>
      )}
    </div>
  );
}
