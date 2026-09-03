import { useState } from "react";
import { COUNTRIES, INDICATORS, getCountry, getIndicator } from "../lib/indicators.js";
import { usePair } from "../hooks/usePair.js";
import { Select, Spinner, ErrorBox } from "../components/ui.jsx";
import { ScatterChartCard } from "../components/ScatterChartCard.jsx";

// 관계 분석에서 자주 보는 조합 몇 가지를 프리셋으로 제공합니다.
const PRESETS = [
  { label: "실업률 ↔ 물가상승률 (필립스 곡선)", x: "unemployment", y: "inflation" },
  { label: "정부부채 ↔ 대출금리", x: "govDebt", y: "lendingRate" },
  { label: "민간신용 ↔ GDP 성장률", x: "privateCredit", y: "gdpGrowth" },
  { label: "경상수지 ↔ 물가상승률", x: "currentAccount", y: "inflation" },
  { label: "시가총액(%GDP) ↔ 1인당 GDP", x: "marketCap", y: "gdpPerCapita" },
];

// ─────────────────────────────────────────────────────────────
// [관계 분석] 화면. 두 지표를 x·y축에 놓고 산점도로 상관관계를 봅니다.
//   점 하나 = 한 해.  두 지표가 반대로 움직이면 우하향, 같이 움직이면 우상향.
// ─────────────────────────────────────────────────────────────
export function RelationView() {
  const [countryCode, setCountryCode] = useState("US");
  const [xKey, setXKey] = useState("unemployment");
  const [yKey, setYKey] = useState("inflation");

  const country = getCountry(countryCode);
  const X = getIndicator(xKey);
  const Y = getIndicator(yKey);

  const { status, data, error } = usePair(countryCode, X.id, Y.id);

  const indicatorOptions = INDICATORS.map((i) => ({ value: i.key, label: i.label }));

  function applyPreset(e) {
    const p = PRESETS.find((p) => p.label === e);
    if (p) {
      setXKey(p.x);
      setYKey(p.y);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="국가"
          value={countryCode}
          onChange={setCountryCode}
          options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
        />
        <Select
          label="빠른 조합"
          value=""
          onChange={applyPreset}
          options={[{ value: "", label: "직접 고르기…" }, ...PRESETS.map((p) => ({ value: p.label, label: p.label }))]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="가로축 (x)" value={xKey} onChange={setXKey} options={indicatorOptions} />
        <Select label="세로축 (y)" value={yKey} onChange={setYKey} options={indicatorOptions} />
      </div>

      <p className="text-sm leading-relaxed text-neutral-500">
        가로축은 <b>{X.label}</b>, 세로축은 <b>{Y.label}</b> 입니다. 점 하나가 한 해예요.
        점들이 왼쪽 위 → 오른쪽 아래로 흩어지면 두 지표가 <b>반대로</b>, 왼쪽 아래 →
        오른쪽 위면 <b>같이</b> 움직인다는 뜻입니다.
      </p>

      {status === "loading" && <Spinner />}
      {status === "error" && <ErrorBox message={error} />}
      {status === "success" && (
        <ScatterChartCard
          title={`${country.name} — ${X.label} vs ${Y.label}`}
          data={data}
          xLabel={X.label}
          yLabel={Y.label}
          xUnit={X.unit === "%" ? "%" : ""}
          yUnit={Y.unit === "%" ? "%" : ""}
        />
      )}
    </div>
  );
}
