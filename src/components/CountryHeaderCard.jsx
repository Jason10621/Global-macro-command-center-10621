import { Card } from "./ui.jsx";

// ─────────────────────────────────────────────────────────────
// 국가 한 줄 소개 카드. (지역 / 소득 수준 / 수도)
// World Bank 국가 메타데이터에서 가져옵니다.
// "이 나라가 어떤 위치의 경제인가"를 먼저 알려 주는 맥락 카드입니다.
// ─────────────────────────────────────────────────────────────
export function CountryHeaderCard({ name, profile }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
        {profile?.incomeLevel && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
            {profile.incomeLevel}
          </span>
        )}
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
