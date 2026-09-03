import { useState } from "react";
import { SegmentedControl } from "./components/ui.jsx";
import { SingleCountryView } from "./views/SingleCountryView.jsx";
import { BusinessCycleView } from "./views/BusinessCycleView.jsx";
import { CompareView } from "./views/CompareView.jsx";
import { RelationView } from "./views/RelationView.jsx";

// 상단 세그먼트 컨트롤에 들어갈 모드들
const MODES = [
  { value: "single", label: "단일 국가" },
  { value: "cycle", label: "경기 국면" },
  { value: "compare", label: "국가 비교" },
  { value: "relation", label: "관계 분석" },
];

// ─────────────────────────────────────────────────────────────
// 앱의 최상위 컴포넌트.
// 하는 일은 딱 하나: "지금 어떤 모드인가"를 기억하고, 그에 맞는 화면을 보여줍니다.
// 실제 데이터 로직은 각 View 컴포넌트 안에 들어 있습니다.
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("single");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        {/* ── 헤더 ── */}
        <header className="mb-8">
          <h1 className="text-[32px] font-semibold tracking-tight sm:text-[38px]">
            Global Macro Command Center
          </h1>
          <p className="mt-1.5 text-[15px] text-neutral-500">
            국가 경제 리스크 모니터 · 거시지표 · 기업/시장 · 재정 · 대외 · 경기 국면을 한눈에
          </p>
        </header>

        {/* ── 모드 전환 ── */}
        <div className="mb-8">
          <SegmentedControl value={mode} onChange={setMode} options={MODES} />
        </div>

        {/* ── 현재 모드에 해당하는 화면 ── */}
        {mode === "single" && <SingleCountryView />}
        {mode === "cycle" && <BusinessCycleView />}
        {mode === "compare" && <CompareView />}
        {mode === "relation" && <RelationView />}

        {/* ── 푸터 ── */}
        <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs leading-relaxed text-neutral-400">
          데이터 출처:{" "}
          <a className="underline hover:text-neutral-600" href="https://data.worldbank.org" target="_blank" rel="noreferrer">
            World Bank Open Data
          </a>
          ,{" "}
          <a className="underline hover:text-neutral-600" href="https://db.nomics.world" target="_blank" rel="noreferrer">
            DBnomics
          </a>{" "}
          (OECD 경기지표),{" "}
          <a className="underline hover:text-neutral-600" href="https://www.imf.org/external/datamapper" target="_blank" rel="noreferrer">
            IMF DataMapper
          </a>{" "}
          (전망). 리스크 신호·경기 국면은 학습용으로 만든 단순 규칙이며, 투자 판단의 근거가 아닙니다.
        </footer>
      </div>
    </div>
  );
}
