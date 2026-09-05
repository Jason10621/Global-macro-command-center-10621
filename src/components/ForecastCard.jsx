import { Card } from "./ui.jsx";
import { IMF_INDICATORS } from "../api/imf.js";

// ─────────────────────────────────────────────────────────────
// IMF 세계경제전망(WEO) 기반 향후 전망 카드.
// 각 지표에 대해 [직전 실적치 → 올해 → 내년 → 내후년] 을 한 줄로 보여줍니다.
// 미래 연도 값은 IMF 추정·전망치입니다 (카드 하단에 명시).
//
//   outlook : { "NGDP_RPCH": [{year,value}...], ... }  ← useImfOutlook 결과
// ─────────────────────────────────────────────────────────────
export function ForecastCard({ outlook, error }) {
  const thisYear = new Date().getFullYear();
  // 보여줄 연도: 작년 ~ 3년 뒤
  const years = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2];

  const rows = IMF_INDICATORS.map((ind) => {
    const series = outlook?.[ind.code];
    if (!series || !series.length) return null;
    const byYear = new Map(series.map((d) => [d.year, d.value]));
    return {
      label: ind.label,
      unit: ind.unit === "% of GDP" ? "%" : ind.unit,
      cells: years.map((y) => (byYear.has(y) ? byYear.get(y) : null)),
    };
  }).filter(Boolean);

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-neutral-600">경제 전망 (IMF)</p>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">
          {error
            ? "IMF 전망 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
            : "이 국가의 IMF 전망 데이터가 없습니다."}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-neutral-400">
                <th className="pb-2 text-left font-medium">지표</th>
                {years.map((y) => (
                  <th key={y} className="pb-2 text-right font-medium">
                    {y}
                    {y >= thisYear && <span className="ml-0.5 text-blue-500">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-neutral-100">
                  <td className="py-2 text-left text-neutral-600">{r.label}</td>
                  {r.cells.map((v, i) => (
                    <td key={i} className="py-2 text-right tabular-nums text-neutral-800">
                      {v == null ? "—" : `${v.toFixed(1)}${r.unit}`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <p className="mt-3 border-t border-neutral-100 pt-2 text-[11px] leading-relaxed text-neutral-400">
          <span className="text-blue-500">*</span> {thisYear}년 이후 값은 IMF 추정·전망치입니다.
        </p>
      )}
    </Card>
  );
}
