import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../context/favoritesCore";
import { useCart } from "../context/cartCore";
import { getProduct } from "../data/products";
import ProductCard from "../components/ProductCard";

export default function Favorites() {
  const { ids, count } = useFavorites();
  const { addItem } = useCart();

  const items = useMemo(
    () =>
      ids
        .map((id) => getProduct(id))
        .filter((p): p is NonNullable<ReturnType<typeof getProduct>> =>
          Boolean(p)
        ),
    [ids]
  );

  const addAll = () => items.forEach((p) => addItem(p));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Meus favoritos
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {count === 0
              ? "Nenhum item salvo."
              : `Você tem ${count} produto${count === 1 ? "" : "s"} salvo${count === 1 ? "" : "s"}.`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={addAll}
            className="btn-brand rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            Adicionar todos ao carrinho
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
          <span className="text-4xl">💜</span>
          <p className="text-sm font-semibold text-ink">
            Você ainda não tem favoritos
          </p>
          <p className="max-w-xs text-xs text-ink-soft">
            Toque no coração de um produto para salvá-lo aqui e acompanhar.
          </p>
          <Link
            to="/produtos"
            className="btn-brand mt-1 rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            Explorar produtos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
