import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────
// "관심 국가" 목록을 브라우저(localStorage)에 저장하는 훅.
//   const { codes, has, toggle } = useWatchlist();
//
// 백엔드 없이 개인화를 주는 가장 단순한 방법입니다. 이 브라우저에만 남고
// 다른 기기와 공유되지 않습니다. 저장소가 막힌 환경에서도 안전하게 동작합니다.
// ─────────────────────────────────────────────────────────────

const KEY = "gmcc:watchlist:v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [codes, setCodes] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(codes));
    } catch {
      /* 저장 불가 환경 — 무시 */
    }
  }, [codes]);

  const has = useCallback((code) => codes.includes(code), [codes]);

  const toggle = useCallback((code) => {
    setCodes((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));
  }, []);

  return { codes, has, toggle };
}
