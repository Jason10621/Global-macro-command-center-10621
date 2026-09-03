import { Card } from "./ui.jsx";
import { formatValue } from "../lib/format.js";

// ─────────────────────────────────────────────────────────────
// 지표의 "가장 최근 값"을 큰 숫자로 보여주는 카드.
// ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, unit, year, about, decimals = 1 }) {
  return (
    <Card>
      <p className="text-sm text-neutral-500">{label}</p>

      <p className="mt-2 text-[36px] font-semibold leading-none tracking-tight sm:text-[40px]">
        {value == null ? "—" : formatValue(value, { decimals, unit: unit === "%" ? "%" : "" })}
        {value != null && unit && unit !== "%" && (
          <span className="ml-1.5 text-lg font-normal text-neutral-400">{unit}</span>
        )}
      </p>

      <p className="mt-2 text-sm text-neutral-400">{year ? `${year}년 기준` : ""}</p>

      {about && (
        <p className="mt-4 border-t border-neutral-100 pt-3 text-xs leading-relaxed text-neutral-400">
          {about}
        </p>
      )}
    </Card>
  );
}
