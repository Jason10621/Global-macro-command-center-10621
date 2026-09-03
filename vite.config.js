import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// ─────────────────────────────────────────────────────────────
// Vite 설정 파일.
// 플러그인 두 개만 있으면 됩니다. (별도 설정 파일 불필요)
//  - react()      : JSX 문법 변환 + 저장 시 즉시 반영(HMR)
//  - tailwindcss(): Tailwind CSS v4를 tailwind.config.js 없이 사용
// ─────────────────────────────────────────────────────────────
// GitHub Pages는 https://<사용자>.github.io/<저장소이름>/ 하위 경로로 서비스되므로
// 빌드 시 자산 경로 앞에 붙일 base 를 저장소 이름으로 맞춰줘야 합니다.
// GitHub Actions 워크플로가 VITE_BASE 환경변수(예: "/global-macro-command-center/")를
// 자동으로 넣어 주고, 로컬 개발/Vercel 배포에서는 값이 없으므로 "/" 가 됩니다.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tailwindcss()],
});
