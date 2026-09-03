// ─────────────────────────────────────────────────────────────
// 앱 전체에서 재사용하는 작은 UI 조각들.
//
// 디자인 방향 (Apple 느낌):
//   - 흰 배경 + 아주 옅은 회색 톤
//   - 큰 둥근 모서리 (rounded-2xl ~ 3xl)
//   - 얇은 테두리 + 옅은 그림자 (shadow-sm)
//   - 넉넉한 여백, 포인트 색은 파란색 하나(#0071e3 ≈ blue-600)만 사용
// ─────────────────────────────────────────────────────────────

// 흰 카드. 모든 정보 블록의 기본 그릇입니다.
export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// 드롭다운(select). 브라우저 기본 화살표는 숨기고 직접 그려서 통일감을 줍니다.
export function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-neutral-500">{label}</span>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-2xl border border-neutral-200 bg-white
                     px-4 py-3 pr-10 text-[15px] shadow-sm transition
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </label>
  );
}

// iOS 설정 앱에 나오는 세그먼트 컨트롤(회색 배경 안에서 흰 알약이 이동).
export function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-2xl bg-neutral-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition
            ${
              value === o.value
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// 데이터를 불러오는 중에 보여주는 회전 스피너.
export function Spinner({ label = "불러오는 중…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-neutral-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// 요청이 실패했을 때 보여주는 빨간 안내 박스.
export function ErrorBox({ message }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
      데이터를 불러오지 못했습니다.
      {message && <span className="opacity-70"> ({message})</span>}
    </div>
  );
}
