import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ─────────────────────────────────────────────────────────────
// 앱의 진입점(entry point).
// index.html의 <div id="root">를 찾아서 그 안에 <App />을 그립니다.
// React.StrictMode는 개발 중 실수를 잡아주는 도우미 래퍼입니다. (배포 결과에는 영향 없음)
// ─────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
