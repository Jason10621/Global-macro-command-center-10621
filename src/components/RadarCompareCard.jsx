import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "./ui.jsx";

// ─────────────────────────────────────────────────────────────
// 여러 나라의 "카테고리별 건강 점수"를 한 레이더(오각형)에 겹쳐 봅니다.
//   축 5개 = 물가·성장·고용 / 기업·시장 / 재정·부채 / 대외·교역 / 금융·통화
//   각 축의 값 = 그 카테고리 지표들의 리스크 점수 평균 (0~100, 높을수록 건강)
//
// "이 나라는 재정은 튼튼한데 대외는 약하다" 같은 입체적 비교가 목적입니다.
//
//   countries : [{ code, name, color, categoryScores }]
//               categoryScores = computeCategoryScores(dataById) 결과
// ─────────────────────────────────────────────────────────────
export function RadarCompareCard({ countries }) {
  const active = countries.filter((c) => c.code && c.categoryScores);
  if (active.length === 0) return null;

  // 축(카테고리) 순서는 첫 국가의 categoryScores 순서를 따릅니다.
  const axes = active[0].categoryScores.map((c) => c.label);
  const data = axes.map((label, i) => {
    const row = { axis: label };
    for (const c of active) {
      const cell = c.categoryScores[i];
      row[c.name] = cell?.score ?? null;
    }
    return row;
  });

  return (
    <Card className="p-5">
      <p className="mb-1 px-1 text-sm font-medium text-neutral-600">
        카테고리별 건강 점수 비교
      </p>
      <p className="mb-3 px-1 text-xs text-neutral-400">
        바깥쪽(100)에 가까울수록 그 분야의 리스크 신호가 좋습니다. 점수는 이 앱의
        리스크 규칙을 요약한 학습용 지표입니다.
      </p>

      <div className="h-80 w-full">
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickCount={5}
            />
            {active.map((c) => (
              <Radar
                key={c.code}
                name={c.name}
                dataKey={c.name}
                stroke={c.color}
                fill={c.color}
                fillOpacity={0.12}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
            <Tooltip
              contentStyle={{ borderRadius: 14, border: "1px solid #eee", fontSize: 13 }}
              formatter={(v) => (v == null ? "데이터 없음" : `${v}점`)}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
