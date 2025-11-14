import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.tsx";
import { Providers } from "@/app/providers";
import { initSentry } from "@/shared/lib/sentry";

import "./index.css";
import "highlight.js/styles/github.css";

// 初始化 Sentry（必须在应用启动前）
initSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
