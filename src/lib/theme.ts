import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "electronica:theme";
const MEDIA = "(prefers-color-scheme: dark)";

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
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
      const next: Theme = t === "light" ? "dark" : "light";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* sem storage */
      }
      return next;
    });

  return [theme, toggle];
}
