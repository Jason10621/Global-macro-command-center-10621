import { Card } from "./ui.jsx";
import { TONE_CLASSES } from "../lib/risk.js";

// ─────────────────────────────────────────────────────────────
// 국가 한 줄 소개 카드. (지역 / 소득 수준 / 수도)
// World Bank 국가 메타데이터에서 가져옵니다.
// "이 나라가 어떤 위치의 경제인가"를 먼저 알려 주는 맥락 카드입니다.
//
//   scoreBadge : { score, grade, tone, delta } — 종합 리스크 스코어 요약 (선택)
//                delta 는 관심 국가일 때 지난 방문 대비 점수 변화
// ─────────────────────────────────────────────────────────────
export function CountryHeaderCard({ name, profile, scoreBadge }) {
  const badgeTone = scoreBadge ? TONE_CLASSES[scoreBadge.tone] : null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
        <div className="flex items-center gap-2">
          {scoreBadge && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badgeTone.bg} ${badgeTone.text}`}
              title="종합 리스크 스코어"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badgeTone.dot}`} />
              {scoreBadge.score} · {scoreBadge.grade}
              {scoreBadge.delta != null && scoreBadge.delta !== 0 && (
                <span className="opacity-70">
                  {scoreBadge.delta > 0 ? "▲" : "▼"}
                  {Math.abs(scoreBadge.delta)}
                </span>
              )}
            </span>
          )}
          {profile?.incomeLevel && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
              {profile.incomeLevel}
            </span>
          )}
        </div>
      </div>
      {profile && (
        <p className="mt-2 text-sm text-neutral-500">
          {[profile.region, profile.capitalCity && `수도 ${profile.capitalCity}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </Card>
  );
}
