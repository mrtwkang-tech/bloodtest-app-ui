import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DICTS, LANGS } from "./dict";

const STORAGE_KEY = "lang";
const LangContext = createContext(null);

/** English is the base; the browser only overrides it if it asks for Korean. */
function initialLang() {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage?.getItem(STORAGE_KEY);
  if (saved && LANGS.includes(saved)) return saved;
  const nav = navigator.language || "";
  return nav.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage?.setItem(STORAGE_KEY, lang);
    } catch {
      /* private mode — the in-memory value still works for this session */
    }
  }, [lang]);

  const t = useCallback(
    (key, params) => {
      const entry = DICTS[lang]?.[key] ?? DICTS.en[key];
      if (entry === undefined) return key;
      return typeof entry === "function" ? entry(params ?? {}) : entry;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

/** Shorthand for the common case of only needing the translate function. */
export function useT() {
  return useLang().t;
}

/**
 * Korean sets tighter tracking than English at the same size — Hangul blocks
 * already carry their own internal spacing, so Latin-tuned letter-spacing
 * makes them look loose.
 */
export function trackingFor(lang, size) {
  if (lang === "ko") return size >= 28 ? "-0.02em" : "-0.005em";
  return size >= 28 ? "-0.03em" : size >= 17 ? "-0.015em" : "0";
}
