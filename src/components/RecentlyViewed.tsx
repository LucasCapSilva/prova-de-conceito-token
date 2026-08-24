import { Link } from "react-router-dom";
import { getViewedProducts } from "../lib/recent";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";

interface Props {
  /** Esconde o produto da página atual (p/ não repeti-lo). */
  excludeId?: string;
  title?: string;
}

/** Faixa horizontal de produtos vistos recentemente (localStorage, máx. 8). */
export default function RecentlyViewed({ excludeId, title = "Vistos recentemente" }: Props) {
  const items = getViewedProducts(excludeId);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
          <Link to="/produtos" className="text-sm font-semibold text-brand hover:underline">
            Ver catálogo →
          </Link>
        </div>
      </Reveal>
      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {items.map((p, i) => (
          <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
            <ProductCard product={p} index={i % 4} />
          </div>
        ))}
      </div>
    </section>
  );
}
