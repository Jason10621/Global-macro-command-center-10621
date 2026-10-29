import { createContext, useContext, useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────
// "지금 화면이 보여 주는 국가 데이터"를 AI 도우미와 공유하는 작은 저장소.
// 화면(SingleCountryView)이 setPage 로 데이터를 올려 두면,
// 앱 전체에 떠 있는 AI 패널이 그걸 읽어 시스템 프롬프트를 만듭니다.
// (props 로 App → View 로 끌어올리는 것보다 결합이 느슨합니다.)
// ─────────────────────────────────────────────────────────────
const Ctx = createContext({ page: null, setPage: () => {} });

export function AiContextProvider({ children }) {
  const [page, setPage] = useState(null);
  const value = useMemo(() => ({ page, setPage }), [page]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAiContext() {
  return useContext(Ctx);
}
