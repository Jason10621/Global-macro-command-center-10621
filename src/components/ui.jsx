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

// 작은 체크박스형 토글. (예: "주요 사건 표시")
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-neutral-800"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-[5px] border transition
          ${checked ? "border-blue-500 bg-blue-500 text-white" : "border-neutral-300 bg-white"}`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

// 관심 등록용 별표 버튼. (채워짐 = 관심 국가)
export function StarButton({ active, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border shadow-sm transition
        ${active ? "border-amber-300 bg-amber-50 text-amber-500" : "border-neutral-200 bg-white text-neutral-300 hover:text-neutral-400"}`}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
        <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9 1 5.6L10 14.6 4.9 17.2l1-5.6-4-3.9 5.6-.8z" strokeLinejoin="round" />
      </svg>
    </button>
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
