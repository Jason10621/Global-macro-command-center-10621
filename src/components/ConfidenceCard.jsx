import { Card } from "./ui.jsx";
import { TONE_CLASSES } from "../lib/risk.js";
import { readConfidence } from "../lib/businessCycle.js";

// ─────────────────────────────────────────────────────────────
// 기업/소비자 심리지수 카드. 둘 다 100 = 장기 평균.
//   100 위 = 낙관, 아래 = 비관.
// 막대는 95~105 구간을 100 기준으로 그린 간단한 게이지입니다.
// ─────────────────────────────────────────────────────────────
function Row({ label, series }) {
  const latest = series?.length ? series[series.length - 1] : null;
  const value = latest?.value ?? null;
  const r = readConfidence(value);
  const tone = TONE_CLASSES[r.tone];

  // 95~105 범위를 0~100%로 환산해 막대 위치를 정합니다.
  const pct = value == null ? 50 : Math.min(100, Math.max(0, ((value - 95) / 10) * 100));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        <span className={`text-sm font-semibold ${tone.text}`}>
          {value == null ? "—" : value.toFixed(1)} · {r.label}
        </span>
      </div>
      <div className="relative mt-2 h-1.5 w-full rounded-full bg-neutral-100">
        {/* 100(장기 평균) 표시선 */}
        <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-neutral-300" />
        <span
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${tone.dot}`}
          style={{ left: `${pct}%` }}
        />
      </div>
      {latest && (
        <p className="mt-1 text-[11px] text-neutral-400">{latest.date} 기준</p>
      )}
    </div>
  );
}

export function ConfidenceCard({ bci, cci }) {
  const hasAny = (bci && bci.length) || (cci && cci.length);
  return (
    <Card className="p-5">
      <p className="text-sm text-neutral-500">체감 경기 (심리지수)</p>
      {hasAny ? (
        <div className="mt-4 space-y-4">
          <Row label="기업 (BCI)" series={bci} />
          <Row label="소비자 (CCI)" series={cci} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-400">
          이 국가는 OECD 심리지수가 제공되지 않습니다.
        </p>
      )}
    </Card>
  );
}
