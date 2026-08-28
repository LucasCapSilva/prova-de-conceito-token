import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CATEGORIES, type Category } from "../data/products";
import ProductCard from "./ProductCard";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";
import FilterPanel from "./FilterPanel";
import Pagination from "./Pagination";
import VirtualGrid from "./VirtualGrid";
import { ProductGridSkeleton } from "./Skeleton";
import { useSimulatedLoading } from "../lib/useLoading";
import EmptyState from "./EmptyState";
import {
  parseState,
  buildParams,
  filterProducts,
  facetCounts,
  countActiveFilters,
  paginate,
  PAGE_SIZE,
  SORT_OPTIONS,
  type CatalogState,
  type SortKey,
} from "../lib/catalog";
import { formatBRL } from "../lib/format";
import { useToasts } from "../context/toastsCore";
import {
  getSavedFilters,
  saveFilter,
  removeSavedFilter,
  type SavedFilter,
} from "../lib/savedFilters";

interface Props {
  title: string;
  subtitle?: string;
  fixedCat?: Category;
  fixedBrand?: string;
  crumbs?: Crumb[];
}

export default function CatalogView({
  title,
  subtitle,
  fixedCat,
  fixedBrand,
  crumbs,
}: Props) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const state = useMemo<CatalogState>(() => {
    const s = parseState(params);
    if (fixedCat) s.cat = fixedCat;
    if (fixedBrand) s.brand = fixedBrand;
    return s;
  }, [params, fixedCat, fixedBrand]);

  const items = useMemo(() => filterProducts(state), [state]);
  const counts = useMemo(() => facetCounts(state), [state]);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(state.page, pages);
  const pageItems = paginate(items, page);
  const activeCount = countActiveFilters(state);
  const loading = useSimulatedLoading(500);
  const { toast } = useToasts();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() =>
    getSavedFilters(),
  );
  const [savingFilter, setSavingFilter] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [savedSel, setSavedSel] = useState("");
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

  const canSave = countActiveFilters(state) > 0 || state.q !== "";

  const applySaved = (id: string) => {
    const f = savedFilters.find((x) => x.id === id);
    setSavedSel(id);
    if (!f) return;
    patch({ ...f.state, page: 1 }, false);
  };

  const doSaveFilter = () => {
    const name = filterName.trim();
    if (!name) return;
    setSavedFilters(saveFilter(name, state));
    setFilterName("");
    setSavingFilter(false);
    toast.success(`Filtro "${name}" salvo`);
  };

  const doRemoveSaved = (id: string) => {
    setSavedFilters(removeSavedFilter(id));
    setSavedSel("");
    toast.info("Filtro salvo removido");
  };

  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (state.q)
    chips.push({
      key: "q",
      label: `Busca: "${state.q}"`,
      remove: () => patch({ q: "" }),
    });
  const catLabel = CATEGORIES.find((c) => c.key === state.cat)?.label;
  if (state.cat !== "todos" && catLabel)
    chips.push({
      key: "cat",
      label: catLabel,
      remove: () => patch({ cat: "todos" }),
    });
  if (state.min)
    chips.push({
      key: "min",
      label: `Mín. ${formatBRL(Number(state.min))}`,
      remove: () => patch({ min: "" }),
    });
  if (state.max)
    chips.push({
      key: "max",
      label: `Máx. ${formatBRL(Number(state.max))}`,
      remove: () => patch({ max: "" }),
    });
  if (state.rating)
    chips.push({
      key: "rating",
      label: `A partir de ${state.rating} estrelas`,
      remove: () => patch({ rating: "" }),
    });
  if (state.condition !== "todos")
    chips.push({
      key: "condition",
      label: state.condition === "novo" ? "Somente novos" : "Somente usados",
      remove: () => patch({ condition: "todos" }),
    });
  if (state.brand)
    chips.push({
      key: "brand",
      label: `Marca: ${state.brand}`,
      remove: () => patch({ brand: "" }),
    });
  if (state.freeShip)
    chips.push({
      key: "freeShip",
      label: "Frete grátis",
      remove: () => patch({ freeShip: false }),
    });
  if (state.official)
    chips.push({
      key: "official",
      label: "Vendedor oficial",
      remove: () => patch({ official: false }),
    });
  if (state.discountOnly)
    chips.push({
      key: "discount",
      label: "Somente com desconto",
      remove: () => patch({ discountOnly: false }),
    });
  if (state.installments)
    chips.push({
      key: "installments",
      label:
        state.installments === "6" ? "Até 6x sem juros" : "10x ou mais",
      remove: () => patch({ installments: "" }),
    });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        <p role="status" className="mt-2 text-xs text-ink-soft">
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
              const n = counts.cats[c.key] ?? 0;
              const disabled = !active && n === 0;
              return (
                <button
                  key={c.key}
                  onClick={() => goCat(c.key)}
                  disabled={disabled}
                  className={`whitespace-nowrap rounded-[4px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-brand bg-brand text-white"
                      : disabled
                        ? "cursor-not-allowed border-line bg-surface text-ink-soft/50"
                        : "border-line bg-surface text-ink hover:border-brand hover:text-brand"
                  }`}
                >
                  {c.label} ({n})
                </button>
              );
            })}
          </div>

          {chips.length > 0 && (
            <div
              className="mb-3 flex flex-wrap items-center gap-2"
              aria-label="Filtros ativos"
            >
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="flex items-center gap-1 rounded-[4px] border border-brand/40 bg-brand-soft px-2 py-1 text-xs font-semibold text-ink"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.remove}
                    aria-label={`Remover filtro ${chip.label}`}
                    className="text-brand hover:text-brand-dark"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Limpar tudo
              </button>
            </div>
          )}

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
            {savedFilters.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={savedSel}
                  onChange={(e) => applySaved(e.target.value)}
                  aria-label="Filtros salvos"
                  className="h-8 max-w-40 rounded-[4px] border border-line bg-surface px-2 text-xs font-semibold text-ink outline-none focus:border-brand"
                >
                  <option value="">Filtros salvos</option>
                  {savedFilters.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {savedSel && (
                  <button
                    type="button"
                    onClick={() => doRemoveSaved(savedSel)}
                    aria-label="Remover filtro salvo"
                    className="grid size-8 place-items-center rounded-[4px] border border-line bg-surface text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setSavingFilter((v) => !v)}
              disabled={!canSave}
              aria-expanded={savingFilter}
              className="h-8 rounded-[4px] border border-line bg-surface px-3 text-xs font-semibold text-ink hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:text-ink-soft/50"
            >
              Salvar filtros
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

          {savingFilter && (
            <div className="mb-4 flex items-center gap-2">
              <input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doSaveFilter();
                }}
                placeholder="Nome do filtro"
                aria-label="Nome do filtro"
                className="h-8 flex-1 rounded-[4px] border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={doSaveFilter}
                disabled={!filterName.trim()}
                className="btn-brand h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSavingFilter(false);
                  setFilterName("");
                }}
                className="text-xs font-semibold text-ink-soft hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : items.length === 0 ? (
            <div className="grid gap-2">
              <EmptyState
                icon="search"
                title="Nenhum produto encontrado"
                message="Tente ajustar os filtros ou buscar por outro termo."
                cta={{ to: "/produtos", label: "Ver catálogo" }}
              />
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
              <VirtualGrid
                items={pageItems}
                render={(p, i) => (
                  <ProductCard key={p.id} product={p} index={i % PAGE_SIZE} />
                )}
              />
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
