import CatalogView from "../components/CatalogView";

export default function Products() {
  return (
    <CatalogView
      title="Todos os produtos"
      crumbs={[{ label: "Início", to: "/" }, { label: "Produtos" }]}
    />
  );
}
