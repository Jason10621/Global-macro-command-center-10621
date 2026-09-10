import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card } from "./ui.jsx";
import { TONE_CLASSES } from "../lib/risk.js";

// ─────────────────────────────────────────────────────────────
// 산점도(Scatter). 점 하나 = 한 해.
// x축과 y축에 서로 다른 지표를 놓아 "두 지표의 관계"를 눈으로 봅니다.
//   예) x = 실업률, y = 물가상승률  → 점들이 우하향이면 '필립스 곡선' 형태
//
//   data  : [{ year, x, y }]
//   trend : [{ x, y }, { x, y }]  ← 최소제곱 추세선의 양 끝 두 점 (correlation.js)
//   stat  : { label, tone, note } ← 상관계수 해석 (describeCorrelation 결과)
// ─────────────────────────────────────────────────────────────

// 추세선용 Scatter의 점 마커는 숨깁니다 (선만 보이게).
const hideDot = () => null;

export function ScatterChartCard({
  title,
  data,
  xLabel,
  yLabel,
  xUnit = "%",
  yUnit = "%",
  trend,
  stat,
}) {
  const statTone = TONE_CLASSES[stat?.tone ?? "gray"];

  return (
    <Card className="p-5">
      <p className="mb-1 px-1 text-sm font-medium text-neutral-600">{title}</p>

      {stat && (
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statTone.bg} ${statTone.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statTone.dot}`} />
            {stat.label}
          </span>
          <span className="text-xs text-neutral-400">{stat.note}</span>
        </div>
      )}

      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 20, left: -8 }}>
            <CartesianGrid stroke="#f0f0f0" />

            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              unit={xUnit}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{
                value: xLabel,
                position: "insideBottom",
                offset: -10,
                fontSize: 12,
                fill: "#9ca3af",
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              unit={yUnit}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            {/* 모든 점 크기를 동일하게 고정 */}
            <ZAxis range={[70, 70]} />

            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ borderRadius: 14, border: "1px solid #eee", fontSize: 13 }}
              formatter={(v, name) => [
                `${Number(v).toFixed(1)}${name === "x" ? xUnit : yUnit}`,
                name === "x" ? xLabel : yLabel,
              ]}
              labelFormatter={() => ""}
            />

            {/* 추세선 (최소제곱 직선) — 점 없이 선만 */}
            {trend && trend.length === 2 && (
              <Scatter
                data={trend}
                line={{ stroke: "#ff9500", strokeWidth: 2, strokeDasharray: "5 4" }}
                shape={hideDot}
                isAnimationActive={false}
                legendType="none"
              />
            )}

            <Scatter data={data} fill="#0071e3" fillOpacity={0.75} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 px-1 text-xs text-neutral-400">
        점 하나 = 한 해 · 총 {data.length}개 연도
        {trend && " · 주황 점선은 추세선"}
      </p>
    </Card>
  );
}
