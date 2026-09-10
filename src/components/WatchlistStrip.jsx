import { getCountry } from "../lib/indicators.js";
import { readScore } from "../lib/scoreMemory.js";
import { gradeFor } from "../lib/riskScore.js";
import { TONE_CLASSES } from "../lib/risk.js";

// ─────────────────────────────────────────────────────────────
// 관심 국가 빠른 이동 스트립. (useWatchlist + scoreMemory)
//   칩 하나 = 관심 국가 1개.  이름 + 마지막으로 본 종합 점수(색은 등급).
//   칩을 누르면 그 국가로 전환합니다. 현재 보는 국가는 파란 테두리로 표시.
// ─────────────────────────────────────────────────────────────
export function WatchlistStrip({ codes, currentCode, onSelect }) {
  if (!codes || codes.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-neutral-400">관심 국가</span>
      {codes.map((code) => {
        const name = getCountry(code).name;
        const score = readScore(code);
        const tone = score != null ? TONE_CLASSES[gradeFor(score).tone] : TONE_CLASSES.gray;
        const isCurrent = code === currentCode;
        return (
          <button
            key={code}
            onClick={() => onSelect(code)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition
              ${isCurrent ? "border-blue-500 bg-blue-50/50 text-neutral-900" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {name}
            {score != null && <span className="text-neutral-400">{score}</span>}
          </button>
        );
      })}
    </div>
  );
}
