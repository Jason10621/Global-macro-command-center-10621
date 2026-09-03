import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────
// 공통 커스텀 훅: "비동기 함수를 실행하고 로딩/성공/에러 상태를 관리"한다.
//
// useSeries / usePair 에서 반복되던 패턴
//   (로딩 표시 → try/catch → 오래된 응답 무시)
// 을 한곳으로 모은 것입니다. 새 데이터 소스를 붙일 때 이 훅을 재사용합니다.
//
//   const { status, data, error } = useAsync(() => fetchSomething(id), [id]);
//
//   status : "loading" | "success" | "error"
//   deps   : 이 값들이 바뀌면 자동으로 다시 실행 (useEffect 의존성 배열과 동일)
// ─────────────────────────────────────────────────────────────
// quiet = true 면 실패해도 콘솔에 빨간 에러를 찍지 않습니다.
// (예: IMF 전망은 로컬 개발 서버에서 원래 실패하므로 조용히 넘어가게 함)
export function useAsync(asyncFn, deps, initialData = null, quiet = false) {
  const [state, setState] = useState({
    status: "loading",
    data: initialData,
    error: "",
  });

  useEffect(() => {
    // 입력이 빠르게 바뀔 때, 먼저 보낸 오래된 요청의 응답이 뒤늦게 도착해
    // 화면을 잘못 덮어쓰는 것을 막기 위한 플래그입니다. (React 경쟁 상태 패턴)
    let cancelled = false;

    async function run() {
      setState({ status: "loading", data: initialData, error: "" });
      try {
        const data = await asyncFn();
        if (cancelled) return;
        setState({ status: "success", data, error: "" });
      } catch (err) {
        if (cancelled) return;
        if (!quiet) console.error(err); // 개발자용 상세 로그
        setState({ status: "error", data: initialData, error: err.message });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
