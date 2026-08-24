import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import { getSeller } from "../data/sellers";
import { formatCompact } from "../lib/format";
import FollowButton from "./FollowButton";
import SmartImage from "./SmartImage";

export default function SellerBlock({ product }: { product: Product }) {
  const seller = getSeller(product.sellerId);
  if (!seller) return null;
  return (
    <div className="card mt-6 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <SmartImage
          src={seller.logo}
          alt={seller.name}
          className="size-12 shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-ink">{seller.name}</p>
            {seller.isOfficial && (
              <span className="shrink-0 rounded-sm bg-ship/15 px-1.5 py-0.5 text-[11px] font-semibold text-ship">
                Oficial
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft">
            <span className="text-star">★</span> {seller.rating.toFixed(1)} ·{" "}
            {formatCompact(seller.sales)} vendas · desde {seller.since}
          </p>
        </div>
        <FollowButton sellerId={seller.id} compact />
        <Link
          to={`/loja/${seller.id}`}
          className="shrink-0 text-sm font-semibold text-brand hover:underline"
        >
          Visitar loja
        </Link>
      </div>
    </div>
  );
}
