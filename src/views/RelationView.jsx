import { useMemo, useState } from "react";
import { COUNTRIES, INDICATORS, getCountry, getIndicator } from "../lib/indicators.js";
import { usePair } from "../hooks/usePair.js";
import { Select, Spinner, ErrorBox } from "../components/ui.jsx";
import { ScatterChartCard } from "../components/ScatterChartCard.jsx";
import { pearson, trendLinePoints, describeCorrelation } from "../lib/correlation.js";

// 관계 분석에서 자주 보는 조합 몇 가지를 프리셋으로 제공합니다.
const PRESETS = [
  { label: "실업률 ↔ 물가상승률 (필립스 곡선)", x: "unemployment", y: "inflation" },
  { label: "정부부채 ↔ 대출금리", x: "govDebt", y: "lendingRate" },
  { label: "민간신용 ↔ GDP 성장률", x: "privateCredit", y: "gdpGrowth" },
  { label: "경상수지 ↔ 물가상승률", x: "currentAccount", y: "inflation" },
  { label: "시가총액(%GDP) ↔ 1인당 GDP", x: "marketCap", y: "gdpPerCapita" },
];

// 시차(년) 선택지. x(t) 를 y(t+lag) 와 짝지어 선행/후행 관계를 봅니다.
const LAGS = [
  { value: "0", label: "같은 해" },
  { value: "1", label: "y를 1년 뒤와" },
  { value: "2", label: "y를 2년 뒤와" },
  { value: "3", label: "y를 3년 뒤와" },
  { value: "-1", label: "y를 1년 앞과" },
  { value: "-2", label: "y를 2년 앞과" },
];

// ─────────────────────────────────────────────────────────────
// [관계 분석] 화면. 두 지표를 x·y축에 놓고 산점도로 상관관계를 봅니다.
//   점 하나 = 한 해.  두 지표가 반대로 움직이면 우하향, 같이 움직이면 우상향.
//   + 피어슨 상관계수(r)와 최소제곱 추세선을 얹어 "얼마나" 강한지 정량화.
//   + 시차(lag)를 두면 "x가 y를 몇 년 선행하는가"도 볼 수 있습니다.
// ─────────────────────────────────────────────────────────────
export function RelationView() {
  const [countryCode, setCountryCode] = useState("US");
  const [xKey, setXKey] = useState("unemployment");
  const [yKey, setYKey] = useState("inflation");
  const [lag, setLag] = useState("0");

  const country = getCountry(countryCode);
  const X = getIndicator(xKey);
  const Y = getIndicator(yKey);
  const lagN = Number(lag);

  const { status, data, error } = usePair(countryCode, X.id, Y.id, lagN);

  // 상관계수·추세선은 데이터가 바뀔 때만 다시 계산합니다.
  const { r, trend, stat } = useMemo(() => {
    if (status !== "success" || data.length < 2) return { r: null, trend: null, stat: null };
    const rr = pearson(data);
    return { r: rr, trend: trendLinePoints(data), stat: describeCorrelation(rr) };
  }, [status, data]);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select label="가로축 (x)" value={xKey} onChange={setXKey} options={indicatorOptions} />
        <Select label="세로축 (y)" value={yKey} onChange={setYKey} options={indicatorOptions} />
        <Select label="시차" value={lag} onChange={setLag} options={LAGS} />
      </div>

      <p className="text-sm leading-relaxed text-neutral-500">
        가로축은 <b>{X.label}</b>, 세로축은 <b>{Y.label}</b> 입니다. 점 하나가 한 해예요.
        {lagN !== 0 && (
          <>
            {" "}지금은 <b>{X.label}</b>(t년)을 <b>{Y.label}</b>({t2(lagN)}년)와 짝지어,
            앞 지표가 뒤 지표를 <b>{lagN > 0 ? "선행" : "후행"}</b>하는지 봅니다.
          </>
        )}{" "}
        점들이 왼쪽 위 → 오른쪽 아래로 흩어지면 두 지표가 <b>반대로</b>, 왼쪽 아래 →
        오른쪽 위면 <b>같이</b> 움직인다는 뜻입니다.
      </p>

      {status === "loading" && <Spinner />}
      {status === "error" && <ErrorBox message={error} />}
      {status === "success" && (
        <>
          <ScatterChartCard
            title={`${country.name} — ${X.label} vs ${Y.label}${lagN !== 0 ? ` (시차 ${lagN > 0 ? "+" : ""}${lagN}년)` : ""}`}
            data={data}
            xLabel={X.label}
            yLabel={Y.label}
            xUnit={X.unit === "%" ? "%" : ""}
            yUnit={Y.unit === "%" ? "%" : ""}
            trend={trend}
            stat={stat}
          />
          <p className="px-1 text-xs leading-relaxed text-neutral-400">
            상관계수는 <b>선형</b> 관계의 강도만 재며, <b>인과관계를 뜻하지 않습니다</b>.
            연도 수가 적으면 값이 크게 흔들리니 참고용으로만 보세요.
          </p>
        </>
      )}
    </div>
  );
}

// "t-1", "t+2" 같은 라벨 도우미
function t2(lag) {
  if (lag === 0) return "t";
  return `t${lag > 0 ? "+" : "−"}${Math.abs(lag)}`;
}
