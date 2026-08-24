import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getProduct, PRODUCTS, type Product } from "../data/products";
import { getViewedProducts } from "../lib/recent";
import { useFavorites } from "../context/favoritesCore";
import ProductCard from "./ProductCard";

export default function PersonalizedPicks() {
  const { ids: favIds } = useFavorites();
  const viewed = useMemo(() => getViewedProducts(), []);
  const favs = useMemo(
    () =>
      favIds
        .map(getProduct)
        .filter((p): p is Product => Boolean(p)),
    [favIds]
  );

  const picks = useMemo(() => {
    const signals = [...viewed, ...favs];
    const seen = new Set(signals.map((p) => p.id));
    const cats: string[] = [];
    for (const p of signals) {
      if (!cats.includes(p.category)) cats.push(p.category);
    }
    if (cats.length === 0) return PRODUCTS.slice(8, 16);
    return PRODUCTS.filter(
      (p) => !seen.has(p.id) && cats.includes(p.category)
    ).slice(0, 8);
  }, [viewed, favs]);

  if (picks.length === 0) return null;

  const personal = viewed.length + favs.length > 0;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink sm:text-2xl">
          {personal ? "Para você" : "Destaques para você"}
        </h2>
        <Link
          to="/produtos"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Ver tudo →
        </Link>
      </div>
      {personal && (
        <p className="mt-1 text-xs text-ink-soft">
          Baseado nos produtos que você viu e favoritou.
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {picks.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i % 4} />
        ))}
      </div>
    </section>
  );
}
