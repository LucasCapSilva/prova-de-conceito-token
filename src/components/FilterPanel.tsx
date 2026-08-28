import type { CatalogState } from "../lib/catalog";
import { facetCounts } from "../lib/catalog";
import { BRANDS } from "../data/products";

const inputCls =
  "h-9 w-full rounded-[4px] border border-line bg-surface px-2.5 text-sm text-ink outline-none transition-colors focus:border-brand";

interface Props {
  value: CatalogState;
  onPatch: (patch: Partial<CatalogState>) => void;
  onClear: () => void;
  activeCount: number;
}

export default function FilterPanel({ value, onPatch, onClear, activeCount }: Props) {
  const counts = facetCounts(value);
  return (
    <aside className="card w-full p-4 lg:sticky lg:top-28 lg:h-fit">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black tracking-tight text-ink">Filtros</h2>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Limpar ({activeCount})
          </button>
        )}
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
            Faixa de preço
          </p>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              value={value.min}
              onChange={(e) =>
                onPatch({ min: e.target.value.replace(/\D/g, "") })
              }
              placeholder="Mín"
              aria-label="Preço mínimo"
              className={inputCls}
            />
            <span className="text-ink-soft">–</span>
            <input
              inputMode="numeric"
              value={value.max}
              onChange={(e) =>
                onPatch({ max: e.target.value.replace(/\D/g, "") })
              }
              placeholder="Máx"
              aria-label="Preço máximo"
              className={inputCls}
            />
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">
            {counts.total} produto{counts.total === 1 ? "" : "s"} nesta faixa
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
            Avaliação mínima
          </p>
          <select
            value={value.rating}
            onChange={(e) => onPatch({ rating: e.target.value })}
            aria-label="Avaliação mínima"
            className={inputCls}
          >
            <option value="">Qualquer</option>
            <option value="3">3★ e acima</option>
            <option value="4">4★ e acima</option>
            <option value="4.5">4.5★ e acima</option>
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
            Condição
          </p>
          <select
            value={value.condition}
            onChange={(e) =>
              onPatch({
                condition: e.target.value as CatalogState["condition"],
              })
            }
            aria-label="Condição"
            className={inputCls}
          >
            <option value="todos">Todas</option>
            <option value="novo">Novo</option>
            <option value="usado">Usado</option>
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
            Marca
          </p>
          <select
            value={value.brand}
            onChange={(e) => onPatch({ brand: e.target.value })}
            aria-label="Marca"
            className={inputCls}
          >
            <option value="">Todas</option>
            {BRANDS.map((b) => {
              const n = counts.brands[b] ?? 0;
              return (
                <option key={b} value={b} disabled={value.brand !== b && n === 0}>
                  {b} ({n})
                </option>
              );
            })}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={value.freeShip}
            onChange={(e) => onPatch({ freeShip: e.target.checked })}
            className="size-4 accent-brand"
          />
          <span className="font-medium text-ink">Frete grátis</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={value.official}
            onChange={(e) => onPatch({ official: e.target.checked })}
            className="size-4 accent-brand"
          />
          <span className="font-medium text-ink">Vendedor oficial</span>
        </label>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
            Parcelas
          </p>
          <select
            value={value.installments}
            onChange={(e) =>
              onPatch({
                installments: e.target.value as CatalogState["installments"],
              })
            }
            aria-label="Parcelas"
            className={inputCls}
          >
            <option value="">Qualquer</option>
            <option value="6">Até 6x sem juros</option>
            <option value="10">10x ou mais</option>
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={value.discountOnly}
            onChange={(e) => onPatch({ discountOnly: e.target.checked })}
            className="size-4 accent-brand"
          />
          <span className="font-medium text-ink">Somente com desconto</span>
        </label>
      </div>
    </aside>
  );
}
