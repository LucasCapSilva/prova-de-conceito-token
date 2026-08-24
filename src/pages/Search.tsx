import { useSearchParams } from "react-router-dom";
import CatalogView from "../components/CatalogView";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  return (
    <CatalogView
      title={q ? `Resultados para "${q}"` : "Resultados da busca"}
      subtitle={
        q
          ? "Procuramos em nome, categoria e descrição."
          : undefined
      }
    />
  );
}
