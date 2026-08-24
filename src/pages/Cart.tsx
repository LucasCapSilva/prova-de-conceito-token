import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { formatBRL } from "../lib/format";
import { useCart, type CartItem } from "../context/cartCore";
import { useToasts } from "../context/toastsCore";
import ConfirmModal from "../components/ConfirmModal";
import { getSeller } from "../data/sellers";
import { getCoupon, getCouponForSeller } from "../data/coupons";
import type { CouponResult } from "../lib/totals";
import { quoteShipping, FREE_SHIPPING_THRESHOLD } from "../lib/shipping";
import { computeCoupon } from "../lib/totals";
import { describeSelection, maxQtyFor, unitPriceFor } from "../lib/variants";
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

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
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
        result: computeCoupon(getCouponForSeller(code, sid), sub, today),
      });
    }
    return out;
  }, [sellerCoupons, selectedItems, today]);
  const sellerDiscountTotal = sellerDiscounts.reduce(
    (acc, d) => acc + d.result.discount,
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
    const c = getCouponForSeller(code, sellerId);
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
    selectedSubtotal - couponDiscount - sellerDiscountTotal + shippingValue;

  // barra de frete grátis
  const allSelectedFree =
    selectedItems.length > 0 && selectedItems.every((i) => i.product.freeShipping);
  const shippingFreeNow =
    selectedSubtotal >= FREE_SHIPPING_THRESHOLD || allSelectedFree || couponFreeShip;
  const toFree = Math.max(0, FREE_SHIPPING_THRESHOLD - selectedSubtotal);
  const freeProgress = Math.min(1, selectedSubtotal / FREE_SHIPPING_THRESHOLD);

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
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto grid size-28 place-items-center rounded-full border border-line bg-surface text-5xl"
        >
          🛒
        </motion.div>
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
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-ink sm:text-4xl"
      >
        Seu carrinho
        <span className="ml-3 text-lg font-medium text-ink-soft">
          ({count} {count === 1 ? "item" : "itens"})
        </span>
      </motion.h1>

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

          <AnimatePresence initial={false}>
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
              return (
                <motion.section
                  key={seller.id}
                  layout
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

                  <ul className="divide-y divide-line">
                    {sellerItems.map((item) => {
                      const isSel = selected.includes(item.lineId);
                      const unit = unitPriceFor(item.product, item.variantKey);
                      const max = maxQtyFor(item.product, item.variantKey);
                      const vdesc = describeSelection(
                        item.product,
                        item.variantKey
                      );
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
                                <div className="mt-1 flex items-center gap-3">
                                  <button
                                    onClick={() => removeItem(item.lineId)}
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
                </motion.section>
              );
            })}
          </AnimatePresence>

          <button
            onClick={() => setConfirmClear(true)}
            className="text-sm text-ink-soft transition-colors hover:text-rose-500"
          >
            Esvaziar carrinho
          </button>

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
                    <motion.div
                      className="h-full rounded-full bg-brand"
                      animate={{ width: `${freeProgress * 100}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
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

            <motion.button
              whileHover={selectedCount > 0 ? { scale: 1.02 } : undefined}
              whileTap={selectedCount > 0 ? { scale: 0.97 } : undefined}
              disabled={selectedCount === 0}
              onClick={() => navigate("/checkout")}
              className="mt-6 w-full rounded-md bg-brand py-4 font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
            >
              {selectedCount > 0 ? "Finalizar compra" : "Selecione itens"}
            </motion.button>
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
