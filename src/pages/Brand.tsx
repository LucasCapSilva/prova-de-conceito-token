import { useParams } from "react-router-dom";
import { BRANDS, PRODUCTS, brandSlug } from "../data/products";
import CatalogView from "../components/CatalogView";

export default function Brand() {
  const { slug } = useParams();
  const brand = BRANDS.find((b) => brandSlug(b) === slug);
  if (brand) {
    const count = PRODUCTS.filter((p) => p.brand === brand).length;
    return (
      <CatalogView
        title={brand}
        fixedBrand={brand}
        subtitle={`${count} produtos da marca ${brand}.`}
        crumbs={[{ label: "Início", to: "/" }, { label: brand }]}
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
