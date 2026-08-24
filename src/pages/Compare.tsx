import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCompare } from "../context/compareCore";
import { CATEGORIES, getProduct } from "../data/products";
import type { Product } from "../data/products";
import { formatBRL, formatInstallments } from "../lib/format";
import SmartImage from "../components/SmartImage";

const catLabel = (p: Product) =>
  CATEGORIES.find((c) => c.key === p.category)?.label ?? p.category;

const ROWS: { label: string; cell: (p: Product) => ReactNode }[] = [
  {
    label: "Preço",
    cell: (p) => (
      <div>
        <span className="text-base font-bold text-brand">
          {formatBRL(p.price)}
        </span>
        {p.oldPrice && (
          <span className="block text-xs text-ink-soft line-through">
            {formatBRL(p.oldPrice)}
          </span>
        )}
      </div>
    ),
  },
  {
    label: "Avaliação",
    cell: (p) => (
      <span className="inline-flex items-center gap-1">
        <span className="text-amber-400">★</span>
        <span className="font-semibold">{p.rating.toFixed(1)}</span>
        <span className="text-ink-soft">({p.reviews})</span>
      </span>
    ),
  },
  { label: "Vendidos", cell: (p) => p.sold.toLocaleString("pt-BR") },
  { label: "Categoria", cell: (p) => catLabel(p) },
  { label: "Condição", cell: (p) => (p.condition === "novo" ? "Novo" : "Usado") },
  {
    label: "Frete grátis",
    cell: (p) =>
      p.freeShipping ? (
        <span className="font-semibold text-ship">Sim</span>
      ) : (
        <span className="text-ink-soft">Não</span>
      ),
  },
  { label: "Parcelamento", cell: (p) => formatInstallments(p.installments) },
  {
    label: "Estoque",
    cell: (p) =>
      p.stock > 0 ? `Em estoque (${p.stock})` : "Esgotado",
  },
  {
    label: "Destaques",
    cell: (p) => (
      <ul className="list-inside list-disc space-y-1 text-xs text-ink-soft">
        {p.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    ),
  },
  {
    label: "Descrição",
    cell: (p) => (
      <p className="text-xs leading-relaxed text-ink-soft">{p.description}</p>
    ),
  },
];

export default function Compare() {
  const { ids, toggle, clear } = useCompare();
  const items = ids
    .map(getProduct)
    .filter((p): p is Product => Boolean(p));

  const minPrice = items.length
    ? Math.min(...items.map((p) => p.price))
    : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black text-ink sm:text-2xl">
          Comparar produtos
        </h1>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="rounded-[6px] border border-line px-3 py-2 text-sm font-semibold text-ink-soft transition hover:border-ink-soft hover:text-ink"
          >
            Limpar seleção
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card rounded-xl p-10 text-center">
          <p className="text-5xl" aria-hidden>
            ⇄
          </p>
          <h2 className="mt-3 text-lg font-bold text-ink">
            Nenhum produto para comparar
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            Selecione até 3 produtos no catálogo para compará-los lado a lado.
          </p>
          <Link
            to="/produtos"
            className="mt-4 inline-block rounded-[6px] bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>
                <th className="w-28 border-b border-line p-4 sm:w-40" />
                {items.map((p) => (
                  <th
                    key={p.id}
                    className="min-w-44 border-b border-l border-line p-4 align-top"
                  >
                    <div className="relative">
                      <div className="overflow-hidden rounded-lg border border-line bg-ink-soft/10">
                        <SmartImage
                          src={p.image}
                          alt={p.name}
                          className="aspect-square w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-label={`Remover ${p.name} da comparação`}
                        className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-sm text-ink-soft shadow-sm transition hover:scale-110 hover:text-brand"
                      >
                        ✕
                      </button>
                    </div>
                    <h3 className="mt-2 line-clamp-3 text-sm font-semibold text-ink">
                      {p.name}
                    </h3>
                    {p.price === minPrice && (
                      <span className="mt-1 inline-block rounded bg-ship/15 px-1.5 py-0.5 text-[11px] font-semibold text-ship">
                        Menor preço
                      </span>
                    )}
                    <Link
                      to={`/produto/${p.id}`}
                      className="mt-2 inline-block rounded-[6px] bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                    >
                      Comprar
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="border-b border-l-0 border-line bg-ink-soft/5 p-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft"
                  >
                    {row.label}
                  </th>
                  {items.map((p) => (
                    <td
                      key={p.id}
                      className="border-b border-l border-line p-4 text-sm text-ink align-top"
                    >
                      {row.cell(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
