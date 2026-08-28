import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { PRODUCTS } from "../data/products";
import { getSeller } from "../data/sellers";
import { followerCount } from "../lib/follows";
import { formatCompact } from "../lib/format";
import { sellerReputation } from "../lib/sellerRatings";
import ProductCard from "../components/ProductCard";
import Breadcrumbs from "../components/Breadcrumbs";
import FollowButton from "../components/FollowButton";
import SmartImage from "../components/SmartImage";

export default function SellerStore() {
  const { id } = useParams();
  const seller = getSeller(id ?? "");
  const items = useMemo(
    () => (seller ? PRODUCTS.filter((p) => p.sellerId === seller.id) : []),
    [seller]
  );

  if (!seller) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-32 pb-12 text-center">
        <p className="text-2xl font-semibold text-ink">
          Loja não encontrada.
        </p>
        <Link to="/produtos" className="mt-4 inline-block text-brand hover:underline">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const avgRating = items.length
    ? items.reduce((acc, p) => acc + p.rating, 0) / items.length
    : seller.rating;
  const rep = sellerReputation(seller.id);
  const shownRating = rep ? (avgRating + rep.overall) / 2 : avgRating;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <Breadcrumbs
        items={[{ label: "Início", to: "/" }, { label: seller.name }]}
      />

      <header className="card rounded-lg p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SmartImage
            src={seller.logo}
            alt={seller.name}
            width={200}
            height={200}
            className="size-24 shrink-0 rounded-xl object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">{seller.name}</h1>
              {seller.isOfficial && (
                <span className="rounded-sm bg-ship/15 px-2 py-0.5 text-xs font-semibold text-ship">
                  Loja Oficial
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {seller.location} · no mercado desde {seller.since}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                <span className="text-star">★</span>{" "}
                <span className="font-semibold text-ink">
                  {shownRating.toFixed(1)}
                </span>{" "}
                <span className="text-ink-soft">reputação</span>
              </span>
              <span>
                <span className="font-semibold text-ink">
                  {formatCompact(seller.sales)}
                </span>{" "}
                <span className="text-ink-soft">vendas</span>
              </span>
              <span>
                <span className="font-semibold text-ink">
                  {items.length}
                </span>{" "}
                <span className="text-ink-soft">produtos</span>
              </span>
              <span>
                <span className="font-semibold text-ink">
                  {formatCompact(followerCount(seller.id))}
                </span>{" "}
                <span className="text-ink-soft">seguidores</span>
              </span>
            </div>
            {rep && (
              <p className="mt-2 text-xs text-ink-soft">
                Sua avaliação: atendimento {rep.service.toFixed(1)} · embalagem{" "}
                {rep.packaging.toFixed(1)} · prazo {rep.delivery.toFixed(1)}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <FollowButton sellerId={seller.id} />
          </div>
        </div>
      </header>

      <h2 className="mt-8 text-lg font-bold text-ink">
        Produtos da loja ({items.length})
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
