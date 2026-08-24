import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "../data/products";
import { useFavorites } from "../context/favoritesCore";
import { useCompare } from "../context/compareCore";
import SmartImage from "./SmartImage";
import Reveal from "./Reveal";
import Price from "./Price";

const soldLabel = (n: number) =>
  n >= 1000
    ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : `${n}`;

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { isFavorite, toggle } = useFavorites();
  const { isIn: isComparing, toggle: toggleCompare, count: compareCount } = useCompare();
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;
  const fav = isFavorite(product.id);
  const comparing = isComparing(product.id);
  const compareFull = compareCount >= 3 && !comparing;

  return (
    <Reveal delay={Math.min(index * 0.06, 0.4)}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="group card relative h-full overflow-hidden rounded-lg transition-shadow duration-300 hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.28)]"
      >
        <Link to={`/produto/${product.id}`} className="block">
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-ink-soft/10">
            <SmartImage
              src={product.image}
              alt={product.name}
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(product.id);
              }}
              aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-pressed={fav}
              className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-white/90 text-lg leading-none shadow-sm backdrop-blur transition hover:scale-110"
            >
              <span className={fav ? "text-brand" : "text-ink-soft/70"}>
                {fav ? "♥" : "♡"}
              </span>
            </button>
            {discount > 0 && (
              <span className="absolute right-0 top-10 rounded-bl-[4px] bg-tag px-2 py-1 text-[11px] font-bold text-brand">
                -{discount}%
              </span>
            )}
            {product.badge && (
              <span className="absolute left-0 top-0 rounded-br-[4px] bg-ink/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                {product.badge}
              </span>
            )}
          </div>

          <div className="p-2.5">
            <h3 className="line-clamp-2 text-sm leading-5 text-ink" title={product.name}>
              {product.name}
            </h3>

            <Price className="mt-2" price={product.price} oldPrice={product.oldPrice} />

            <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft">
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-400">★</span>
                <span>{product.rating.toFixed(1)}</span>
              </span>
              <span>{soldLabel(product.sold)} vendidos</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!compareFull) toggleCompare(product.id);
              }}
              aria-pressed={comparing}
              aria-label={
                comparing
                  ? "Remover da comparação"
                  : compareFull
                    ? "Máximo de 3 itens para comparar"
                    : "Adicionar à comparação"
              }
              className={
                "mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[6px] border py-1.5 text-xs font-semibold transition " +
                (comparing
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-surface text-ink-soft hover:border-brand hover:text-brand " +
                    (compareFull ? "cursor-not-allowed opacity-40" : ""))
              }
            >
              <span aria-hidden>{comparing ? "✓" : "⇄"}</span>
              {comparing ? "Selecionado" : "Comparar"}
            </button>
          </div>
        </Link>
      </motion.div>
    </Reveal>
  );
}
