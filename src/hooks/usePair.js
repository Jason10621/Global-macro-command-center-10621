import { useEffect, useState } from "react";
import { fetchIndicatorPair } from "../api/worldBank";

// ─────────────────────────────────────────────────────────────
// 커스텀 훅: "한 국가 + 서로 다른 두 지표"를 연도 기준으로 합쳐서 불러옵니다.
// 산점도(Scatter) 화면에서 사용합니다.
//   const { status, data, error } = usePair("US", 실업률ID, 물가ID, 0);
//   data 예: [{ year: 2020, x: 8.1, y: 1.2 }, ...]
//
//   lag : 시차(년). x(t) 를 y(t+lag) 와 짝지어 선행/후행 관계를 봅니다. (기본 0)
// ─────────────────────────────────────────────────────────────
export function usePair(countryCode, indicatorXId, indicatorYId, lag = 0) {
  const [state, setState] = useState({ status: "loading", data: [], error: "" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState({ status: "loading", data: [], error: "" });
      try {
        const data = await fetchIndicatorPair(
          countryCode,
          indicatorXId,
          indicatorYId,
          2000,
          2025,
          lag
        );
        if (cancelled) return;
        if (data.length === 0) {
          throw new Error("두 지표가 겹치는 연도의 데이터가 없습니다.");
        }
        setState({ status: "success", data, error: "" });
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setState({ status: "error", data: [], error: err.message });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [countryCode, indicatorXId, indicatorYId, lag]);

  return state;
}
