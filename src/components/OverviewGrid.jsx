import { indicatorsByCategory } from "../lib/indicators.js";
import { assessRisk, TONE_CLASSES } from "../lib/risk.js";
import { formatValue, trend } from "../lib/format.js";

// ─────────────────────────────────────────────────────────────
// 한 카테고리(예: "기업·시장")에 속한 지표들을 작은 타일 격자로 한눈에 보여줍니다.
// 타일 하나 = 지표 하나:  이름 / 최근값 / 전년 대비 변화 화살표 / 리스크 색점
// 타일을 누르면 아래쪽 상세 차트가 그 지표로 바뀝니다. (onSelect)
//
//   dataById : { "FP.CPI.TOTL.ZG": [{year,value}...], ... }  ← useAllIndicators 결과
// ─────────────────────────────────────────────────────────────
export function OverviewGrid({ categoryKey, dataById, selectedKey, onSelect }) {
  const list = indicatorsByCategory(categoryKey);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {list.map((ind) => {
        const series = dataById[ind.id] ?? [];
        const latest = series.length ? series[series.length - 1] : null;
        const t = trend(series);
        const risk = ind.riskType ? assessRisk(ind.riskType, latest?.value) : null;
        const dot = risk ? TONE_CLASSES[risk.tone].dot : null;
        const isSelected = ind.key === selectedKey;

        // 변화 화살표 색: "높을수록 좋은" 지표면 상승=초록, "낮을수록 좋은" 지표면 반대.
        // neutral 지표는 방향만 회색으로.
        let arrowColor = "text-neutral-400";
        if (ind.good === "high") arrowColor = t.dir > 0 ? "text-emerald-600" : t.dir < 0 ? "text-red-500" : "text-neutral-400";
        if (ind.good === "low") arrowColor = t.dir < 0 ? "text-emerald-600" : t.dir > 0 ? "text-red-500" : "text-neutral-400";

        return (
          <button
            key={ind.key}
            onClick={() => onSelect(ind.key)}
            className={`flex flex-col items-start rounded-2xl border p-3 text-left transition
              ${
                isSelected
                  ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
          >
            <div className="flex w-full items-center gap-1.5">
              {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />}
              <span className="truncate text-xs font-medium text-neutral-500">
                {ind.label}
              </span>
            </div>

            <span className="mt-1.5 text-lg font-semibold tracking-tight">
              {latest
                ? formatValue(latest.value, { decimals: ind.decimals ?? 1, unit: ind.unit === "% of GDP" ? "%" : ind.unit })
                : "—"}
            </span>

            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-400">
              {latest ? `${latest.year}` : "데이터 없음"}
              {t.delta != null && (
                <span className={arrowColor}>
                  {t.arrow} {Math.abs(t.delta).toFixed(ind.decimals ?? 1)}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
