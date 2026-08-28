import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const FIELD_SELECTOR = "input, textarea, select, [contenteditable='true']";

export default function RouteFocus() {
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    const active = document.activeElement;
    if (active instanceof Element && active.matches(FIELD_SELECTOR)) return;

    const main = document.getElementById("conteudo");
    if (!main) return;

    const focusTitle = () => {
      const h1 = main.querySelector("h1");
      if (!(h1 instanceof HTMLElement)) return false;
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
      return true;
    };

    if (focusTitle()) return;

    const observer = new MutationObserver(() => {
      if (focusTitle()) {
        observer.disconnect();
        window.clearTimeout(timer);
      }
    });
    const timer = window.setTimeout(() => observer.disconnect(), 5000);
    observer.observe(main, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  return null;
}
