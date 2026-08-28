import { Link, useParams } from "react-router-dom";
import { getGuide } from "../data/guides";
import { CATEGORIES, getProduct } from "../data/products";
import SmartImage from "../components/SmartImage";
import Breadcrumbs from "../components/Breadcrumbs";
import Reveal from "../components/Reveal";
import ProductCard from "../components/ProductCard";

export default function GuideDetail() {
  const { slug } = useParams();
  const guide = slug ? getGuide(slug) : undefined;

  if (!guide) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-16 sm:pt-28">
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="text-4xl" aria-hidden>
            📖
          </span>
          <h1 className="text-xl font-bold text-ink">Guia não encontrado</h1>
          <p className="text-sm text-ink-soft">
            O guia que você procura não existe ou mudou de endereço.
          </p>
          <Link
            to="/guias"
            className="mt-2 rounded-[4px] bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Ver todos os guias
          </Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORIES.find((c) => c.key === guide.category);
  const cover = getProduct(guide.productIds[0]);
  const related = guide.productIds
    .map((id) => getProduct(id))
    .filter((p) => p !== undefined);

  return (
    <article className="pt-32 pb-16 sm:pt-28">
      <div className="mx-auto max-w-3xl px-4">
        <Breadcrumbs
          items={[
            { label: "Início", to: "/" },
            { label: "Guias de compra", to: "/guias" },
            { label: guide.title },
          ]}
        />
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand">
            {cat?.label ?? "Guia"}
          </span>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {guide.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            {guide.intro}
          </p>
        </Reveal>
      </div>

      <div className="mx-auto mt-6 max-w-3xl px-4">
        <Reveal>
          <div className="overflow-hidden rounded-[3px]">
            <SmartImage
              src={cover?.image ?? ""}
              alt={cover?.name ?? guide.title}
              eager
              width={1200}
              height={675}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-8 max-w-3xl space-y-8 px-4">
        {guide.sections.map((section, i) => (
          <Reveal key={section.heading} delay={i * 40}>
            <section className="card p-5 sm:p-6">
              <h2 className="text-lg font-bold text-ink">{section.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {section.body}
              </p>
            </section>
          </Reveal>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-7xl px-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Você pode gostar</h2>
          <span className="shrink-0 text-xs text-ink-soft">
            {related.length} produtos
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {related.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </article>
  );
}
