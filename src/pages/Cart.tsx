import { Fragment, useMemo, useState, type ElementType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMotion } from "../lib/motion";
import { formatBRL } from "../lib/format";
import { useCart, priceChangeFor, type CartItem } from "../context/cartCore";
import { useToasts } from "../context/toastsCore";
import ConfirmModal from "../components/ConfirmModal";
import { getSeller } from "../data/sellers";
import { COUPONS, getCoupon } from "../data/coupons";
import { lookupSellerCoupon } from "../lib/sellerCoupons";
import type { Coupon } from "../data/coupons";
import type { CouponResult } from "../lib/totals";
import { quoteShipping } from "../lib/shipping";
import { freeShipThreshold } from "../lib/loyalty";
import { computeCoupon, suggestBestCoupon, kitDiscount, kitNext, KIT_TIER_1, KIT_TIER_2 } from "../lib/totals";
import { getCollected } from "../lib/couponBox";
import { describeSelection, maxQtyFor, unitPriceFor } from "../lib/variants";
import { bundleSet } from "../lib/bundles";
import { buildShareUrl, copyText } from "../lib/share";
import SmartImage from "../components/SmartImage";
import Reveal from "../components/Reveal";

function Check({
  checked,
  indeterminate,
  onToggle,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
  label: string;
}) {
  const active = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={onToggle}
      className={`grid size-5 shrink-0 place-items-center rounded border text-[11px] font-bold leading-none text-white transition-colors ${
        active ? "border-brand bg-brand" : "border-line bg-surface"
      }`}
    >
      {indeterminate ? "−" : checked ? "✓" : "\u00A0"}
    </button>
  );
}

export default function Cart() {
  const {
    items,
    saved,
    selected,
    couponCode,
    sellerCoupons,
    count,
    setQty,
    removeItem,
    clear,
    addItem,
    saveForLater,
    restoreFromSaved,
    removeSaved,
    setSelected,
    setCoupon,
    setSellerCoupon,
    toggleSelect,
  } = useCart();
  const navigate = useNavigate();
  const { toast } = useToasts();
  const m = useMotion();
  const EmptyBox: ElementType = m ? m.motion.div : "div";
  const Title: ElementType = m ? m.motion.h1 : "h1";
  const Section: ElementType = m ? m.motion.section : "section";
  const Bar: ElementType = m ? m.motion.div : "div";
  const CheckoutBtn: ElementType = m ? m.motion.button : "button";
  const Presence: ElementType = m ? m.AnimatePresence : Fragment;

  const [shareBusy, setShareBusy] = useState(false);
  async function shareCart() {
    if (selectedItems.length === 0 || shareBusy) return;
    setShareBusy(true);
    const entries = selectedItems.map((i) => ({ id: i.product.id, qty: i.qty }));
    const url = buildShareUrl(entries);
    const ok = await copyText(url);
    setShareBusy(false);
    if (ok) toast.success("Link do carrinho copiado.");
    else toast.error("Não foi possível copiar o link.");
  }
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [collected] = useState<string[]>(() => getCollected());
  const [sellerInputs, setSellerInputs] = useState<Record<string, string>>({});
  const [sellerErrors, setSellerErrors] = useState<Record<string, string>>({});
  const [cep, setCep] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const selectedItems = useMemo(
    () => items.filter((i) => selected.includes(i.lineId)),
    [items, selected]
  );
  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (acc, i) => acc + i.qty * unitPriceFor(i.product, i.variantKey),
        0
      ),
    [selectedItems]
  );
  const selectedCount = useMemo(
    () => selectedItems.reduce((acc, i) => acc + i.qty, 0),
    [selectedItems]
  );
  const priceChanges = useMemo(
    () =>
      selectedItems
        .map((i) => ({ lineId: i.lineId, change: priceChangeFor(i) }))
        .filter((x): x is { lineId: string; change: NonNullable<ReturnType<typeof priceChangeFor>> } => x.change !== null),
    [selectedItems]
  );

  const bundle = useMemo(() => {
    const anchorItem = selectedItems[0] ?? items[0];
    if (!anchorItem) return null;
    const set = bundleSet(anchorItem.product);
    if (!set) return null;
    const companions = set.companions.filter(
      (p) => !items.some((i) => i.product.id === p.id)
    );
    if (companions.length === 0) return null;
    const total =
      Math.round(
        (anchorItem.product.price +
          companions.reduce((acc, p) => acc + p.price, 0)) *
          100
      ) / 100;
    return {
      anchor: anchorItem.product,
      companions,
      total,
      count: 1 + companions.length,
    };
  }, [items, selectedItems]);

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, CartItem[]>();
    for (const it of items) {
      const sid = it.product.sellerId;
      if (!map.has(sid)) {
        map.set(sid, []);
        order.push(sid);
      }
      map.get(sid)!.push(it);
    }
    return order.map((sid) => ({
      seller: getSeller(sid)!,
      items: map.get(sid)!,
    }));
  }, [items]);

  // cupom
  const applied = couponCode ? getCoupon(couponCode) : undefined;
  const coupon = computeCoupon(applied, selectedSubtotal, today);
  const couponDiscount = coupon.discount;
  const couponMsg = coupon.label;
  const couponFreeShip = coupon.freeShip;

  function applyCoupon() {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Digite um código de cupom.");
      return;
    }
    const c = getCoupon(code);
    if (!c) {
      setCouponError("Cupom inválido.");
      return;
    }
    if (c.expiresAt < today) {
      setCouponError("Este cupom expirou.");
      return;
    }
    if (selectedSubtotal < c.minValue) {
      setCouponError(`Use em compras de ${formatBRL(c.minValue)} ou mais.`);
      return;
    }
    setCouponError(null);
    setCoupon(c.code);
  }

  const collectedCoupons = useMemo(
    () =>
      collected
        .map((id) => COUPONS.find((c) => c.id === id && !c.sellerId))
        .filter((c): c is Coupon => Boolean(c)),
    [collected]
  );
  const suggestion = useMemo(
    () => suggestBestCoupon(collectedCoupons, selectedSubtotal, today),
    [collectedCoupons, selectedSubtotal, today]
  );
  const showSuggestion =
    !!suggestion &&
    suggestion.coupon.code !== (couponCode ?? "").trim() &&
    (suggestion.result.discount > couponDiscount ||
      (suggestion.result.freeShip && !couponFreeShip));

  // cupons dos vendedores
  const sellerDiscounts = useMemo(() => {
    const out: {
      sellerId: string;
      code: string;
      result: CouponResult;
    }[] = [];
    for (const [sid, code] of Object.entries(sellerCoupons)) {
      const sub = selectedItems
        .filter((i) => i.product.sellerId === sid)
        .reduce(
          (acc, i) => acc + i.qty * unitPriceFor(i.product, i.variantKey),
          0
        );
      out.push({
        sellerId: sid,
        code,
        result: computeCoupon(lookupSellerCoupon(code, sid), sub, today),
      });
    }
    return out;
  }, [sellerCoupons, selectedItems, today]);
  const sellerDiscountTotal = sellerDiscounts.reduce(
    (acc, d) => acc + d.result.discount,
    0
  );

  // kits com desconto progressivo (por vendedor)
  const sellerKits = useMemo(() => {
    const out = new Map<string, { qty: number; sub: number }>();
    for (const i of selectedItems) {
      const sid = i.product.sellerId;
      const e = out.get(sid) ?? { qty: 0, sub: 0 };
      e.qty += i.qty;
      e.sub += i.qty * unitPriceFor(i.product, i.variantKey);
      out.set(sid, e);
    }
    return out;
  }, [selectedItems]);
  const kitDiscountTotal = Array.from(sellerKits.values()).reduce(
    (acc, { qty, sub }) => acc + kitDiscount(qty, sub),
    0
  );

  function applySellerCoupon(sellerId: string, sellerSubtotal: number) {
    const code = (sellerInputs[sellerId] ?? "").trim();
    const setErr = (msg: string | null) =>
      setSellerErrors((p) => ({ ...p, [sellerId]: msg ?? "" }));
    if (!code) {
      setErr("Digite um código de cupom.");
      return;
    }
    const c = lookupSellerCoupon(code, sellerId);
    if (!c) {
      setErr("Cupom inválido para este vendedor.");
      return;
    }
    if (c.expiresAt < today) {
      setErr("Este cupom expirou.");
      return;
    }
    if (sellerSubtotal < c.minValue) {
      setErr(`Use em compras de ${formatBRL(c.minValue)} ou mais.`);
      return;
    }
    setErr(null);
    setSellerCoupon(sellerId, c.code);
  }

  // frete
  const baseQuote = quoteShipping(
    cep,
    selectedItems.map((i) => i.product),
    selectedSubtotal
  );
  const effectiveQuote = baseQuote
    ? {
        ...baseQuote,
        free: baseQuote.free || couponFreeShip,
        value: couponFreeShip ? 0 : baseQuote.value,
      }
    : null;
  const shippingValue = effectiveQuote ? effectiveQuote.value : 0;
  const total =
    selectedSubtotal -
    couponDiscount -
    sellerDiscountTotal -
    kitDiscountTotal +
    shippingValue;

  // barra de frete grátis
  const allSelectedFree =
    selectedItems.length > 0 && selectedItems.every((i) => i.product.freeShipping);
  const shipAt = freeShipThreshold();
  const shippingFreeNow =
    selectedSubtotal >= shipAt || allSelectedFree || couponFreeShip;
  const toFree = Math.max(0, shipAt - selectedSubtotal);
  const freeProgress = Math.min(1, selectedSubtotal / shipAt);

  // seleção
  const allSelected =
    items.length > 0 && items.every((i) => selected.includes(i.lineId));
  const someSelected = selected.length > 0 && !allSelected;
  function toggleAll() {
    setSelected(allSelected ? [] : items.map((i) => i.lineId));
  }
  function toggleSeller(ids: string[], sellerAll: boolean) {
    const next = new Set(selected);
    if (sellerAll) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    setSelected(Array.from(next));
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-40 text-center sm:px-6">
        <EmptyBox
          {...(m
            ? {
                animate: { y: [0, -14, 0] },
                transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }
            : {})}
          className="mx-auto grid size-28 place-items-center rounded-full border border-line bg-surface text-5xl"
        >
          🛒
        </EmptyBox>
        <h1 className="mt-8 text-3xl font-bold text-ink sm:text-4xl">
          Seu carrinho está vazio
        </h1>
        <p className="mt-4 text-ink-soft">
          Que tal explorar nossos lançamentos e encontrar o próximo upgrade?
        </p>
        <button
          onClick={() => navigate("/produtos")}
          className="mt-8 rounded-md bg-brand px-8 py-4 font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Ver produtos
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-32 sm:px-6 sm:pt-28 lg:pb-10">
      <Title
        {...(m
          ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
          : {})}
        className="text-3xl font-bold text-ink sm:text-4xl"
      >
        Seu carrinho
        <span className="ml-3 text-lg font-medium text-ink-soft">
          ({count} {count === 1 ? "item" : "itens"})
        </span>
      </Title>

      {selectedItems.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={shareCart}
            disabled={shareBusy}
            className="rounded-[6px] border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {shareBusy
              ? "Copiando…"
              : "Compartilhar carrinho por link"}
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3">
            <Check
              checked={allSelected}
              indeterminate={someSelected}
              onToggle={toggleAll}
              label="Selecionar todos os itens"
            />
            <span className="text-sm font-semibold text-ink">
              Selecionar tudo
              {someSelected && (
                <span className="ml-2 font-normal text-ink-soft">
                  ({selectedCount} selecionado{selectedCount === 1 ? "" : "s"})
                </span>
              )}
            </span>
          </div>

          <Presence initial={false}>
            {groups.map(({ seller, items: sellerItems }) => {
              const sellerIds = sellerItems.map((i) => i.lineId);
              const sellerSelCount = sellerItems.filter((i) =>
                selected.includes(i.lineId)
              );
              const sellerAll =
                sellerItems.length > 0 &&
                sellerItems.every((i) => selected.includes(i.lineId));
              const sellerSome = sellerSelCount.length > 0 && !sellerAll;
              const sellerSubtotal = sellerSelCount.reduce(
                (acc, i) => acc + i.qty * unitPriceFor(i.product, i.variantKey),
                0
              );
              const sellerD = sellerDiscounts.find(
                (x) => x.sellerId === seller.id
              );
              const sellerQty = sellerSelCount.reduce(
                (acc, i) => acc + i.qty,
                0
              );
              const sellerKit = kitDiscount(sellerQty, sellerSubtotal);
              const kitNxt = kitNext(sellerQty);
              return (
                <Section
                  key={seller.id}
                  {...(m ? { layout: true } : {})}
                  className="overflow-hidden rounded-lg border border-line bg-surface"
                >
                  <div className="flex items-center gap-3 border-b border-line bg-page/40 px-4 py-3">
                    <Check
                      checked={sellerAll}
                      indeterminate={sellerSome}
                      onToggle={() => toggleSeller(sellerIds, sellerAll)}
                      label={`Selecionar todos os itens de ${seller.name}`}
                    />
                    <SmartImage
                      src={seller.logo}
                      alt={seller.name}
                      className="size-8 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">
                        {seller.name}
                        {seller.isOfficial && (
                          <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                            OFICIAL
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-soft">
                        ★ {seller.rating.toFixed(1)} · {seller.location}
                      </p>
                    </div>
                    <p className="ml-auto text-sm font-semibold text-ink">
                      {formatBRL(sellerSubtotal)}
                    </p>
                  </div>

                  <div className="border-b border-line bg-page/20 px-4 py-2.5">
                    {sellerD ? (
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs font-semibold ${
                            sellerD.result.ok
                              ? "text-ship"
                              : "text-amber-600"
                          }`}
                        >
                          {sellerD.result.ok
                            ? sellerD.result.label
                            : `Cupom ${sellerD.code} — ${sellerD.result.label}`}
                        </p>
                        <button
                          onClick={() => setSellerCoupon(seller.id, null)}
                          className="shrink-0 text-xs font-medium text-rose-500 transition-colors hover:text-rose-600"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={sellerInputs[seller.id] ?? ""}
                          onChange={(e) => {
                            setSellerInputs((p) => ({
                              ...p,
                              [seller.id]: e.target.value,
                            }));
                            setSellerErrors((p) => ({
                              ...p,
                              [seller.id]: "",
                            }));
                          }}
                          placeholder="Cupom do vendedor"
                          aria-label={`Cupom do vendedor ${seller.name}`}
                          className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink outline-none transition-colors focus:border-brand"
                        />
                        <button
                          onClick={() =>
                            applySellerCoupon(seller.id, sellerSubtotal)
                          }
                          className="shrink-0 rounded-md border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
                        >
                          Aplicar
                        </button>
                      </div>
                    )}
                    {sellerErrors[seller.id] ? (
                      <p className="mt-1 text-xs font-medium text-rose-500">
                        {sellerErrors[seller.id]}
                      </p>
                    ) : null}
                  </div>

                  <div className="border-b border-line bg-brand-soft/50 px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
                      <span
                        className={
                          sellerQty >= KIT_TIER_1.tier
                            ? "text-ship"
                            : "text-ink-soft"
                        }
                      >
                        Leve {KIT_TIER_1.tier}, ganhe {KIT_TIER_1.percent}%
                      </span>
                      <span className="text-ink-soft">·</span>
                      <span
                        className={
                          sellerQty >= KIT_TIER_2.tier
                            ? "text-ship"
                            : "text-ink-soft"
                        }
                      >
                        Leve {KIT_TIER_2.tier}, ganhe {KIT_TIER_2.percent}%
                      </span>
                      {sellerKit > 0 && (
                        <span className="text-ship">
                          −{formatBRL(sellerKit)}
                        </span>
                      )}
                      {kitNxt && (
                        <span className="text-ink-soft">
                          {kitNxt.missing === 1
                            ? "Falta 1 item"
                            : `Faltam ${kitNxt.missing} itens`}{" "}
                          para {kitNxt.percent}%
                        </span>
                      )}
                    </div>
                    {sellerQty > 0 && sellerQty < KIT_TIER_2.tier && (
                      <div
                        className="mt-1.5 h-1.5 rounded-full bg-brand/10"
                        role="progressbar"
                        aria-label={`Progresso do kit de ${seller.name}`}
                        aria-valuemin={0}
                        aria-valuemax={KIT_TIER_2.tier}
                        aria-valuenow={sellerQty}
                      >
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{
                            width: `${(sellerQty / KIT_TIER_2.tier) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <ul className="divide-y divide-line">
                    {sellerItems.map((item) => {
                      const isSel = selected.includes(item.lineId);
                      const unit = unitPriceFor(item.product, item.variantKey);
                      const max = maxQtyFor(item.product, item.variantKey);
                        const vdesc = describeSelection(
                          item.product,
                          item.variantKey
                        );
                        const change = priceChangeFor(item);
                        return (
                        <li
                          key={item.lineId}
                          className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${
                            isSel ? "" : "opacity-55"
                          }`}
                        >
                          <Check
                            checked={isSel}
                            onToggle={() => toggleSelect(item.lineId)}
                            label={`Selecionar ${item.product.name}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <SmartImage
                                src={item.product.image}
                                alt={item.product.name}
                                className="size-16 rounded-md object-cover"
                              />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-ink">
                                  {item.product.name}
                                </p>
                                {vdesc && (
                                  <p className="text-xs text-ink-soft">
                                    {vdesc}
                                  </p>
                                )}
                                <p className="text-sm text-ink-soft">
                                  {formatBRL(unit)} un.
                                </p>
                                {change && (
                                  <p
                                    className={`mt-1 rounded-md px-2 py-1 text-xs font-semibold ${
                                      change.delta > 0
                                        ? "bg-rose-50 text-rose-600"
                                        : "bg-ship/10 text-ship"
                                    }`}
                                  >
                                    Preço mudou: era {formatBRL(change.added)}, agora{" "}
                                    {formatBRL(change.current)}
                                  </p>
                                )}
                                <div className="mt-1 flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      removeItem(item.lineId);
                                      toast.info("Item removido do carrinho.");
                                    }}
                                    className="text-xs font-medium text-rose-500 transition-colors hover:text-rose-600"
                                  >
                                    Remover
                                  </button>
                                  <button
                                    onClick={() => {
                                      saveForLater(item.lineId);
                                      toast.info(
                                        "Item movido para Salvar para depois."
                                      );
                                    }}
                                    className="text-xs font-medium text-ink-soft transition-colors hover:text-brand"
                                  >
                                    Salvar para depois
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center rounded-md border border-line">
                              <button
                                onClick={() => setQty(item.lineId, item.qty - 1)}
                                className="grid size-9 place-items-center text-ink transition-colors hover:text-brand"
                                aria-label="Diminuir"
                              >
                                −
                              </button>
                              <span className="w-7 text-center font-bold text-ink">
                                {item.qty}
                              </span>
                              <button
                                onClick={() =>
                                  setQty(item.lineId, item.qty + 1)
                                }
                                className="grid size-9 place-items-center text-ink transition-colors hover:text-brand"
                                aria-label="Aumentar"
                              >
                                +
                              </button>
                            </div>
                            <p className="w-28 text-right font-bold text-ink">
                              {formatBRL(unit * item.qty)}
                            </p>
                          </div>
                          {item.qty >= max && (
                            <p className="text-xs text-ink-soft">
                              Máx. {max}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              );
            })}
          </Presence>

          <button
            onClick={() => setConfirmClear(true)}
            className="text-sm text-ink-soft transition-colors hover:text-rose-500"
          >
            Esvaziar carrinho
          </button>

          {bundle && (
            <section className="mt-6 rounded-lg border border-line bg-surface">
              <h2 className="border-b border-line px-4 py-3 text-sm font-bold text-ink">
                Comprados juntos com frequência
              </h2>
              <ul className="divide-y divide-line">
                {bundle.companions.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-4">
                    <Link to={`/produto/${p.id}`} className="shrink-0">
                      <SmartImage
                        src={p.image}
                        alt={p.name}
                        className="size-12 rounded-md object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/produto/${p.id}`}
                        className="block truncate text-sm font-semibold text-ink hover:text-brand"
                      >
                        {p.name}
                      </Link>
                      <p className="text-sm font-bold text-ink">
                        {formatBRL(p.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addItem(p, 1);
                        toast.success(`${p.name} adicionado ao carrinho.`);
                      }}
                      className="shrink-0 rounded-md border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
                    >
                      + Adicionar
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
                <p className="text-sm text-ink-soft">
                  Conjunto de {bundle.count} itens (incluindo{" "}
                  <Link
                    to={`/produto/${bundle.anchor.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {bundle.anchor.name}
                  </Link>
                  ) —{" "}
                  <span className="font-bold text-ink">
                    {formatBRL(bundle.total)}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    bundle.companions.forEach((p) => addItem(p, 1));
                    toast.success("Conjunto adicionado ao carrinho.");
                  }}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                  Adicionar conjunto
                </button>
              </div>
            </section>
          )}

          {saved.length > 0 && (
            <section className="mt-6 rounded-lg border border-line bg-surface">
              <h2 className="border-b border-line px-4 py-3 text-sm font-bold text-ink">
                Salvar para depois ({saved.length})
              </h2>
              <ul className="divide-y divide-line">
                {saved.map((item) => {
                  const vdesc = describeSelection(
                    item.product,
                    item.variantKey
                  );
                  const max = maxQtyFor(item.product, item.variantKey);
                  const out = max <= 0;
                  return (
                    <li
                      key={item.lineId}
                      className="flex items-center gap-3 p-4"
                    >
                      <SmartImage
                        src={item.product.image}
                        alt={item.product.name}
                        className="size-12 shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {item.product.name}
                        </p>
                        {vdesc && (
                          <p className="text-xs text-ink-soft">{vdesc}</p>
                        )}
                        <p className="text-sm font-bold text-ink">
                          {formatBRL(
                            unitPriceFor(item.product, item.variantKey) *
                              item.qty
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          onClick={() => {
                            restoreFromSaved(item.lineId);
                            toast.success("Item adicionado ao carrinho.");
                          }}
                          disabled={out}
                          className="rounded-md border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:border-line disabled:text-ink-soft"
                        >
                          {out ? "Sem estoque" : "Adicionar ao carrinho"}
                        </button>
                        <button
                          onClick={() => removeSaved(item.lineId)}
                          className="text-xs font-medium text-rose-500 transition-colors hover:text-rose-600"
                        >
                          Remover
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-6">
            <h2 className="text-xl font-bold text-ink">Resumo do pedido</h2>

            <div className="mt-5 rounded-md border border-line bg-page/40 p-3">
              {shippingFreeNow ? (
                <p className="text-sm font-semibold text-ship">
                  🎉 Você ganhou frete grátis!
                </p>
              ) : (
                <>
                  <p className="text-xs text-ink-soft">
                    Faltam{" "}
                    <span className="font-bold text-ink">
                      {formatBRL(toFree)}
                    </span>{" "}
                    para o frete grátis
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <Bar
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${freeProgress * 100}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-ink-soft">
                Cupom de desconto
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError(null);
                  }}
                  placeholder="Ex.: BEMVINDO10"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand"
                />
                <button
                  onClick={applyCoupon}
                  className="rounded-md border border-brand px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft"
                >
                  Aplicar
                </button>
              </div>
              {couponError ? (
                <p className="mt-1 text-xs font-medium text-rose-500">
                  {couponError}
                </p>
          ) : couponMsg ? (
            <p
              className={`mt-1 text-xs font-medium ${
                coupon.ok ? "text-ship" : "text-amber-600"
              }`}
            >
              {couponMsg}
              </p>
            ) : null}
              {showSuggestion && suggestion ? (
                <div className="mt-3 rounded-md border border-brand bg-brand-soft p-3">
                  <p className="text-xs text-ink">
                    Você tem um cupom coletado com mais desconto:{" "}
                    <span className="font-bold text-brand">
                      {suggestion.coupon.code}
                    </span>{" "}
                    {suggestion.result.discount > 0 ? (
                      <>— {formatBRL(suggestion.result.discount)} de desconto</>
                    ) : (
                      <>— frete grátis</>
                    )}
                    {applied ? (
                      <>
                        {" "}
                        em vez de{" "}
                        <span className="font-semibold">
                          {applied.code}
                        </span>
                        {couponDiscount > 0 ? (
                          <> ({formatBRL(couponDiscount)})</>
                        ) : null}
                        .
                      </>
                    ) : null}
                  </p>
                  <button
                    onClick={() => {
                      setCoupon(suggestion.coupon.code);
                      setCouponInput(suggestion.coupon.code);
                      setCouponError(null);
                    }}
                    className="mt-2 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
                  >
                    Aplicar {suggestion.coupon.code}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-ink-soft">
                Frete — CEP de entrega
              </label>
              <input
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand"
              />
              <p className="mt-1 text-xs text-ink-soft">
                {effectiveQuote
                  ? `Entrega em ${effectiveQuote.days} dia(s)`
                  : "Informe o CEP para calcular o prazo."}
              </p>
            </div>

            {priceChanges.length > 0 && (
              <p className="mt-4 rounded-md border border-line bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                O preço de {priceChanges.length}{" "}
                {priceChanges.length === 1 ? "item mudou" : "itens mudaram"} desde
                que você adicionou ao carrinho. O total já reflete o valor atual.
              </p>
            )}

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>
                  Subtotal ({selectedCount}{" "}
                  {selectedCount === 1 ? "item" : "itens"})
                </dt>
                <dd className="text-ink">{formatBRL(selectedSubtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>Desconto (cupons)</dt>
                <dd className="font-semibold text-ship">
                  −{formatBRL(couponDiscount + sellerDiscountTotal)}
                </dd>
              </div>
              {kitDiscountTotal > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <dt>Kits (leve mais, pague menos)</dt>
                  <dd className="font-semibold text-ship">
                    −{formatBRL(kitDiscountTotal)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <dt>Frete</dt>
                <dd
                  className={
                    effectiveQuote
                      ? effectiveQuote.free
                        ? "font-semibold text-ship"
                        : "text-ink"
                      : "text-ink-soft"
                  }
                >
                  {effectiveQuote
                    ? effectiveQuote.free
                      ? "Grátis"
                      : formatBRL(effectiveQuote.value)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-bold text-ink">
                <dt>Total</dt>
                <dd>
                  {formatBRL(
                    total
                  )}
                  {!effectiveQuote && <span className="ml-1 text-xs font-normal text-ink-soft">+ frete</span>}
                </dd>
              </div>
            </dl>

            <CheckoutBtn
              disabled={selectedCount === 0}
              onClick={() => navigate("/checkout")}
              className="btn-brand mt-6 w-full rounded-md py-4 font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
            >
              {selectedCount > 0 ? "Finalizar compra" : "Selecione itens"}
            </CheckoutBtn>
            <p className="mt-3 text-center text-xs text-ink-soft">
              Pagamento 100% seguro · Até 12x sem juros
            </p>
          </div>
        </Reveal>
      </div>

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-ink-soft">
                {selectedCount} {selectedCount === 1 ? "item" : "itens"}
              </p>
              <p className="truncate text-lg font-bold text-ink">
                {formatBRL(total)}
                {!effectiveQuote && (
                  <span className="ml-1 text-xs font-normal text-ink-soft">
                    + frete
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="btn-brand shrink-0 rounded-[6px] px-6 py-3 text-sm font-bold"
            >
              Finalizar compra
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmClear}
        title="Esvaziar carrinho"
        message="Todos os itens serão removidos do carrinho. Deseja continuar?"
        confirmLabel="Esvaziar"
        onConfirm={() => {
          clear();
          setConfirmClear(false);
          toast.info("Carrinho esvaziado.");
        }}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}
