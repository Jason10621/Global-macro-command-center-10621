import { Card } from "./ui.jsx";
import { assessRisk, TONE_CLASSES } from "../lib/risk.js";

// ─────────────────────────────────────────────────────────────
// 최근 값을 risk.js의 규칙에 넣어 "안정 / 주의 / 위험" 신호로 보여주는 카드.
// 이 카드가 있어서 앱이 '차트 뷰어'가 아니라 '리스크 모니터'가 됩니다.
// ─────────────────────────────────────────────────────────────
export function RiskCard({ riskType, value }) {
  const risk = assessRisk(riskType, value);
  const tone = TONE_CLASSES[risk.tone];

  return (
    <Card>
      <p className="text-sm text-neutral-500">리스크 신호</p>

      <div className="mt-3 flex items-center gap-2.5">
        <span className={`h-3 w-3 rounded-full ${tone.dot}`} />
        <span className={`text-[28px] font-semibold tracking-tight ${tone.text}`}>
          {risk.level}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-500">{risk.note}</p>
    </Card>
  );
}
