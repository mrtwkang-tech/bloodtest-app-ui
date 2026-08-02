import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LangProvider } from "./i18n";
import { AuthProvider } from "./auth/AuthProvider";
import "./index.css";
import { applyAccent, storedAccent } from "./theme/accents";
import { hydratePanels } from "./data/panel";

// Before first paint, so nothing flashes the default tint.
applyAccent(storedAccent());
// Before first render, so an entered plate is already in the series by the
// time the first index is computed — otherwise the generated numbers paint
// and then jump.
hydratePanels();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
);
