import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LangProvider } from "./i18n";
import "./index.css";
import { applyAccent, storedAccent } from "./theme/accents";

// Before first paint, so nothing flashes the default tint.
applyAccent(storedAccent());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
);
