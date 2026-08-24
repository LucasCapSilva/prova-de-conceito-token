import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CATEGORIES, type Category } from "../data/products";
import ProductCard from "./ProductCard";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import FilterPanel from "./FilterPanel";
import Pagination from "./Pagination";
import { ProductGridSkeleton } from "./Skeleton";
import { useSimulatedLoading } from "../lib/useLoading";
import {
  parseState,
  buildParams,
  filterProducts,
  countActiveFilters,
  SORT_OPTIONS,
  type CatalogState,
  type SortKey,
} from "../lib/catalog";

const PAGE_SIZE = 12;

interface Props {
  title: string;
  subtitle?: string;
  fixedCat?: Category;
  crumbs?: Crumb[];
}

export default function CatalogView({ title, subtitle, fixedCat, crumbs }: Props) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const state = useMemo<CatalogState>(() => {
    const s = parseState(params);
    if (fixedCat) s.cat = fixedCat;
    return s;
  }, [params, fixedCat]);

  const items = useMemo(() => filterProducts(state), [state]);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(state.page, pages);
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = countActiveFilters(state);
  const loading = useSimulatedLoading(500);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersBtnRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const triggerBtn = filtersBtnRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => drawerCloseRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      triggerBtn?.focus();
    };
  }, [filtersOpen]);

  const clearAll = () =>
    patch(
        {
          min: "",
          max: "",
          rating: "",
          condition: "todos",
          brand: "",
          freeShip: false,
          official: false,
        },
        false
      );

  const patch = (p: Partial<CatalogState>, replace = true) => {
    const next: CatalogState = { ...state, ...p, page: 1 };
    setParams(buildParams(next), { replace });
  };

  const goPage = (n: number) => {
    if (n < 1 || n > pages) return;
    setParams(buildParams({ ...state, page: n }));
    window.scrollTo({ top: 0 });
  };

  const goCat = (key: Category | "todos") => {
    if (fixedCat) {
      navigate(key === "todos" ? "/produtos" : `/categoria/${key}`);
    } else {
      patch({ cat: key }, false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        <p className="mt-2 text-xs text-ink-soft">
          <span className="font-bold text-ink">{items.length}</span> produto
          {items.length === 1 ? "" : "s"} encontrado{items.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
        <div className="hidden lg:block">
          <FilterPanel
            value={state}
            activeCount={activeCount}
            onPatch={(p) => patch(p)}
            onClear={clearAll}
          />
        </div>

        <div>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {CATEGORIES.map((c) => {
              const active = state.cat === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => goCat(c.key)}
                  className={`whitespace-nowrap rounded-[4px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-surface text-ink hover:border-brand hover:text-brand"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              ref={filtersBtnRef}
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
              aria-controls={filtersOpen ? "dialog-filtros" : undefined}
              className="flex items-center gap-1.5 rounded-[4px] border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink lg:hidden"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filtros
              {activeCount > 0 && (
                <span className="grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              Ordenar por
              <select
                value={state.sort}
                onChange={(e) =>
                  patch({ sort: e.target.value as SortKey }, false)
                }
                aria-label="Ordenar por"
                className="h-8 rounded-[4px] border border-line bg-surface px-2 text-xs font-semibold text-ink outline-none focus:border-brand"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : items.length === 0 ? (
            <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
              <span className="text-4xl">🔍</span>
              <p className="text-sm font-semibold text-ink">
                Nenhum produto encontrado
              </p>
              <p className="max-w-xs text-xs text-ink-soft">
                Tente ajustar os filtros ou buscar por outro termo.
              </p>
              <button
                onClick={() =>
                  patch(
                    {
                      q: "",
                      min: "",
                      max: "",
                      rating: "",
                      condition: "todos",
                      brand: "",
                      freeShip: false,
                      official: false,
                    },
                    false
                  )
                }
                className="text-xs font-semibold text-brand hover:underline"
              >
                Limpar tudo
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i % PAGE_SIZE} />
                ))}
              </div>
              <Pagination page={page} pages={pages} onChange={goPage} />
            </>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div
          id="dialog-filtros"
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
        >
          <button
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-base font-black tracking-tight text-ink">
                Filtros
              </h2>
              <button
                type="button"
                ref={drawerCloseRef}
                onClick={() => setFiltersOpen(false)}
                aria-label="Fechar"
                className="grid size-8 place-items-center text-ink-soft hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterPanel
                value={state}
                activeCount={activeCount}
                onPatch={(p) => patch(p)}
                onClear={clearAll}
              />
            </div>
            <div className="border-t border-line p-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="btn-brand w-full"
              >
                Ver {items.length} produto{items.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
