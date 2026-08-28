import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, PRODUCTS, brandSlug } from "../data/products";
import { preloadPath } from "../lib/preload";

const COLS = CATEGORIES.filter((c) => c.key !== "todos").map((c) => {
  const brands = Array.from(
    new Set(PRODUCTS.filter((p) => p.category === c.key).map((p) => p.brand))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { key: c.key, label: c.label, brands };
});

export default function MegaMenu() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(t) &&
        btnRef.current && !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    const first = panelRef.current?.querySelector<HTMLAnchorElement>("a");
    first?.focus();
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const close = () => {
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>("a"));
    const idx = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "Home") {
      e.preventDefault();
      links[0]?.focus();
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      links[links.length - 1]?.focus();
      return;
    }
    if (idx === -1) return;
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight")
      next = (idx + 1) % links.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
      next = (idx - 1 + links.length) % links.length;
    if (next >= 0) {
      e.preventDefault();
      links[next].focus();
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        data-tour="categorias"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? "mega-categorias" : undefined}
        className="order-2 hidden h-11 items-center gap-2 rounded-[4px] bg-white/15 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/25 sm:flex"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className="shrink-0"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Categorias
      </button>
      {open && (
        <div
          id="mega-categorias"
          ref={panelRef}
          role="region"
          aria-label="Categorias e subcategorias"
          onKeyDown={onKey}
          className="absolute inset-x-0 top-full z-40 border-t border-line bg-surface shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
              {COLS.map((col) => (
                <div key={col.key}>
                  <Link
                    to={`/categoria/${col.key}`}
                    onMouseEnter={() => preloadPath(`/categoria/${col.key}`)}
                    onClick={() => setOpen(false)}
                    className="mb-1.5 block text-sm font-bold text-ink hover:text-brand"
                  >
                    {col.label}
                  </Link>
                  <ul className="space-y-1">
                    {col.brands.map((b) => (
                      <li key={b}>
                        <Link
                          to={`/marca/${brandSlug(b)}`}
                          onMouseEnter={() => preloadPath(`/marca/${brandSlug(b)}`)}
                          onClick={() => setOpen(false)}
                          className="text-xs text-ink-soft hover:text-brand hover:underline"
                        >
                          {b}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link
              to="/produtos"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              Ver todos os produtos <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
