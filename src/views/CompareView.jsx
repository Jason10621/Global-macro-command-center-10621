import { useState } from "react";
import {
  COUNTRIES,
  CATEGORIES,
  getIndicator,
  getCountry,
  indicatorsByCategory,
} from "../lib/indicators.js";
import { useSeries } from "../hooks/useSeries.js";
import { Select, Spinner, ErrorBox } from "../components/ui.jsx";
import { IndicatorTabs } from "../components/IndicatorTabs.jsx";
import { TrendChart } from "../components/TrendChart.jsx";
import { assessRisk, TONE_CLASSES } from "../lib/risk.js";
import { formatValue } from "../lib/format.js";

// 두 나라 시계열을 "연도"를 기준으로 하나의 배열로 합칩니다.
function mergeByYear(seriesA, seriesB) {
  const bByYear = new Map(seriesB.map((d) => [d.year, d.value]));
  return seriesA
    .filter((d) => bByYear.has(d.year))
    .map((d) => ({ year: d.year, a: d.value, b: bByYear.get(d.year) }));
}

// 최근값 + 리스크 등급을 한 줄짜리 알약(badge)으로 보여줍니다.
function LatestBadge({ indicator, value }) {
  const risk = indicator.riskType ? assessRisk(indicator.riskType, value) : null;
  const tone = TONE_CLASSES[risk?.tone ?? "gray"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone.bg} ${tone.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {value == null
        ? "—"
        : formatValue(value, { decimals: indicator.decimals ?? 1, unit: indicator.unit === "%" ? "%" : "" })}
      {risk && ` · ${risk.level}`}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// [국가 비교] 화면. 두 나라를 같은 지표로 겹쳐 봅니다.
//   카테고리를 고르고 → 그 안의 지표를 골라 → 두 나라 추이를 한 차트에.
// ─────────────────────────────────────────────────────────────
export function CompareView() {
  const [codeA, setCodeA] = useState("KR");
  const [codeB, setCodeB] = useState("US");
  const [categoryKey, setCategoryKey] = useState("core");
  const [indicatorKey, setIndicatorKey] = useState("inflation");
  const indicator = getIndicator(indicatorKey);

  function selectCategory(key) {
    setCategoryKey(key);
    const first = indicatorsByCategory(key)[0];
    if (first) setIndicatorKey(first.key);
  }

  const resA = useSeries(codeA, indicator.id);
  const resB = useSeries(codeB, indicator.id);

  const loading = resA.status === "loading" || resB.status === "loading";
  const errored = resA.status === "error" || resB.status === "error";
  const ready = resA.status === "success" && resB.status === "success";

  const merged = ready ? mergeByYear(resA.data, resB.data) : [];
  const nameA = getCountry(codeA).name;
  const nameB = getCountry(codeB).name;

  const latestA = resA.data.length ? resA.data[resA.data.length - 1] : null;
  const latestB = resB.data.length ? resB.data[resB.data.length - 1] : null;

  const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="국가 A" value={codeA} onChange={setCodeA} options={countryOptions} />
        <Select label="국가 B" value={codeB} onChange={setCodeB} options={countryOptions} />
      </div>

      <div className="space-y-3">
        <IndicatorTabs
          items={CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
          value={categoryKey}
          onChange={selectCategory}
          size="sm"
        />
        <IndicatorTabs
          items={indicatorsByCategory(categoryKey).map((i) => ({ key: i.key, label: i.label }))}
          value={indicatorKey}
          onChange={setIndicatorKey}
          size="sm"
        />
      </div>

      {loading && <Spinner />}
      {errored && <ErrorBox message={resA.error || resB.error} />}

      {ready && (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{nameA}</span>
              {latestA && <LatestBadge indicator={indicator} value={latestA.value} />}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{nameB}</span>
              {latestB && <LatestBadge indicator={indicator} value={latestB.value} />}
            </div>
          </div>

          {merged.length === 0 ? (
            <ErrorBox message="두 국가가 겹치는 연도의 데이터가 없습니다." />
          ) : (
            <TrendChart
              title={`${indicator.label} 비교 (${merged[0].year}–${merged[merged.length - 1].year})`}
              data={merged}
              unit={indicator.unit === "%" ? "%" : ""}
              refLine={["fiscalBalance", "currentAccount"].includes(indicator.key) ? 0 : undefined}
              lines={[
                { dataKey: "a", name: nameA, color: "#0071e3" },
                { dataKey: "b", name: nameB, color: "#ff9500" },
              ]}
            />
          )}

          <p className="px-1 text-xs leading-relaxed text-neutral-400">{indicator.about}</p>
        </>
      )}
    </div>
  );
}
