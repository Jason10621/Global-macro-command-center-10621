import { useEffect, useState } from "react";
import { fetchIndicatorSeries } from "../api/worldBank";

// ─────────────────────────────────────────────────────────────
// 커스텀 훅: "한 국가 + 한 지표"의 시계열을 불러옵니다.
//
// 컴포넌트에서 이렇게 씁니다:
//   const { status, data, error } = useSeries("KR", "FP.CPI.TOTL.ZG");
//
// countryCode나 indicatorId가 바뀌면 useEffect가 다시 실행되어
// 자동으로 새 데이터를 불러옵니다. ("조회하기" 버튼 없이도 반응)
// ─────────────────────────────────────────────────────────────
export function useSeries(countryCode, indicatorId) {
  // status: "loading" | "success" | "error"
  const [state, setState] = useState({ status: "loading", data: [], error: "" });

  useEffect(() => {
    // 입력이 빠르게 바뀔 때, 먼저 보낸 오래된 요청의 응답이 뒤늦게 도착해
    // 화면을 잘못 덮어쓰는 것을 막기 위한 플래그입니다.
    let cancelled = false;

    async function run() {
      setState({ status: "loading", data: [], error: "" });
      try {
        const data = await fetchIndicatorSeries(countryCode, indicatorId);
        if (cancelled) return;
        if (data.length === 0) {
          throw new Error("이 국가의 데이터가 비어 있습니다.");
        }
        setState({ status: "success", data, error: "" });
      } catch (err) {
        if (cancelled) return;
        console.error(err); // 개발자용 상세 로그
        setState({ status: "error", data: [], error: err.message });
      }
    }

    run();

    // useEffect가 다시 실행되기 직전(또는 컴포넌트가 사라질 때) 호출됩니다.
    return () => {
      cancelled = true;
    };
  }, [countryCode, indicatorId]);

  return state;
}
