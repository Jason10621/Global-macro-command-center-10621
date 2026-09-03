import { Card } from "./ui.jsx";
import { TONE_CLASSES } from "../lib/risk.js";

// ─────────────────────────────────────────────────────────────
// "경기 시계" — 지금 경기가 4국면(확장·둔화·수축·회복) 중 어디인지 보여줍니다.
// businessCycle.js 의 readBusinessCycle() 결과를 받아 해당 칸을 강조합니다.
//
//        상승(모멘텀 ↑)     하락(모멘텀 ↓)
//   추세 위 │  확장          │  둔화        │
//   추세 아래│  회복          │  수축        │
// ─────────────────────────────────────────────────────────────
const QUADRANTS = [
  { phase: "확장", sub: "추세 위 · 상승", tone: "green" },
  { phase: "둔화", sub: "추세 위 · 하락", tone: "amber" },
  { phase: "회복", sub: "추세 아래 · 상승", tone: "amber" },
  { phase: "수축", sub: "추세 아래 · 하락", tone: "red" },
];

export function PhaseGauge({ reading }) {
  const tone = TONE_CLASSES[reading.tone];

  return (
    <Card className="p-5">
      <p className="text-sm text-neutral-500">경기 국면 (OECD 선행지수 기준)</p>

      <div className="mt-3 flex items-center gap-2.5">
        <span className={`h-3 w-3 rounded-full ${tone.dot}`} />
        <span className={`text-[28px] font-semibold tracking-tight ${tone.text}`}>
          {reading.phase}
        </span>
        {reading.level != null && (
          <span className="text-sm text-neutral-400">
            CLI {reading.level.toFixed(1)} · 3개월 {reading.mom >= 0 ? "+" : ""}
            {reading.mom.toFixed(1)}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-500">{reading.note}</p>

      {/* 4칸 격자 — 현재 국면 칸만 색으로 강조 */}
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {QUADRANTS.map((q) => {
          const active = q.phase === reading.phase;
          const qt = TONE_CLASSES[q.tone];
          return (
            <div
              key={q.phase}
              className={`rounded-xl border p-3 transition
                ${active ? `${qt.bg} border-transparent` : "border-neutral-200 bg-white"}`}
            >
              <p className={`text-sm font-semibold ${active ? qt.text : "text-neutral-400"}`}>
                {q.phase}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-400">{q.sub}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
