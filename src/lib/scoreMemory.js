// ─────────────────────────────────────────────────────────────
// "국가별 종합 리스크 스코어"를 브라우저(localStorage)에 기억해 둡니다.
// 다음에 그 나라를 다시 열었을 때 "지난 방문 대비 몇 점 변했는지"를 보여주기 위함.
//
//  ▷ 왜 localStorage인가?
//    이 앱은 백엔드/DB가 없습니다. "이 브라우저에서 마지막으로 본 값"만
//    기억하면 충분하고, 서버 없이 개인화를 줄 수 있는 가장 단순한 방법입니다.
//    (다른 기기와 공유되지 않고, 사생활 정보도 아닙니다.)
//
//  ▷ 안전하게
//    시크릿 창·저장소 차단 등에서 읽기/쓰기가 예외를 던질 수 있어 모두 try/catch.
//    값이 없으면 "처음 방문"으로 취급하고 조용히 넘어갑니다.
// ─────────────────────────────────────────────────────────────

const KEY = "gmcc:scoreMemory:v1";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 저장된 점수(숫자) 또는 null */
export function readScore(countryCode) {
  const all = readAll();
  const entry = all[countryCode];
  return entry && typeof entry.score === "number" ? entry.score : null;
}

/** 이번 방문의 점수를 저장합니다. (다음 방문에서 delta 계산용) */
export function writeScore(countryCode, score) {
  if (typeof score !== "number") return;
  try {
    const all = readAll();
    all[countryCode] = { score, at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* 저장 불가 환경 — 무시 */
  }
}
