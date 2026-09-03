import { INDICATORS } from "../lib/indicators.js";

// ─────────────────────────────────────────────────────────────
// 알약(pill) 모양 탭 버튼 묶음. 지표 선택·카테고리 선택에 두루 씁니다.
//
//   items    : [{ key, label }]  — 안 주면 INDICATORS 전체(하위 호환)
//   value    : 현재 선택된 key
//   onChange : (key) => void
//   size     : "sm" | "md"
// ─────────────────────────────────────────────────────────────
export function IndicatorTabs({ items, value, onChange, size = "md" }) {
  const list = items ?? INDICATORS.map((i) => ({ key: i.key, label: i.label }));
  const pad = size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm";

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={`rounded-full font-medium transition ${pad}
            ${
              value === it.key
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
            }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
