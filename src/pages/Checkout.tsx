import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/cartCore";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import { getCoupon } from "../data/coupons";
import { lookupSellerCoupon } from "../lib/sellerCoupons";
import { findCep } from "../data/ceps";
import {
  cvvValid,
  expiryValid,
  luhnValid,
  maskCard,
  maskCEP,
  maskCPF,
  maskExpiry,
} from "../lib/masks";
import { quoteShippingOptions } from "../lib/shipping";
import { pickupForCep } from "../lib/pickup";
import {
  SCHEDULE_FEE,
  SCHEDULE_SLOTS,
  nextBusinessDays,
  slotLabel,
  type ScheduleSlot,
} from "../lib/schedule";
import { computeCoupon, computePixDiscount } from "../lib/totals";
import { createOrder, GIFT_WRAP_FEE, type Address } from "../lib/orders";
import { describeSelection, unitPriceFor } from "../lib/variants";
import { earnCoins, getCoins, spendCoins } from "../lib/coins";
import {
  availableCashback,
  creditCashback,
  applyCashback,
} from "../lib/cashback";
import { getCards } from "../lib/cards";
import { clearDraft, loadDraft, saveDraft } from "../lib/checkoutDraft";
import { formatBRL, formatDate } from "../lib/format";
import SmartImage from "../components/SmartImage";

const STEPS = ["Endereço", "Entrega", "Pagamento", "Revisão"] as const;
type StepId = 0 | 1 | 2 | 3;
type PayMethod = "pix" | "boleto" | "cartao";

const EMPTY_ADDRESS: Address = {
  name: "",
  cpf: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  city: "",
  state: "",
};

function FakeQR() {
  const n = 12;
  const cells: boolean[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) cells.push(((r * 31 + c * 17) % 7) < 3);
  return (
    <div
      className="grid gap-0.5 rounded-md border border-line bg-white p-2"
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {cells.map((on, i) => (
        <span key={`qr-${i}`} className={`aspect-square w-2 ${on ? "bg-ink" : ""}`} />
      ))}
    </div>
  );
}

function weekdayShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, selected, couponCode, sellerCoupons, clear } = useCart();
  const { user } = useAuth();

  const [draft] = useState(() => loadDraft());
  const [step, setStep] = useState<StepId>(draft ? draft.step : 0);
  const [address, setAddress] = useState<Address>(
    draft ? draft.address : EMPTY_ADDRESS
  );
  const [cepLoading, setCepLoading] = useState(false);
  const [addrTouched, setAddrTouched] = useState(false);
  const [shippingId, setShippingId] = useState<string | null>(
    draft ? draft.shippingId : null
  );
  const [pickupMode, setPickupMode] = useState(draft ? draft.pickup : false);
  const [payment, setPayment] = useState<PayMethod>(
    draft ? draft.payment : "pix"
  );
  const [installments, setInstallments] = useState(
    draft ? draft.installments : 1
  );
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitCardA, setSplitCardA] = useState("");
  const [splitCardB, setSplitCardB] = useState("");
  const [splitAmount, setSplitAmount] = useState(0);
  const [splitNA, setSplitNA] = useState(1);
  const [splitNB, setSplitNB] = useState(1);
  const [coinsUsed, setCoinsUsed] = useState(draft ? draft.coinsUsed : 0);
  const [cashbackUsed, setCashbackUsed] = useState(0);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMsg, setGiftMsg] = useState("");
  const [schedMode, setSchedMode] = useState(draft ? draft.scheduleMode : false);
  const [schedDate, setSchedDate] = useState(draft ? draft.scheduleDate : "");
  const [schedSlot, setSchedSlot] = useState<ScheduleSlot | "">(
    draft ? (draft.scheduleSlot as ScheduleSlot | "") : ""
  );
  const [resumed, setResumed] = useState(draft !== null);
  const savedCards = getCards();

  useEffect(() => {
    saveDraft({
      step,
      address,
      shippingId,
      pickup: pickupMode,
      payment,
      installments,
      coinsUsed,
      scheduleMode: schedMode,
      scheduleDate: schedDate,
      scheduleSlot: schedSlot,
      savedAt: Date.now(),
    });
  }, [
    step,
    address,
    shippingId,
    pickupMode,
    payment,
    installments,
    coinsUsed,
    schedMode,
    schedDate,
    schedSlot,
  ]);

  const today = new Date().toISOString().slice(0, 10);

  const selectedItems = useMemo(
    () => items.filter((i) => selected.includes(i.lineId)),
    [items, selected]
  );
  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, i) => sum + unitPriceFor(i.product, i.variantKey) * i.qty,
        0
      ),
    [selectedItems]
  );
  const coupon = computeCoupon(
    couponCode ? getCoupon(couponCode) : undefined,
    selectedSubtotal,
    today
  );
  const sellerDiscounts = useMemo(() => {
    const out: { code: string; discount: number }[] = [];
    for (const [sid, code] of Object.entries(sellerCoupons)) {
      const sub = selectedItems
        .filter((i) => i.product.sellerId === sid)
        .reduce(
          (sum, i) => sum + unitPriceFor(i.product, i.variantKey) * i.qty,
          0
        );
      out.push({
        code,
        discount: computeCoupon(lookupSellerCoupon(code, sid), sub, today)
          .discount,
      });
    }
    return out;
  }, [sellerCoupons, selectedItems, today]);
  const sellerDiscountTotal = sellerDiscounts.reduce(
    (acc, d) => acc + d.discount,
    0
  );

  function onCepChange(value: string) {
    const masked = maskCEP(value);
    setField("cep", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    window.setTimeout(() => {
      const entry = findCep(digits);
      setCepLoading(false);
      if (entry) {
        setAddress((a) =>
          a.cep.replace(/\D/g, "") === digits
            ? {
                ...a,
                street: entry.street,
                neighborhood: entry.neighborhood,
                city: entry.city,
                state: entry.state,
              }
            : a
        );
      }
    }, 600);
  }

  const shippingOptions = useMemo(
    () =>
      quoteShippingOptions(
        address.cep,
        selectedItems.map((i) => i.product),
        selectedSubtotal
      ),
    [address.cep, selectedItems, selectedSubtotal]
  );

  const activeShippingId = shippingId ?? shippingOptions?.[1]?.id ?? null;
  const selectedOption = activeShippingId
    ? shippingOptions?.find((o) => o.id === activeShippingId) ?? null
    : null;
  const pickupSelection = useMemo(
    () => (pickupMode ? pickupForCep(address.cep) : null),
    [pickupMode, address.cep]
  );
  const goods = Math.max(
    0,
    selectedSubtotal - coupon.discount - sellerDiscountTotal
  );
  const pixDiscount = payment === "pix" ? computePixDiscount(goods) : 0;
  const shippingValue = pickupSelection ? 0 : selectedOption?.value ?? 0;
  const deliveryDays = pickupSelection
    ? pickupSelection.readyInDays
    : selectedOption?.days ?? 3;

  function installmentInfo(n: number, base = goods) {
    const rate = n > 6 ? 0.0199 : 0;
    const financed = base * Math.pow(1 + rate, n);
    return { value: financed / n, total: financed, interestFree: rate === 0 };
  }
  function interestFor(amount: number, n: number) {
    return installmentInfo(n, amount).total - amount;
  }

  const coinBalance = getCoins();
  const giftFee = giftWrap ? GIFT_WRAP_FEE : 0;
  const schedDays = useMemo(() => nextBusinessDays(15), []);
  const schedIncomplete =
    !pickupMode && schedMode && (schedDate === "" || schedSlot === "");
  const scheduled = !pickupMode && schedDate !== "" && schedSlot !== "";
  const scheduleFee = scheduled ? SCHEDULE_FEE : 0;
  const splitBase = goods + shippingValue + giftFee + scheduleFee;
  const splitCents = Math.round(splitBase * 100);
  const splitAmountCents = Math.round(splitAmount * 100);
  const splitClampedCents = Math.min(
    Math.max(1, splitAmountCents),
    Math.max(1, splitCents - 1)
  );
  const splitCardAObj = savedCards.find((c) => c.id === splitCardA);
  const splitCardBObj = savedCards.find((c) => c.id === splitCardB);
  const splitAmountOk =
    splitAmountCents >= 1 && splitAmountCents <= splitCents - 1;
  const splitValid =
    Boolean(splitCardAObj) &&
    Boolean(splitCardBObj) &&
    splitCardAObj!.id !== splitCardBObj!.id &&
    splitAmountOk;
  const splitInterest =
    payment === "cartao" && splitMode
      ? interestFor(splitClampedCents / 100, splitNA) +
        interestFor((splitCents - splitClampedCents) / 100, splitNB)
      : 0;
  const cardInterest =
    payment === "cartao"
      ? splitMode
        ? splitInterest
        : installmentInfo(installments).total - goods
      : 0;
  const maxCoins = Math.min(
    coinBalance,
    Math.floor((goods - pixDiscount + shippingValue + cardInterest) * 0.05)
  );
  const coinsValue = Math.min(Math.max(0, Math.floor(coinsUsed)), maxCoins);
  const cashbackBalanceCents = availableCashback();
  const baseTotal =
    goods - pixDiscount + shippingValue + cardInterest - coinsValue + giftFee +
    scheduleFee;
  const maxCashbackCents = Math.min(
    cashbackBalanceCents,
    Math.floor(baseTotal * 100)
  );
  const cashbackValue = Math.min(
    Math.max(0, cashbackUsed),
    maxCashbackCents / 100
  );
  const splitCoveredCents =
    splitCents +
    Math.round(splitInterest * 100) -
    Math.round(coinsValue * 100) -
    Math.round(cashbackValue * 100);
  const total = baseTotal - cashbackValue;

  const addrErrors = useMemo(() => {
    const e: Record<string, boolean> = {};
    if (!address.name.trim()) e.name = true;
    if (!/^\d{5}(-?\d{3})?$/.test(address.cep.trim())) e.cep = true;
    if (!address.street.trim()) e.street = true;
    if (!address.number.trim()) e.number = true;
    if (!address.city.trim()) e.city = true;
    if (!address.state.trim()) e.state = true;
    return e;
  }, [address]);
  const addrValid = Object.keys(addrErrors).length === 0;

  const payErrors = useMemo(() => {
    if (payment !== "cartao")
      return { cardNumber: false, cardExpiry: false, cardCvv: false };
    return {
      cardNumber: savedCardId ? false : !luhnValid(cardNumber),
      cardExpiry: !expiryValid(cardExpiry),
      cardCvv: !cvvValid(cardCvv),
    };
  }, [payment, cardNumber, cardExpiry, cardCvv, savedCardId]);
  const payValid =
    payment !== "cartao" ||
    (splitMode ? splitValid : Object.values(payErrors).every((v) => !v));

  const paymentLabel =
    payment === "pix"
      ? "Pix"
      : payment === "boleto"
        ? "Boleto"
        : splitMode
          ? `Cartão dividido (${splitNA}x + ${splitNB}x)`
          : `Cartão (${installments}x)`;

  function toggleSplit(on: boolean) {
    if (on) {
      if (savedCards.length >= 2) {
        setSplitCardA(savedCards[0].id);
        setSplitCardB(savedCards[1].id);
      }
      setSplitAmount(Math.round((splitBase / 2) * 100) / 100);
      setSplitNA(1);
      setSplitNB(1);
    }
    setSplitMode(on);
  }
  function pickCardA(id: string) {
    if (id === splitCardB) setSplitCardB(splitCardA);
    setSplitCardA(id);
  }
  function pickCardB(id: string) {
    if (id === splitCardA) setSplitCardA(splitCardB);
    setSplitCardB(id);
  }

  function setField(k: keyof Address, v: string) {
    setAddress((a) => ({ ...a, [k]: v }));
  }
  function next() {
    if (step === 0 && !addrValid) {
      setAddrTouched(true);
      return;
    }
    if (step === 1 && !pickupSelection && !selectedOption) return;
    if (step === 1 && schedIncomplete) return;
    if (step === 2 && !payValid) return;
    setStep((s) => Math.min(3, s + 1) as StepId);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1) as StepId);
  }
  function confirm() {
    const order = createOrder({
      items: selectedItems.map((i) => {
        const vdesc = describeSelection(i.product, i.variantKey);
        return {
          id: i.product.id,
          name: vdesc ? `${i.product.name} (${vdesc})` : i.product.name,
          image: i.product.image,
          qty: i.qty,
          price: unitPriceFor(i.product, i.variantKey),
          seller: getSeller(i.product.sellerId)?.name ?? "Electronica Store",
          variantKey: i.variantKey,
        };
      }),
      subtotal: selectedSubtotal,
      discount: coupon.discount + sellerDiscountTotal + pixDiscount,
      shipping: shippingValue,
      total,
      payment: paymentLabel,
      ...(user?.id ? { accountId: user.id } : {}),
      address,
      pickup: pickupSelection ?? undefined,
      deliveryDays,
      schedule:
        !pickupMode && schedDate !== "" && schedSlot !== ""
          ? { date: schedDate, slot: schedSlot, fee: SCHEDULE_FEE }
          : undefined,
      gift: giftWrap
        ? { fee: GIFT_WRAP_FEE, message: giftMsg.trim() }
        : undefined,
    });
    if (coinsValue > 0) spendCoins(coinsValue);
    earnCoins(Math.floor(total));
    creditCashback(order);
    if (cashbackValue > 0)
      applyCashback(order.id, Math.round(cashbackValue * 100));
    setCashbackUsed(0);
    clearDraft();
    clear();
    navigate(`/pedido/${order.id}`);
  }

  if (selectedItems.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-ink">Nada para finalizar</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Não há itens selecionados para a compra.
        </p>
        <Link
          to="/carrinho"
          className="mt-6 inline-block rounded-md bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Voltar ao carrinho
        </Link>
      </section>
    );
  }

  const err = (k: string) => addrTouched && !!addrErrors[k];
  const inputCls = (k: string) =>
    `w-full rounded-md border px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
      err(k) ? "border-red-400 bg-red-50" : "border-line"
    }`;
  const payInputCls = (bad: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
      bad ? "border-red-400 bg-red-50" : "border-line"
    }`;
  const label = "mb-1 block text-xs font-bold text-ink-soft";
  const card = "card p-4";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-28 sm:pt-28 lg:pb-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black text-ink sm:text-2xl">
          Finalizar compra
        </h1>
        <Link to="/carrinho" className="text-sm font-medium text-ink-soft hover:text-brand">
          ← Carrinho
        </Link>
      </div>

      {resumed && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-ship/50 bg-ship/10 px-3 py-2 text-sm text-ink"
        >
          <span>
            Retomamos seu rascunho de checkout — você está na etapa{" "}
            <b className="font-black">{STEPS[step]}</b>.
          </span>
          <button
            type="button"
            onClick={() => setResumed(false)}
            className="text-xs font-bold text-ink-soft underline underline-offset-2 hover:text-brand"
          >
            Entendi
          </button>
        </div>
      )}

      {/* Etapas */}
      <ol className="mb-8 flex items-center gap-2 sm:gap-3">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition ${
                i < step
                  ? "bg-ship text-white"
                  : i === step
                    ? "bg-brand text-white"
                    : "bg-line text-ink-soft"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span
              className={`hidden text-sm font-bold sm:block ${
                i === step ? "text-brand" : "text-ink-soft"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="hidden h-px w-6 bg-line sm:block" />
            )}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className={card}>
          {step === 0 && (
            <div>
              <h2 className="mb-4 text-lg font-black text-ink">Endereço de entrega</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={label}>Nome completo</label>
                  <input className={inputCls("name")} value={address.name} onChange={(e) => setField("name", e.target.value)} placeholder="Maria da Silva" />
                </div>
                <div>
                  <label className={label}>CPF (opcional)</label>
                  <input className={inputCls("cpf")} value={address.cpf} onChange={(e) => setField("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className={label}>CEP</label>
                  <input className={inputCls("cep")} value={address.cep} onChange={(e) => onCepChange(e.target.value)} placeholder="00000-000" />
                  {cepLoading && (
                    <p className="mt-1 text-[11px] text-ink-soft">Buscando endereço...</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Rua / Avenida</label>
                  <input className={inputCls("street")} value={address.street} onChange={(e) => setField("street", e.target.value)} placeholder="Rua das Flores" />
                </div>
                <div>
                  <label className={label}>Número</label>
                  <input className={inputCls("number")} value={address.number} onChange={(e) => setField("number", e.target.value)} placeholder="123" />
                </div>
                <div>
                  <label className={label}>Complemento (opcional)</label>
                  <input className={inputCls("complement")} value={address.complement} onChange={(e) => setField("complement", e.target.value)} placeholder="Apto, bloco..." />
                </div>
                <div>
                  <label className={label}>Bairro</label>
                  <input className={inputCls("neighborhood")} value={address.neighborhood ?? ""} onChange={(e) => setField("neighborhood", e.target.value)} placeholder="Centro" />
                </div>
                <div>
                  <label className={label}>Cidade</label>
                  <input className={inputCls("city")} value={address.city} onChange={(e) => setField("city", e.target.value)} placeholder="São Paulo" />
                </div>
                <div>
                  <label className={label}>Estado (UF)</label>
                  <input className={inputCls("state")} value={address.state} onChange={(e) => setField("state", e.target.value.slice(0, 2).toUpperCase())} placeholder="SP" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-4 text-lg font-black text-ink">Forma de entrega</h2>
              <div className="mb-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Forma de entrega">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!pickupMode}
                  onClick={() => setPickupMode(false)}
                  className={`rounded-md border px-3 py-3 text-left transition ${
                    !pickupMode ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40"
                  }`}
                >
                  <span className="text-sm font-bold text-ink">Entrega em casa</span>
                  <p className="mt-1 text-xs text-ink-soft">
                    Enviamos para o endereço informado
                  </p>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={pickupMode}
                  onClick={() => setPickupMode(true)}
                  className={`rounded-md border px-3 py-3 text-left transition ${
                    pickupMode ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40"
                  }`}
                >
                  <span className="text-sm font-bold text-ink">
                    Retirada em ponto de coleta
                  </span>
                  <p className="mt-1 text-xs text-ink-soft">
                    Frete grátis · pronto em 1 a 3 dias
                  </p>
                </button>
              </div>
              {pickupMode ? (
                pickupSelection ? (
                  <div className="rounded-md border border-brand/40 bg-brand-soft p-3">
                    <p className="text-sm font-bold text-ink">
                      {pickupSelection.point.name}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {pickupSelection.point.street}, {pickupSelection.point.number} —{" "}
                      {pickupSelection.point.neighborhood},{" "}
                      {pickupSelection.point.city}/{pickupSelection.point.state} · CEP{" "}
                      {pickupSelection.point.cep}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Funcionamento: {pickupSelection.point.hours}
                    </p>
                    <p className="mt-2 text-xs font-bold text-ship">
                      Pronto para retirada em até {pickupSelection.readyInDays}{" "}
                      dia{pickupSelection.readyInDays !== 1 ? "s" : ""} · Frete grátis
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-ink-soft">
                    Preencha um CEP válido na etapa de endereço para escolher o ponto de coleta.
                  </p>
                )
              ) : shippingOptions ? (
                <div className="grid gap-2">
                  {shippingOptions.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setShippingId(o.id)}
                      aria-pressed={activeShippingId === o.id}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition ${
                        activeShippingId === o.id
                          ? "border-brand bg-brand-soft"
                          : "border-line hover:border-brand/40"
                      }`}
                    >
                      <span className="text-sm font-bold text-ink">{o.name}</span>
                      <span className="text-xs text-ink-soft">
                        chega em até {o.days} dia{o.days > 1 ? "s" : ""}
                      </span>
                      <span className="text-sm font-black text-brand">
                        {o.value > 0 ? formatBRL(o.value) : "Grátis"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">
                  Preencha um CEP válido na etapa de endereço para ver as opções de entrega.
                </p>
              )}
              {!pickupMode && (
                <div className="mt-4 rounded-md border border-line p-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={schedMode}
                      onChange={(e) => setSchedMode(e.target.checked)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="text-sm font-bold text-ink">
                      Agendar data e horário de entrega
                    </span>
                    <span className="text-xs text-ink-soft">
                      +{formatBRL(SCHEDULE_FEE)}
                    </span>
                  </label>
                  {schedMode && (
                    <div className="mt-3">
                      <p className={label}>Data (próximos 15 dias úteis)</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {schedDays.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSchedDate(d)}
                            aria-pressed={schedDate === d}
                            className={`rounded-md border px-1 py-2 text-center text-[11px] leading-tight transition ${
                              schedDate === d
                                ? "border-brand bg-brand-soft"
                                : "border-line hover:border-brand/40"
                            }`}
                          >
                            <span
                              className={`block font-bold ${
                                schedDate === d ? "text-brand" : "text-ink"
                              }`}
                            >
                              {d.slice(8, 10)}/{d.slice(5, 7)}
                            </span>
                            <span className="block text-ink-soft">
                              {weekdayShort(d)}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className={`${label} mt-3`}>Horário</p>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                        {SCHEDULE_SLOTS.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSchedSlot(s.id)}
                            aria-pressed={schedSlot === s.id}
                            className={`rounded-md border px-2 py-2 text-center text-xs font-bold transition ${
                              schedSlot === s.id
                                ? "border-brand bg-brand-soft text-brand"
                                : "border-line text-ink-soft hover:border-brand/40"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      {schedIncomplete && (
                        <p className="mt-2 text-xs text-ink-soft">
                          Escolha a data e o horário para continuar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 rounded-md border border-line p-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => setGiftWrap(e.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-sm font-bold text-ink">
                    Embrulhar como presente
                  </span>
                  <span className="text-xs text-ink-soft">
                    +{formatBRL(GIFT_WRAP_FEE)}
                  </span>
                </label>
                {giftWrap && (
                  <div className="mt-2">
                    <label className={label}>
                      Mensagem para o presente (opcional)
                    </label>
                    <textarea
                      value={giftMsg}
                      onChange={(e) => setGiftMsg(e.target.value)}
                      maxLength={120}
                      rows={2}
                      placeholder="Escreva a mensagem que vai no cartão"
                      className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-4 text-lg font-black text-ink">Pagamento</h2>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setPayment("pix")}
                  aria-pressed={payment === "pix"}
                  className={`w-full rounded-md border px-3 py-3 text-left transition ${
                    payment === "pix" ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40"
                  }`}
                >
                  <span className="flex items-center justify-between text-sm font-bold text-ink">
                    Pix
                    <span className="text-xs font-black text-ship">−5% no total</span>
                  </span>
                  {payment === "pix" && (
                    <div className="mt-3 flex items-center gap-3">
                      <FakeQR />
                      <p className="text-xs text-ink-soft">
                        QR Code gerado na conclusão do pedido. O desconto de 5% já está aplicado.
                      </p>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPayment("boleto")}
                  aria-pressed={payment === "boleto"}
                  className={`w-full rounded-md border px-3 py-3 text-left transition ${
                    payment === "boleto" ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40"
                  }`}
                >
                  <span className="text-sm font-bold text-ink">Boleto</span>
                  <p className="mt-1 text-xs text-ink-soft">Vencimento em 3 dias úteis.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPayment("cartao")}
                  aria-pressed={payment === "cartao"}
                  className={`w-full rounded-md border px-3 py-3 text-left transition ${
                    payment === "cartao" ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40"
                  }`}
                >
                  <span className="text-sm font-bold text-ink">Cartão de crédito</span>
                </button>
                  {payment === "cartao" && (
                    <div className="rounded-md border border-brand/40 bg-brand-soft px-3 py-3">
                      <div className="mb-3">
                        {savedCards.length >= 2 ? (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={splitMode}
                              onChange={(e) => toggleSplit(e.target.checked)}
                              className="h-4 w-4 accent-brand"
                            />
                            <span className="text-sm font-bold text-ink">
                              Dividir em dois cartões salvos
                            </span>
                          </label>
                        ) : (
                          <p className="text-xs text-ink-soft">
                            Para dividir o pagamento, salve pelo menos 2 cartões em{" "}
                            <Link
                              to="/cartoes"
                              className="font-bold text-brand hover:underline"
                            >
                              meus cartões
                            </Link>
                            .
                          </p>
                        )}
                      </div>
                      {splitMode ? (
                        <>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-md border border-line bg-white p-3">
                              <p className="mb-2 text-xs font-black uppercase tracking-wide text-ink-soft">
                                Cartão 1
                              </p>
                              <label className={label}>Usar cartão</label>
                              <select
                                value={splitCardA}
                                onChange={(e) => pickCardA(e.target.value)}
                                className={payInputCls(false)}
                                aria-label="Cartão usado para a primeira parte do pagamento"
                              >
                                {savedCards.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.brand} •••• {c.last4}
                                  </option>
                                ))}
                              </select>
                              <label className={`${label} mt-3`}>
                                Valor no cartão 1
                              </label>
                              <input
                                type="number"
                                min={0.01}
                                max={Math.max(0.01, splitCoveredCents / 100 - 0.01)}
                                step={0.01}
                                value={splitAmount}
                                onChange={(e) =>
                                  setSplitAmount(Number(e.target.value) || 0)
                                }
                                className={payInputCls(!splitAmountOk)}
                                aria-label="Valor cobrado no cartão 1"
                              />
                              <p className={`${label} mt-3`}>Parcelas do cartão 1</p>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[1, 2, 3, 4, 6, 10, 12].map((n) => {
                                  const info = installmentInfo(
                                    n,
                                    splitClampedCents / 100
                                  );
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => setSplitNA(n)}
                                      aria-pressed={splitNA === n}
                                      className={`rounded border px-2 py-1.5 text-left transition ${
                                        splitNA === n
                                          ? "border-brand bg-white"
                                          : "border-line bg-white hover:border-brand/40"
                                      }`}
                                    >
                                      <span className="block text-xs font-black text-ink">
                                        {n}x{" "}
                                        <span
                                          className={
                                            info.interestFree
                                              ? "text-ship"
                                              : "text-brand"
                                          }
                                        >
                                          {info.interestFree
                                            ? "sem juros"
                                            : "com juros"}
                                        </span>
                                      </span>
                                      <span className="block text-[11px] text-ink-soft">
                                        {formatBRL(info.value)}/mês
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="rounded-md border border-line bg-white p-3">
                              <p className="mb-2 text-xs font-black uppercase tracking-wide text-ink-soft">
                                Cartão 2
                              </p>
                              <label className={label}>Usar cartão</label>
                              <select
                                value={splitCardB}
                                onChange={(e) => pickCardB(e.target.value)}
                                className={payInputCls(false)}
                                aria-label="Cartão usado para a segunda parte do pagamento"
                              >
                                {savedCards.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.brand} •••• {c.last4}
                                  </option>
                                ))}
                              </select>
                              <label className={`${label} mt-3`}>
                                Valor no cartão 2
                              </label>
                              <p className="rounded-md border border-line bg-white px-3 py-2 text-sm font-bold text-ink">
                                {formatBRL(
                                  (splitCoveredCents - splitClampedCents) / 100
                                )}
                                <span className="ml-1 text-[11px] font-normal text-ink-soft">
                                  (paga a diferença)
                                </span>
                              </p>
                              <p className={`${label} mt-3`}>Parcelas do cartão 2</p>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[1, 2, 3, 4, 6, 10, 12].map((n) => {
                                  const info = installmentInfo(
                                    n,
                                    (splitCoveredCents - splitClampedCents) / 100
                                  );
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => setSplitNB(n)}
                                      aria-pressed={splitNB === n}
                                      className={`rounded border px-2 py-1.5 text-left transition ${
                                        splitNB === n
                                          ? "border-brand bg-white"
                                          : "border-line bg-white hover:border-brand/40"
                                      }`}
                                    >
                                      <span className="block text-xs font-black text-ink">
                                        {n}x{" "}
                                        <span
                                          className={
                                            info.interestFree
                                              ? "text-ship"
                                              : "text-brand"
                                          }
                                        >
                                          {info.interestFree
                                            ? "sem juros"
                                            : "com juros"}
                                        </span>
                                      </span>
                                      <span className="block text-[11px] text-ink-soft">
                                        {formatBRL(info.value)}/mês
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          {!splitAmountOk && (
                            <p className="mt-2 text-xs font-bold text-red-500">
                              O valor do cartão 1 deve ficar entre {formatBRL(0.01)} e{" "}
                              {formatBRL(Math.max(0.01, splitCoveredCents / 100 - 0.01))}{" "}
                              para que os dois cartões fechem exatamente{" "}
                              {formatBRL(splitCoveredCents / 100)}.
                            </p>
                          )}
                          {splitCardAObj && splitCardBObj && splitCardAObj.id === splitCardBObj.id && (
                            <p className="mt-2 text-xs font-bold text-red-500">
                              Escolha dois cartões diferentes.
                            </p>
                          )}
                          {splitValid && splitCardAObj && splitCardBObj && (
                            <p className="mt-2 text-xs font-bold text-ink">
                              {splitCardAObj.brand} •••• {splitCardAObj.last4} paga{" "}
                              {formatBRL(splitClampedCents / 100)} em {splitNA}x ·{" "}
                              {splitCardBObj.brand} •••• {splitCardBObj.last4} paga{" "}
                              {formatBRL(
                                (splitCoveredCents - splitClampedCents) / 100
                              )}{" "}
                              em {splitNB}x.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                      {savedCards.length > 0 && (
                        <div className="mb-3">
                          <p className="mb-2 text-xs font-bold text-ink-soft">
                            Cartões salvos
                          </p>
                          <div className="grid gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSavedCardId(null)}
                              aria-pressed={savedCardId === null}
                              className={`rounded border px-3 py-2 text-left text-sm font-bold transition ${
                                savedCardId === null
                                  ? "border-brand bg-white text-ink"
                                  : "border-line bg-white text-ink-soft hover:border-brand/40"
                              }`}
                            >
                              Usar outro cartão
                            </button>
                            {savedCards.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSavedCardId(c.id);
                                  setCardNumber(
                                    maskCard(`000000000000${c.last4}`)
                                  );
                                  setCardExpiry(c.expiry);
                                }}
                                aria-pressed={savedCardId === c.id}
                                className={`rounded border px-3 py-2 text-left text-sm font-bold transition ${
                                  savedCardId === c.id
                                    ? "border-brand bg-white text-ink"
                                    : "border-line bg-white text-ink-soft hover:border-brand/40"
                                }`}
                              >
                                {c.brand} •••• {c.last4}
                                <span className="block text-[11px] font-normal text-ink-soft">
                                  {c.holder} · Validade {c.expiry}
                                  {c.primary && " · Principal"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mb-3">
                      <label className={label}>Número do cartão</label>
                      <input
                        className={
                          payInputCls(!!payErrors.cardNumber && cardNumber.length > 0)
                        }
                        value={cardNumber}
                        onChange={(e) => {
                          setCardNumber(maskCard(e.target.value));
                          setSavedCardId(null);
                        }}
                        placeholder="0000 0000 0000 0000"
                      />
                      {cardNumber.length > 0 && payErrors.cardNumber && (
                        <p className="mt-1 text-xs font-bold text-red-500">
                          Número de cartão inválido.
                        </p>
                      )}
                    </div>
                    <div className="mb-3 grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className={label}>Validade</label>
                        <input
                          className={
                            payInputCls(!!payErrors.cardExpiry && cardExpiry.length > 0)
                          }
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(maskExpiry(e.target.value))}
                          placeholder="MM/AA"
                        />
                        {cardExpiry.length > 0 && payErrors.cardExpiry && (
                          <p className="mt-1 text-xs font-bold text-red-500">
                            Validade inválida ou vencida.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={label}>CVV</label>
                        <input
                          className={payInputCls(!!payErrors.cardCvv && cardCvv.length > 0)}
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                          }
                          placeholder="000"
                        />
                        {cardCvv.length > 0 && payErrors.cardCvv && (
                          <p className="mt-1 text-xs font-bold text-red-500">
                            O CVV deve ter 3 ou 4 dígitos.
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="mb-2 text-xs font-bold text-ink-soft">Parcelas</p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {[1, 2, 3, 4, 6, 10, 12].map((n) => {
                        const info = installmentInfo(n);
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setInstallments(n)}
                            aria-pressed={installments === n}
                            className={`rounded border px-2 py-1.5 text-left transition ${
                              installments === n
                                ? "border-brand bg-white"
                                : "border-line bg-white hover:border-brand/40"
                            }`}
                          >
                            <span className="block text-xs font-black text-ink">
                              {n}x{" "}
                              <span className={info.interestFree ? "text-ship" : "text-brand"}>
                                {info.interestFree ? "sem juros" : "com juros"}
                              </span>
                            </span>
                            <span className="block text-[11px] text-ink-soft">
                              {formatBRL(info.value)}/mês
                            </span>
                              <span className="block text-[11px] text-ink-soft">
                                total {formatBRL(info.total)}
                                {!info.interestFree && " · 1,99% a.m."}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                        </>
                      )}
                    </div>
                  )}
              </div>

              <div className="mt-3 rounded-md border border-line p-3">
                <label className={label}>Moedas de fidelidade</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={maxCoins}
                    value={coinsUsed}
                    onChange={(e) =>
                      setCoinsUsed(
                        Math.max(0, Math.floor(Number(e.target.value) || 0))
                      )
                    }
                    className="w-28 rounded-md border border-line px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    aria-label="Quantidade de moedas a usar"
                  />
                  <p className="text-xs text-ink-soft">
                    Você tem{" "}
                    <span className="font-bold text-ink">{coinBalance}</span>{" "}
                    moedas · limite de {maxCoins} (5% do total)
                  </p>
                </div>
                {coinsValue > 0 && (
                  <p className="mt-2 text-xs font-bold text-ship">
                    −{formatBRL(coinsValue)} com as moedas
                  </p>
                )}
              </div>

              <div className="mt-3 rounded-md border border-line p-3">
                <label className={label}>Cashback</label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={maxCashbackCents / 100}
                    step={0.01}
                    value={cashbackUsed}
                    onChange={(e) =>
                      setCashbackUsed(
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="w-28 rounded-md border border-line px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    aria-label="Valor do cashback a usar"
                  />
                  <p className="text-xs text-ink-soft">
                    Saldo disponível:{" "}
                    <span className="font-bold text-ink">
                      {formatBRL(cashbackBalanceCents / 100)}
                    </span>{" "}
                    · limite {formatBRL(maxCashbackCents / 100)}
                  </p>
                </div>
                {cashbackValue > 0 && (
                  <p className="mt-2 text-xs font-bold text-ship">
                    −{formatBRL(cashbackValue)} com o cashback
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-4 text-lg font-black text-ink">Revisão</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {pickupSelection ? (
                  <div className="rounded-md border border-line p-3 sm:col-span-2">
                    <p className="mb-1 text-xs font-black uppercase tracking-wide text-ink-soft">
                      Ponto de coleta
                    </p>
                    <p className="text-sm text-ink">
                      {pickupSelection.point.name} — {pickupSelection.point.street},{" "}
                      {pickupSelection.point.number}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {pickupSelection.point.neighborhood},{" "}
                      {pickupSelection.point.city}/{pickupSelection.point.state} — CEP{" "}
                      {pickupSelection.point.cep}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Funcionamento: {pickupSelection.point.hours}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-line p-3">
                    <p className="mb-1 text-xs font-black uppercase tracking-wide text-ink-soft">Endereço</p>
                    <p className="text-sm text-ink">
                      {address.name} — {address.street}, {address.number}
                      {address.complement ? `, ${address.complement}` : ""}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {address.neighborhood ? `${address.neighborhood}, ` : ""}
                      {address.city}/{address.state} — CEP {address.cep}
                    </p>
                  </div>
                )}
                <div className="rounded-md border border-line p-3">
                  <p className="mb-1 text-xs font-black uppercase tracking-wide text-ink-soft">Entrega</p>
                  {pickupSelection ? (
                    <>
                      <p className="text-sm text-ink">Retirada em ponto de coleta</p>
                      <p className="text-xs text-ink-soft">
                        pronto em até {pickupSelection.readyInDays}{" "}
                        dia{pickupSelection.readyInDays !== 1 ? "s" : ""} · Grátis
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-ink">{selectedOption?.name ?? "—"}</p>
                      <p className="text-xs text-ink-soft">
                        até {selectedOption?.days} dia{selectedOption?.days !== 1 ? "s" : ""} ·{" "}
                        {selectedOption && selectedOption.value > 0 ? formatBRL(selectedOption.value) : "Grátis"}
                      </p>
                      {scheduled && (
                        <p className="mt-1 text-xs font-bold text-brand">
                          Agendada para {formatDate(schedDate)} · {slotLabel(schedSlot)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              {giftWrap && (
                <div className="mt-3 rounded-md border border-line p-3">
                  <p className="mb-1 text-xs font-black uppercase tracking-wide text-ink-soft">
                    Presente
                  </p>
                  <p className="text-sm text-ink">
                    Embrulho para presente
                    {giftMsg.trim()
                      ? ` — “${giftMsg.trim()}”`
                      : ""}
                  </p>
                </div>
              )}
              <p className="mt-3 text-sm font-bold text-ink">
                Pagamento: <span className="text-brand">{paymentLabel}</span>
              </p>
              {payment === "cartao" && splitMode && splitCardAObj && splitCardBObj && (
                <div className="mt-2 rounded-md border border-line p-3">
                  <p className="text-xs text-ink-soft">
                    <span className="font-bold text-ink">
                      {splitCardAObj.brand} •••• {splitCardAObj.last4}
                    </span>{" "}
                    — {formatBRL(splitClampedCents / 100)} em {splitNA}x
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    <span className="font-bold text-ink">
                      {splitCardBObj.brand} •••• {splitCardBObj.last4}
                    </span>{" "}
                    —{" "}
                    {formatBRL(
                      (splitCoveredCents - splitClampedCents) / 100
                    )}{" "}
                    em {splitNB}x
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="rounded-md border border-line px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-brand/40 disabled:opacity-40"
            >
              ← Voltar
            </button>
            {step < 3 ? (
              <button
                onClick={next}
                disabled={
                  (step === 0 && !addrValid) ||
                    (step === 1 && ((!pickupSelection && !selectedOption) || schedIncomplete)) ||
                  (step === 2 && !payValid)
                }
                className="hidden rounded-md bg-brand px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-40 lg:block"
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={confirm}
                className="hidden rounded-md bg-brand px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-dark lg:block"
              >
                Confirmar pedido
              </button>
            )}
          </div>
        </div>

        {/* Resumo */}
        <aside className={card + " h-fit lg:sticky lg:top-28"}>
          <h2 className="mb-3 text-sm font-black text-ink">Resumo da compra</h2>
          <ul className="mb-3 max-h-44 space-y-2 overflow-y-auto pr-1">
            {selectedItems.map((i) => {
              const unit = unitPriceFor(i.product, i.variantKey);
              const vdesc = describeSelection(i.product, i.variantKey);
              return (
                <li key={i.lineId} className="flex items-center gap-2">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-line">
                    <SmartImage src={i.product.image} alt="" className="h-10 w-10 object-cover" />
                  </span>
                  <span className="flex-1 truncate text-xs text-ink-soft">
                    {i.product.name}
                    {vdesc && <span className="block text-[11px]">{vdesc}</span>}{" "}
                    <span className="text-ink">×{i.qty}</span>
                  </span>
                  <span className="text-xs font-bold text-ink">
                    {formatBRL(unit * i.qty)}
                  </span>
                </li>
              );
            })}
          </ul>
          <dl className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="text-ink">{formatBRL(selectedSubtotal)}</dd>
            </div>
            {coupon.discount > 0 && (
              <div className="flex justify-between text-ship">
                <dt>Cupom</dt>
                <dd className="font-bold">−{formatBRL(coupon.discount)}</dd>
              </div>
            )}
            {sellerDiscountTotal > 0 && (
              <div className="flex justify-between text-ship">
                <dt>Cupons dos vendedores</dt>
                <dd className="font-bold">−{formatBRL(sellerDiscountTotal)}</dd>
              </div>
            )}
            {pixDiscount > 0 && (
              <div className="flex justify-between text-ship">
                <dt>Desconto Pix (5%)</dt>
                <dd className="font-bold">−{formatBRL(pixDiscount)}</dd>
              </div>
            )}
            {coinsValue > 0 && (
              <div className="flex justify-between text-ship">
                <dt>Moedas ({coinsValue})</dt>
                <dd className="font-bold">−{formatBRL(coinsValue)}</dd>
              </div>
            )}
            {cashbackValue > 0 && (
              <div className="flex justify-between text-ship">
                <dt>Cashback</dt>
                <dd className="font-bold">−{formatBRL(cashbackValue)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                {pickupSelection ? "Frete (retirada)" : "Frete"}
              </dt>
              <dd className="text-ink">
                {pickupSelection || selectedOption
                  ? shippingValue > 0
                    ? formatBRL(shippingValue)
                    : "Grátis"
                  : "—"}
              </dd>
            </div>
            {giftWrap && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Embrulho presente</dt>
                <dd className="text-ink">+{formatBRL(GIFT_WRAP_FEE)}</dd>
              </div>
            )}
            {cardInterest > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">
                  Juros do cartão (
                  {splitMode ? `${splitNA}x + ${splitNB}x` : `${installments}x`}
                  )
                </dt>
                <dd className="text-ink">+{formatBRL(cardInterest)}</dd>
              </div>
            )}
            {scheduleFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Agendamento de entrega</dt>
                <dd className="text-ink">+{formatBRL(scheduleFee)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-line pt-2 text-base">
              <dt className="font-black text-ink">Total</dt>
              <dd className="font-black text-brand">{formatBRL(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* Barra fixa de total (telas pequenas) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-ink-soft">Total</p>
            <p className="text-lg font-black text-brand">{formatBRL(total)}</p>
          </div>
          {step < 3 ? (
            <button
              onClick={next}
              disabled={
                (step === 0 && !addrValid) ||
                (step === 1 && (!selectedOption || schedIncomplete)) ||
                (step === 2 && !payValid)
              }
              className="rounded-md bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-40"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={confirm}
              className="rounded-md bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Confirmar pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
