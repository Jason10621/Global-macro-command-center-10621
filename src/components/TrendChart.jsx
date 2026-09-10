import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card } from "./ui.jsx";

// ─────────────────────────────────────────────────────────────
// 추이 라인차트. (Recharts 사용)
//
//   data   : [{ [xKey], ...값들 }]  ← 이미 병합된 배열
//   lines  : [{ dataKey, name, color }]  ← 한 개면 단일, 여러 개면 비교
//   xKey   : x축으로 쓸 필드명 (기본 "year", 월간 데이터면 "date")
//   unit   : y축·툴팁 단위
//   refLine: 숫자를 주면 그 높이에 점선 기준선을 그림 (예: CLI 100, 수지 0)
//   events : [{ year, label, scope }] ← 연도 세로선으로 겹칠 주요 사건 (events.js)
//            xKey === "year" 이고, 그 연도가 data에 있을 때만 그려집니다.
// ─────────────────────────────────────────────────────────────
export function TrendChart({ title, data, lines, unit = "%", xKey = "year", refLine, events }) {
  const years = xKey === "year" ? new Set(data.map((d) => d.year)) : null;
  const shownEvents = years ? (events ?? []).filter((e) => years.has(e.year)) : [];

  return (
    <Card className="p-5">
      <p className="mb-4 px-1 text-sm font-medium text-neutral-600">{title}</p>

      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="#f0f0f0" vertical={false} />

            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              width={44}
              unit={unit}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: "1px solid #eee",
                boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
              formatter={(v) => `${Number(v).toFixed(1)}${unit}`}
            />

            {refLine != null && (
              <ReferenceLine
                y={refLine}
                stroke="#c7c7c7"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}

            {shownEvents.map((e) => (
              <ReferenceLine
                key={`${e.year}-${e.label}`}
                x={e.year}
                stroke={e.scope === "country" ? "#ff9500" : "#b0b0b0"}
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: String(e.year),
                  position: "top",
                  fontSize: 10,
                  fill: e.scope === "country" ? "#ff9500" : "#9ca3af",
                }}
              />
            ))}

            {lines.map((ln) => (
              <Line
                key={ln.dataKey}
                type="monotone"
                dataKey={ln.dataKey}
                name={ln.name}
                stroke={ln.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {lines.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-4 px-1">
          {lines.map((ln) => (
            <span
              key={ln.dataKey}
              className="flex items-center gap-1.5 text-xs text-neutral-500"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: ln.color }}
              />
              {ln.name}
            </span>
          ))}
        </div>
      )}

      {shownEvents.length > 0 && (
        <p className="mt-3 border-t border-neutral-100 pt-2 text-[11px] leading-relaxed text-neutral-400">
          <span className="font-medium">주요 사건</span>{" "}
          {shownEvents.map((e, i) => (
            <span key={`${e.year}-${e.label}`}>
              {i > 0 && " · "}
              <span className={e.scope === "country" ? "text-amber-600" : ""}>
                {e.year} {e.label}
              </span>
            </span>
          ))}
        </p>
      )}
    </Card>
  );
}
