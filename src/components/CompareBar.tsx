import { Link, useLocation } from "react-router-dom";
import { useCompare } from "../context/compareCore";
import { getProduct } from "../data/products";
import SmartImage from "./SmartImage";

export default function CompareBar() {
  const { ids, clear } = useCompare();
  const { pathname } = useLocation();

  if (ids.length === 0 || pathname === "/carrinho") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 shadow-[0_-6px_20px_-8px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center -space-x-2">
          {ids.map((id) => {
            const p = getProduct(id);
            return p ? (
              <span
                key={id}
                className="relative size-10 overflow-hidden rounded-md border border-line bg-surface"
              >
                <SmartImage src={p.image} alt={p.name} className="size-full object-cover" />
              </span>
            ) : null;
          })}
        </div>
        <span className="text-sm text-ink-soft">
          {ids.length} de 3 selecionados
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-[6px] border border-line px-3 py-2 text-sm font-semibold text-ink-soft transition hover:border-ink-soft hover:text-ink"
          >
            Limpar
          </button>
          <Link
            to="/comparar"
            className="rounded-[6px] bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Comparar ({ids.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
