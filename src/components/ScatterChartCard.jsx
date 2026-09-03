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

// ─────────────────────────────────────────────────────────────
// 산점도(Scatter). 점 하나 = 한 해.
// x축과 y축에 서로 다른 지표를 놓아 "두 지표의 관계"를 눈으로 봅니다.
//   예) x = 실업률, y = 물가상승률  → 점들이 우하향이면 '필립스 곡선' 형태
//
//   data : [{ year, x, y }]
// ─────────────────────────────────────────────────────────────
export function ScatterChartCard({ title, data, xLabel, yLabel, xUnit = "%", yUnit = "%" }) {
  return (
    <Card className="p-5">
      <p className="mb-4 px-1 text-sm font-medium text-neutral-600">{title}</p>

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

            <Scatter data={data} fill="#0071e3" fillOpacity={0.75} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 px-1 text-xs text-neutral-400">
        점 하나 = 한 해 · 총 {data.length}개 연도
      </p>
    </Card>
  );
}
