import { useState } from "react";
import { COUNTRIES, getCountry } from "../lib/indicators.js";
import { useLeadingIndicators } from "../hooks/useMacroData.js";
import { readBusinessCycle } from "../lib/businessCycle.js";
import { Select, Spinner, ErrorBox } from "../components/ui.jsx";
import { PhaseGauge } from "../components/PhaseGauge.jsx";
import { ConfidenceCard } from "../components/ConfidenceCard.jsx";
import { TrendChart } from "../components/TrendChart.jsx";

// 최근 N개월만 남깁니다 (차트가 너무 촘촘해지지 않도록).
function lastMonths(series, n) {
  return series.slice(Math.max(0, series.length - n));
}

// 여러 월간 시계열을 date 기준으로 하나의 배열로 합칩니다.
// [{date:"2020-01", cli:99.1, bci:98.7, cci:100.2}, ...]
function mergeByDate(map) {
  const keys = Object.keys(map);
  const dates = new Set();
  keys.forEach((k) => map[k].forEach((p) => dates.add(p.date)));
  const idx = {};
  keys.forEach((k) => (idx[k] = new Map(map[k].map((p) => [p.date, p.value]))));
  return [...dates]
    .sort()
    .map((date) => {
      const row = { date };
      keys.forEach((k) => (row[k] = idx[k].get(date) ?? null));
      return row;
    });
}

// ─────────────────────────────────────────────────────────────
// [경기 국면] 화면.
//   OECD 경기선행지수(CLI) + 기업/소비자 심리지수(BCI/CCI)로
//   "지금 이 나라 경기가 어느 국면인가(확장·둔화·수축·회복)"를 읽습니다.
//
//   데이터: DBnomics → OECD (키 불필요, CORS 허용). 요청 1번.
// ─────────────────────────────────────────────────────────────
export function BusinessCycleView() {
  const [countryCode, setCountryCode] = useState("KR");
  const country = getCountry(countryCode);
  const { status, data, error } = useLeadingIndicators(countryCode);

  const cycleCountries = COUNTRIES.filter((c) => c.hasCycle);

  const reading = data ? readBusinessCycle(data.cli) : null;
  const cliChart = data ? lastMonths(data.cli, 132) : [];
  const confChart =
    data && (data.bci.length || data.cci.length)
      ? lastMonths(mergeByDate({ bci: data.bci, cci: data.cci }), 132)
      : [];

  return (
    <div className="space-y-6">
      <div className="w-full sm:max-w-xs">
        <Select
          label="국가"
          value={countryCode}
          onChange={setCountryCode}
          options={cycleCountries.map((c) => ({ value: c.code, label: c.name }))}
        />
      </div>

      <p className="text-sm leading-relaxed text-neutral-500">
        <b>경기선행지수(CLI)</b>는 신규 수주·재고·금리차·주가 등을 묶어 만든 지수로,
        6~9개월 뒤 경기 흐름을 미리 보여줍니다. <b>100</b>이 장기 추세선이며, 100을
        기준으로 위/아래인지와 방향(상승/하락)으로 경기 국면을 나눕니다.
      </p>

      {status === "loading" && <Spinner />}
      {status === "error" && <ErrorBox message={error} />}

      {status === "success" && reading && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PhaseGauge reading={reading} />
            <ConfidenceCard bci={data.bci} cci={data.cci} />
          </div>

          {cliChart.length > 0 && (
            <TrendChart
              title={`${country.name} 경기선행지수(CLI) · 최근 ${cliChart.length}개월`}
              data={cliChart}
              xKey="date"
              unit=""
              refLine={100}
              lines={[{ dataKey: "value", name: "CLI", color: "#0071e3" }]}
            />
          )}

          {confChart.length > 0 && (
            <TrendChart
              title={`${country.name} 체감 경기 (BCI · CCI) · 최근 ${confChart.length}개월`}
              data={confChart}
              xKey="date"
              unit=""
              refLine={100}
              lines={[
                { dataKey: "bci", name: "기업 BCI", color: "#0071e3" },
                { dataKey: "cci", name: "소비자 CCI", color: "#ff9500" },
              ]}
            />
          )}
        </>
      )}

      <p className="text-xs leading-relaxed text-neutral-400">
        데이터: OECD (DBnomics 경유). CLI·BCI·CCI는 진폭 조정(amplitude-adjusted) 계열이며
        100 = 장기 평균입니다. 국면 구분은 학습용으로 단순화한 규칙입니다.
      </p>
    </div>
  );
}
