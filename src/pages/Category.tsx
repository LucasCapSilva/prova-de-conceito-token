import { Link, useParams } from "react-router-dom";
import { CATEGORIES, type Category } from "../data/products";
import { guideForCategory } from "../data/guides";
import CatalogView from "../components/CatalogView";

const CATS = CATEGORIES.filter((c) => c.key !== "todos");

function GuideBanner({ category }: { category: Category }) {
  const guide = guideForCategory(category);
  if (!guide) return null;
  return (
    <div className="mx-auto mb-5 max-w-7xl px-4 sm:px-6">
      <Link
        to={`/guias/${guide.slug}`}
        className="card flex items-center gap-3 rounded-[4px] border-brand/30 bg-brand-soft px-4 py-3 transition hover:border-brand"
      >
        <span className="text-xl" aria-hidden>
          📖
        </span>
        <span className="flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-brand">
            Guia de compra
          </span>
          <span className="block text-sm font-semibold text-ink">
            {guide.title}
          </span>
        </span>
        <span className="text-sm font-semibold text-brand">Ler →</span>
      </Link>
    </div>
  );
}

export default function Category() {
  const { slug } = useParams();
  const match = CATS.find((c) => c.key === slug);
  if (match) {
    return (
      <>
        <GuideBanner category={match.key as Category} />
        <CatalogView
          title={match.label}
          fixedCat={match.key as Category}
          subtitle={`Todos os produtos da categoria ${match.label}.`}
          crumbs={[{ label: "Início", to: "/" }, { label: match.label }]}
        />
      </>
    );
  }
  return (
    <CatalogView
      title="Todos os produtos"
      crumbs={[{ label: "Início", to: "/" }, { label: "Produtos" }]}
    />
  );
}
