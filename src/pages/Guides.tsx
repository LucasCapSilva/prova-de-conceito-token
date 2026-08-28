import { Link } from "react-router-dom";
import { GUIDES } from "../data/guides";
import { CATEGORIES, getProduct } from "../data/products";
import SmartImage from "../components/SmartImage";
import Breadcrumbs from "../components/Breadcrumbs";
import Reveal from "../components/Reveal";

export default function Guides() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:pt-28">
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Guias de compra" }]} />
      <Reveal>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Guias de compra</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Explicações diretas para você escolher bem: o que olhar, o que ignorar e
          por onde começar. Cada guia termina com os produtos que recomendamos.
        </p>
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {GUIDES.map((guide, i) => {
          const cover = getProduct(guide.productIds[0]);
          const cat = CATEGORIES.find((c) => c.key === guide.category);
          return (
            <Reveal key={guide.id} delay={i * 60}>
              <Link
                to={`/guias/${guide.slug}`}
                className="card group flex h-full flex-col gap-4 p-4 transition sm:flex-row"
              >
                <div className="h-40 w-full shrink-0 overflow-hidden rounded-[3px] sm:w-40">
                  <SmartImage
                    src={cover?.image ?? ""}
                    alt={cover?.name ?? guide.title}
                    eager={i === 0}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                    {cat?.label ?? "Guia"}
                  </span>
                  <h2 className="mt-1 text-lg font-bold leading-snug text-ink group-hover:text-brand">
                    {guide.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                    {guide.intro}
                  </p>
                  <span className="mt-auto pt-3 text-sm font-semibold text-brand">
                    Ler o guia →
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
