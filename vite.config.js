import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// ─────────────────────────────────────────────────────────────
// Vite 설정 파일.
//  - react()      : JSX 문법 변환 + 저장 시 즉시 반영(HMR)
//  - tailwindcss(): Tailwind CSS v4를 tailwind.config.js 없이 사용
//  - VitePWA()    : 서비스워커 + 웹 매니페스트 생성 → "설치형 앱 + 오프라인" 지원
//
// GitHub Pages는 https://<사용자>.github.io/<저장소이름>/ 하위 경로로 서비스되므로
// 빌드 시 자산 경로 앞에 붙일 base 를 저장소 이름으로 맞춰줘야 합니다.
// GitHub Actions 워크플로가 VITE_BASE 환경변수(예: "/global-macro-command-center/")를
// 자동으로 넣어 주고, 로컬 개발/Vercel 배포에서는 값이 없으므로 "/" 가 됩니다.
// (VitePWA 는 이 base 를 매니페스트 start_url·scope 와 SW 등록 경로에 자동 반영합니다.)
// ─────────────────────────────────────────────────────────────
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "data/imf-outlook.json"],
      manifest: {
        name: "Global Macro Command Center",
        short_name: "Macro Center",
        description: "국가 경제 리스크 모니터 — 거시지표·리스크 신호·경기 국면·IMF 전망",
        lang: "ko",
        theme_color: "#0071e3",
        background_color: "#fafafa",
        display: "standalone",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // 앱 셸(JS/CSS/HTML/폰트)은 미리 캐시 → 오프라인에서도 화면은 뜸
        globPatterns: ["**/*.{js,css,html,woff2}"],
        navigateFallback: "index.html",
        // 공개 데이터 API 응답은 "일단 캐시된 값을 보여주고 뒤에서 갱신"(SWR).
        // → 오프라인이거나 API가 느릴 때 마지막으로 본 데이터가 그대로 나옵니다.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://api.worldbank.org",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "worldbank-api",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://api.db.nomics.world",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "dbnomics-api",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://www.imf.org",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "imf-api",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
