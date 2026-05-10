import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { appLog } from "./utils/appLog";
import { installRendererErrorLogging } from "./utils/installRendererErrorLogging";

appLog("info", "Renderer", "src/main.tsx executing");

const rootElement = document.getElementById("root");
appLog("info", "Renderer", "#root element found", { found: !!rootElement });

void installRendererErrorLogging();

if (rootElement) {
  appLog("info", "Renderer", "Creating React root and rendering App...");
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  appLog("info", "Renderer", "React render call completed");
} else {
  appLog("error", "Renderer", "FATAL: #root element not found in DOM!");
}
