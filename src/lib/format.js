// ─────────────────────────────────────────────────────────────
// 숫자를 화면에 보기 좋게 바꾸는 아주 작은 도우미 모음.
// ─────────────────────────────────────────────────────────────

// 값 + 단위. decimals 자리로 반올림하고, 큰 수는 천 단위 콤마.
export function formatValue(value, { decimals = 1, unit = "" } = {}) {
  if (value == null || Number.isNaN(value)) return "—";
  const rounded = Number(value.toFixed(decimals));
  const withComma = rounded.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // "% of GDP" 같은 긴 단위는 앞에 공백, "%" 나 "$" 는 붙여 씀
  if (unit === "$") return `$${withComma}`;
  if (unit === "%" || unit === "") return `${withComma}${unit}`;
  return `${withComma} ${unit}`;
}

// 최근값 대비 직전값의 변화(delta)와 방향 화살표.
export function trend(series) {
  if (!series || series.length < 2) return { delta: null, arrow: "", dir: 0 };
  const last = series[series.length - 1].value;
  const prev = series[series.length - 2].value;
  const delta = last - prev;
  const dir = delta > 0 ? 1 : delta < 0 ? -1 : 0;
  const arrow = dir > 0 ? "▲" : dir < 0 ? "▼" : "▬";
  return { delta, arrow, dir };
}
