import { useParams } from "react-router-dom";
import { CATEGORIES, type Category } from "../data/products";
import CatalogView from "../components/CatalogView";

const CATS = CATEGORIES.filter((c) => c.key !== "todos");

export default function Category() {
  const { slug } = useParams();
  const match = CATS.find((c) => c.key === slug);
  if (match) {
    return (
      <CatalogView
        title={match.label}
        fixedCat={match.key as Category}
        subtitle={`Todos os produtos da categoria ${match.label}.`}
        crumbs={[{ label: "Início", to: "/" }, { label: match.label }]}
      />
    );
  }
  return (
    <CatalogView
      title="Todos os produtos"
      crumbs={[{ label: "Início", to: "/" }, { label: "Produtos" }]}
    />
  );
}
