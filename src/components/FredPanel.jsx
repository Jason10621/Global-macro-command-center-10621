import { Card } from "./ui.jsx";
import { TrendChart } from "./TrendChart.jsx";
import { FRED_SERIES } from "../api/fred.js";

// ─────────────────────────────────────────────────────────────
// 미국 고빈도 지표(FRED) 패널. 단일 국가 화면에서 "미국"일 때만 보입니다.
//
//   bundle : { "T10Y2Y": [{date,value}...], ... }  ← useFredBundle 결과 (없으면 이 컴포넌트를 렌더하지 않음)
//
// World Bank는 대부분 "연간"이라 반응이 느립니다. FRED의 월간·일간 시계열은
// 최근 국면 변화(금리 역전, 정책금리, 실업률)를 더 빠르게 보여줍니다.
// ─────────────────────────────────────────────────────────────
export function FredPanel({ bundle }) {
  const available = FRED_SERIES.filter((s) => bundle?.[s.id]?.length);
  if (available.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-neutral-600">미국 고빈도 지표 (FRED)</p>
      <p className="mt-1 text-xs text-neutral-400">
        연간 위주의 World Bank 지표보다 국면 변화를 빠르게 보여주는 월간·일간 계열입니다.
      </p>

      <div className="mt-4 space-y-5">
        {available.map((s) => {
          const data = bundle[s.id];
          return (
            <div key={s.id}>
              <TrendChart
                title={`${s.label} · ${data[0].date.slice(0, 7)}~${data[data.length - 1].date.slice(0, 7)}`}
                data={data}
                xKey="date"
                unit={s.unit}
                refLine={s.refLine}
                lines={[{ dataKey: "value", name: s.label, color: "#0071e3" }]}
              />
              <p className="mt-1 px-1 text-xs leading-relaxed text-neutral-400">{s.about}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-neutral-100 pt-2 text-[11px] leading-relaxed text-neutral-400">
        출처: FRED (미국 세인트루이스 연준). 배포 환경의 프록시 또는 빌드 시 스냅샷으로 제공됩니다.
      </p>
    </Card>
  );
}
