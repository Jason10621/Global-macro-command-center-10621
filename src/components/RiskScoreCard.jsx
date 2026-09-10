import { Card } from "./ui.jsx";
import { TONE_CLASSES } from "../lib/risk.js";
import { CATEGORIES } from "../lib/indicators.js";

// ─────────────────────────────────────────────────────────────
// 종합 리스크 스코어 카드. (riskScore.js의 computeRiskScore 결과를 받음)
//   - 왼쪽: 0~100 점수 + 등급(양호/보통/주의/취약)
//   - 오른쪽: 안정/주의/위험 지표 개수
//   - 아래: 가장 취약한 지표 3개 (점수 낮은 순)
//
// "이 나라 경제, 지금 한 마디로 어떤가?"에 답하는 요약 카드입니다.
// ─────────────────────────────────────────────────────────────
export function RiskScoreCard({ score }) {
  if (!score) return null;
  const tone = TONE_CLASSES[score.tone];
  const catLabel = (key) => CATEGORIES.find((c) => c.key === key)?.label ?? key;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">종합 리스크 스코어</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-[40px] font-semibold leading-none tracking-tight ${tone.text}`}>
              {score.score}
            </span>
            <span className="text-lg text-neutral-400">/ 100</span>
            <span
              className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone.bg} ${tone.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {score.grade}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">
            리스크 규칙이 있는 지표 {score.n}개의 동일 가중 평균
          </p>
        </div>

        <div className="flex gap-3 text-center">
          <ToneCount n={score.counts.green} label="안정" tone="green" />
          <ToneCount n={score.counts.amber} label="주의" tone="amber" />
          <ToneCount n={score.counts.red} label="위험" tone="red" />
        </div>
      </div>

      {score.items.some((i) => i.tone !== "green") && (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <p className="mb-2 text-xs font-medium text-neutral-500">가장 취약한 지표</p>
          <ul className="space-y-1.5">
            {score.items
              .filter((i) => i.tone !== "green")
              .slice(0, 3)
              .map((i) => {
                const t = TONE_CLASSES[i.tone];
                return (
                  <li key={i.key} className="flex items-center gap-2 text-sm">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
                    <span className="text-neutral-700">{i.label}</span>
                    <span className="text-xs text-neutral-400">· {catLabel(i.category)}</span>
                    <span className={`ml-auto text-xs font-medium ${t.text}`}>{i.level}</span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <p className="mt-3 border-t border-neutral-100 pt-2 text-[11px] leading-relaxed text-neutral-400">
        공식 국가신용등급이 아니라, 이 앱의 리스크 규칙을 한 숫자로 요약한 학습용 지표입니다.
      </p>
    </Card>
  );
}

function ToneCount({ n, label, tone }) {
  const t = TONE_CLASSES[tone];
  return (
    <div>
      <p className={`text-xl font-semibold ${t.text}`}>{n}</p>
      <p className="text-[11px] text-neutral-400">{label}</p>
    </div>
  );
}
