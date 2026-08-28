import { useState } from "react";
import { COUPONS, type Coupon } from "../data/coupons";
import { getSeller } from "../data/sellers";
import { collectCoupon, getCollected } from "../lib/couponBox";
import { listSellerCoupons, type SellerCouponDef } from "../lib/sellerCoupons";
import { formatBRL, formatDate } from "../lib/format";
import EmptyState from "../components/EmptyState";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function couponHeadline(c: Coupon): string {
  if (c.type === "percent") return `−${c.value}%`;
  if (c.type === "fixed") return `−${formatBRL(c.value)}`;
  return "Frete grátis";
}

function defToCoupon(d: SellerCouponDef): Coupon {
  return {
    id: d.id,
    code: d.code,
    description: d.description,
    type: d.type,
    value: d.value,
    minValue: d.minValue,
    expiresAt: d.expiresAt,
    sellerId: d.sellerId,
  };
}

const SELLER_COUPONS: Coupon[] = listSellerCoupons()
  .filter((c) => c.active && c.expiresAt >= todayISO())
  .map(defToCoupon);

function CouponCard({
  c,
  isCollected,
  onToggle,
}: {
  c: Coupon;
  isCollected: boolean;
  onToggle: (id: string) => void;
}) {
  const seller = c.sellerId ? getSeller(c.sellerId) : undefined;
  return (
    <li className="card rounded-md">
      <div className="flex items-stretch gap-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-brand">
              {couponHeadline(c)}
            </span>
            {seller && (
              <span className="rounded-[3px] border border-line px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
                Loja {seller.name}
              </span>
            )}
          </div>
          <p className="text-sm text-ink">{c.description}</p>
          <p className="text-xs text-ink-soft">
            {c.minValue > 0
              ? `Mínimo de ${formatBRL(c.minValue)}`
              : "Sem valor mínimo"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-[3px] bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
              ⏰ Expira em {formatDate(c.expiresAt)}
            </span>
            <span className="text-xs font-mono font-semibold tracking-wide text-ink-soft">
              {c.code}
            </span>
          </div>
        </div>
        <div className="flex items-center pr-4">
          <button
            type="button"
            onClick={() => onToggle(c.id)}
            disabled={isCollected}
            aria-label={
              isCollected
                ? `Cupom ${c.code} já coletado`
                : `Coletar cupom ${c.code}`
            }
            className={
              isCollected
                ? "cursor-default rounded-[6px] border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft"
                : "btn-brand rounded-[6px] px-3 py-1.5 text-xs font-bold"
            }
          >
            {isCollected ? "Coletado ✓" : "Coletar"}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function Coupons() {
  const [collected, setCollected] = useState<string[]>(() => getCollected());

  const toggle = (id: string) => {
    setCollected(collectCoupon(id));
  };

  const collectedCount = collected.length;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Central de Cupons</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Colete cupons e use-os no carrinho.
          {collectedCount > 0 && (
            <span className="font-semibold text-brand">
              {" "}
              Você já coletou {collectedCount}.
            </span>
          )}
        </p>
      </header>

      {COUPONS.length === 0 && SELLER_COUPONS.length === 0 ? (
        <EmptyState
          icon="ticket"
          title="Nenhum cupom disponível"
          message="Volte em breve para coletar cupons e ganhar descontos."
          cta={{ to: "/produtos", label: "Ver produtos" }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {COUPONS.map((c) => {
            const isCollected = collected.includes(c.id);
            return (
              <CouponCard
                key={c.id}
                c={c}
                isCollected={isCollected}
                onToggle={toggle}
              />
            );
          })}
        </ul>
      )}

      {SELLER_COUPONS.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 text-lg font-bold text-ink">
            Cupons das lojas
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {SELLER_COUPONS.map((c) => {
              const isCollected = collected.includes(c.id);
              return (
                <CouponCard
                  key={c.id}
                  c={c}
                  isCollected={isCollected}
                  onToggle={toggle}
                />
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
