import { useEffect, useState } from "react";
import { readRaw, writeRaw } from "./storage";

export type Theme = "light" | "dark" | "contrast";

const KEY = "theme";
const MEDIA = "(prefers-color-scheme: dark)";
const NEXT: Record<Theme, Theme> = {
  light: "dark",
  dark: "contrast",
  contrast: "light",
};

function stored(): Theme | null {
  const v = readRaw(KEY);
  return v === "light" || v === "dark" || v === "contrast" ? v : null;
}

function prefers(): Theme {
  try {
    return window.matchMedia(MEDIA).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
}

export function useTheme(): [Theme, () => void] {
  const [theme, setThemeState] = useState<Theme>(() => stored() ?? prefers());

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    try {
      const mq = window.matchMedia(MEDIA);
      const on = (e: MediaQueryListEvent) => {
        if (!stored()) setThemeState(e.matches ? "dark" : "light");
      };
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    } catch {
      return undefined;
    }
  }, []);

  const toggle = () =>
    setThemeState((t) => {
      const next = NEXT[t];
      writeRaw(KEY, next);
      return next;
    });

  return [theme, toggle];
}
