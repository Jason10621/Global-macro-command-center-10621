import { useMemo, useState } from "react";
import {
  COUNTRIES,
  CATEGORIES,
  getIndicator,
  getCountry,
  indicatorsByCategory,
} from "../lib/indicators.js";
import { useAllIndicators } from "../hooks/useMacroData.js";
import { computeCategoryScores } from "../lib/riskScore.js";
import { eventsForRange } from "../lib/events.js";
import { Select, Spinner, ErrorBox, Toggle } from "../components/ui.jsx";
import { IndicatorTabs } from "../components/IndicatorTabs.jsx";
import { TrendChart } from "../components/TrendChart.jsx";
import { RadarCompareCard } from "../components/RadarCompareCard.jsx";
import { assessRisk, TONE_CLASSES } from "../lib/risk.js";
import { formatValue } from "../lib/format.js";

// 최대 3개국. 슬롯별 고정 색.
const SLOTS = [
  { key: "A", color: "#0071e3", default: "KR" },
  { key: "B", color: "#ff9500", default: "US" },
  { key: "C", color: "#34c759", default: "" }, // 빈 값 = 3번째 국가 없음
];

// 여러 나라의 한 지표 시계열을 "연도" 기준으로 하나의 배열로 합칩니다.
function mergeSeriesByYear(list) {
  // list: [{ name, data: [{year,value}] }]
  const years = new Set();
  list.forEach((s) => s.data.forEach((d) => years.add(d.year)));
  const maps = list.map((s) => new Map(s.data.map((d) => [d.year, d.value])));
  return [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const row = { year };
      list.forEach((s, i) => (row[s.name] = maps[i].get(year) ?? null));
      return row;
    });
}

// 최근값 + 리스크 등급을 한 줄짜리 알약(badge)으로.
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
// [국가 비교] 화면. 최대 3개국을 나란히 비교합니다.
//   1) 선택 지표 하나를 연도별 추이로 겹쳐 보기 (라인차트)
//   2) 카테고리별 건강 점수를 레이더(오각형)로 한눈에 비교
//
// ▷ 데이터: 국가당 useAllIndicators 1회 (World Bank 다중지표 요청).
//   라인차트와 레이더가 같은 응답을 공유합니다.
// ─────────────────────────────────────────────────────────────
export function CompareView() {
  const [codes, setCodes] = useState({ A: "KR", B: "US", C: "" });
  const [categoryKey, setCategoryKey] = useState("core");
  const [indicatorKey, setIndicatorKey] = useState("inflation");
  const [showEvents, setShowEvents] = useState(true);
  const indicator = getIndicator(indicatorKey);

  function selectCategory(key) {
    setCategoryKey(key);
    const first = indicatorsByCategory(key)[0];
    if (first) setIndicatorKey(first.key);
  }
  const setCode = (slot, code) => setCodes((cur) => ({ ...cur, [slot]: code }));

  const resA = useAllIndicators(codes.A);
  const resB = useAllIndicators(codes.B);
  const resC = useAllIndicators(codes.C);
  const resBySlot = { A: resA, B: resB, C: resC };

  // 실제로 선택된(코드가 있는) 슬롯만. 같은 국가 중복은 첫 슬롯만 남깁니다.
  const active = [];
  const seen = new Set();
  for (const slot of SLOTS) {
    const code = codes[slot.key];
    if (!code || seen.has(code)) continue;
    seen.add(code);
    active.push({ ...slot, code, name: getCountry(code).name, res: resBySlot[slot.key] });
  }

  const loading = active.some((c) => c.res.status === "loading");
  const errored = active.some((c) => c.res.status === "error");
  const ready = active.length >= 2 && active.every((c) => c.res.status === "success");

  const merged = useMemo(() => {
    if (!ready) return [];
    return mergeSeriesByYear(
      active.map((c) => ({ name: c.name, data: c.res.data[indicator.id] ?? [] }))
    );
  }, [ready, active, indicator.id]);

  const radarCountries = useMemo(
    () =>
      ready
        ? active.map((c) => ({
            code: c.code,
            name: c.name,
            color: c.color,
            categoryScores: computeCategoryScores(c.res.data),
          }))
        : [],
    [ready, active]
  );

  const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
  const rangeYears = merged.filter((r) =>
    active.some((c) => r[c.name] != null)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SLOTS.map((s) => (
          <Select
            key={s.key}
            label={s.key === "C" ? "국가 C (선택)" : `국가 ${s.key}`}
            value={codes[s.key]}
            onChange={(code) => setCode(s.key, code)}
            options={s.key === "C" ? [{ value: "", label: "없음" }, ...countryOptions] : countryOptions}
          />
        ))}
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
      {errored && <ErrorBox message={active.find((c) => c.res.status === "error")?.res.error} />}

      {ready && (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {active.map((c) => {
              const series = c.res.data[indicator.id] ?? [];
              const latest = series.length ? series[series.length - 1] : null;
              return (
                <div key={c.code} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="font-medium">{c.name}</span>
                  {latest && <LatestBadge indicator={indicator} value={latest.value} />}
                </div>
              );
            })}
          </div>

          {merged.length === 0 ? (
            <ErrorBox message="선택한 국가들이 겹치는 연도의 데이터가 없습니다." />
          ) : (
            <>
              <div className="flex justify-end px-1">
                <Toggle checked={showEvents} onChange={setShowEvents} label="주요 사건 표시" />
              </div>
              <TrendChart
                title={`${indicator.label} 비교 (${rangeYears[0]?.year ?? merged[0].year}–${
                  rangeYears[rangeYears.length - 1]?.year ?? merged[merged.length - 1].year
                })`}
                data={merged}
                unit={indicator.unit === "%" ? "%" : ""}
                refLine={["fiscalBalance", "currentAccount"].includes(indicator.key) ? 0 : undefined}
                events={
                  showEvents
                    ? eventsForRange(merged[0].year, merged[merged.length - 1].year)
                    : undefined
                }
                lines={active.map((c) => ({ dataKey: c.name, name: c.name, color: c.color }))}
              />
            </>
          )}

          <p className="px-1 text-xs leading-relaxed text-neutral-400">{indicator.about}</p>

          <RadarCompareCard countries={radarCountries} />
        </>
      )}
    </div>
  );
}
