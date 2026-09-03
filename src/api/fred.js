// ─────────────────────────────────────────────────────────────
// FRED 데이터를 가져오는 "클라이언트 쪽" 도우미.
// 실제 FRED 호출은 서버 함수(프로젝트 루트의 api/fred.js)가 대신합니다.
// 이 파일은 그 서버 함수를 부르기만 합니다.
//
// ⚠️ 로컬 `npm run dev`(Vite)에는 /api 경로가 없습니다.
//    Vercel에 배포한 뒤, 또는 `vercel dev` 로 실행할 때 동작합니다.
//    (Phase 8에서 실제로 붙일 예정. MVP에는 사용하지 않습니다.)
// ─────────────────────────────────────────────────────────────

export async function fetchFredSeries(seriesId, start = "2015-01-01") {
  const res = await fetch(
    `/api/fred?series_id=${encodeURIComponent(seriesId)}&start=${start}`
  );
  if (!res.ok) throw new Error(`FRED 프록시 오류 (HTTP ${res.status})`);

  const json = await res.json();

  // FRED는 값이 없을 때 "." 문자열을 넣으므로 걸러냅니다.
  return json.observations
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: Number(o.value) }));
}
