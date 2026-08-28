import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelOrder, getOrder, linkOrderToAccount, type Order, type OrderItem } from "../lib/orders";
import { findAccountByEmail, updateAccount } from "../lib/accounts";
import { read, write } from "../lib/storage";
import { useAuth } from "../context/authCore";
import { useToasts } from "../context/toastsCore";
import { createReturn, getReturnForItem } from "../lib/returns";
import { addMyReview, getMyReviewForItem } from "../lib/myReviews";
import { addSellerRating, getRatingFor } from "../lib/sellerRatings";
import { getProduct } from "../data/products";
import { formatBRL, formatDate } from "../lib/format";
import { slotLabel } from "../lib/schedule";
import SmartImage from "../components/SmartImage";
import PasswordInput from "../components/PasswordInput";
import PasswordStrength, { evaluatePassword } from "../components/PasswordStrength";

const TRACK_STEPS = [
  "Confirmado",
  "Preparando",
  "Enviado",
  "Em trânsito",
  "Entregue",
] as const;

const PICKUP_STEPS = [
  "Confirmado",
  "Preparando",
  "Pronto p/ retirada",
  "Retirado",
] as const;

const TRACK_CITIES = [
  "São Paulo · SP",
  "Guarulhos · SP",
  "Osasco · SP",
  "Campinas · SP",
  "Rio de Janeiro · RJ",
  "Belo Horizonte · MG",
];

function hashSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function seededInt(seed: number, salt: number): number {
  let x = (seed ^ Math.imul(salt, 374761393)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 2654435761) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

function timelineStep(o: Order): number {
  if (o.pickup) {
    if (o.status === "delivered" || o.status === "shipped") return 3;
    if (o.status === "processing") return 1;
    const mins = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
    if (mins >= 10) return 3;
    if (mins >= 5) return 2;
    if (mins >= 2) return 1;
    return 0;
  }
  if (o.status === "delivered") return 4;
  if (o.status === "shipped") return 3;
  if (o.status === "processing") return 1;
  const mins = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
  if (mins >= 10) return 4;
  if (mins >= 5) return 3;
  if (mins >= 2) return 1;
  return 0;
}

interface TrackEvent {
  label: string;
  date: Date;
  location: string;
  done: boolean;
}

function trackingEvents(o: Order, step: number): TrackEvent[] {
  const seed = hashSeed(o.id);
  const created = new Date(o.createdAt).getTime();
  const eta = new Date(o.estimatedDate).getTime();
  const span = Math.max(eta - created, 3600000);
  const steps = o.pickup ? PICKUP_STEPS : TRACK_STEPS;
  const last = steps.length - 1;
  const place = [
    "Centro de operações",
    "Centro de distribuição",
    "Agência de transporte",
    "Hub logístico regional",
    "Endereço do destinatário",
  ];
  const pointLabel = o.pickup
    ? `${o.pickup.point.name} — ${o.pickup.point.city}/${o.pickup.point.state}`
    : null;
  return steps.map((label, i) => {
    const jitterMin = seededInt(seed, i + 1) % 45;
    const date = new Date(created + (span * i) / last + jitterMin * 60000);
    const city = TRACK_CITIES[seededInt(seed, 50 + i) % TRACK_CITIES.length];
    const location =
      pointLabel && i >= last - 1 ? pointLabel : `${place[i]} — ${city}`;
    return {
      label,
      date,
      location,
      done: i <= step,
    };
  });
}

function timeOf(iso: Date) {
  return iso.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Timeline({ step, labels }: { step: number; labels: readonly string[] }) {
  return (
    <ol className="flex items-start">
      {labels.map((label, i) => {
        const done = i <= step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-1 flex-col items-center text-center">
            <span
              className={`grid size-9 place-items-center rounded-full border-2 text-sm font-black transition ${
                done
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-ink-soft"
              } ${active ? "ring-4 ring-brand-soft" : ""}`}
              aria-hidden
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`mt-2 text-xs font-semibold ${
                done ? "text-ink" : "text-ink-soft"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ReviewForm({
  orderId,
  item,
  onDone,
}: {
  orderId: string;
  item: OrderItem;
  onDone: (itemId: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    const list = photos
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    addMyReview({
      id: `my-${orderId}-${item.id}`,
      productId: item.id,
      author: "Você",
      rating,
      date: new Date().toISOString(),
      comment: comment.trim(),
      helpful: 0,
      photos: list.length ? list : undefined,
    });
    onDone(item.id);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-ink-soft">Nota:</span>
        {[5, 4, 3, 2, 1].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} estrelas`}
            className={`text-lg leading-none transition ${
              rating === n ? "text-star" : "text-line hover:text-ink-soft"
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-1 text-xs font-semibold text-ink">
          {rating}/5
        </span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Conte como foi sua experiência com o produto"
        className="w-full rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
      />
      <input
        value={photos}
        onChange={(e) => setPhotos(e.target.value)}
        placeholder="URLs de fotos (separadas por vírgula ou linha)"
        aria-label="URLs de fotos"
        className="w-full rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
      />
      <button
        type="submit"
        disabled={!comment.trim()}
        className="btn-brand rounded-[6px] px-4 py-1.5 text-xs font-bold disabled:opacity-40"
      >
        Enviar avaliação
      </button>
    </form>
  );
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-ink-soft">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n} de 5 estrelas`}
            className={`text-base leading-none transition ${
              n <= value ? "text-star" : "text-line hover:text-ink-soft"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function SellerRatingForm({
  orderId,
  sellerId,
  sellerName,
  onDone,
}: {
  orderId: string;
  sellerId: string;
  sellerName: string;
  onDone: (sellerId: string) => void;
}) {
  const [service, setService] = useState(0);
  const [packaging, setPackaging] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [comment, setComment] = useState("");
  const ready = service > 0 && packaging > 0 && delivery > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    addSellerRating({
      orderId,
      sellerId,
      service,
      packaging,
      delivery,
      comment: comment.trim() ? comment.trim() : undefined,
    });
    onDone(sellerId);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-semibold text-ink">{sellerName}</p>
      <StarRow label="Atendimento" value={service} onChange={setService} />
      <StarRow label="Embalagem" value={packaging} onChange={setPackaging} />
      <StarRow label="Prazo" value={delivery} onChange={setDelivery} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Deixe um comentário sobre a experiência (opcional)"
        aria-label={`Comentário sobre ${sellerName}`}
        className="w-full rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
      />
      <button
        type="submit"
        disabled={!ready}
        className="btn-brand rounded-[6px] px-4 py-1.5 text-xs font-bold disabled:opacity-40"
      >
        Avaliar vendedor
      </button>
    </form>
  );
}

const RETURN_REASONS = [
  "Produto chegou danificado",
  "Produto não corresponde à descrição",
  "Produto veio incompleto",
  "Outro motivo",
];

function ReturnForm({
  order,
  item,
  onDone,
}: {
  order: Order;
  item: OrderItem;
  onDone: (productId: string, protocol: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [desc, setDesc] = useState("");
  const [photos, setPhotos] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!reason || !desc.trim()) return;
    const list = photos
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    const r = createReturn({
      orderId: order.id,
      productId: item.id,
      itemName: item.name,
      image: item.image,
      reason,
      description: desc.trim(),
      photos: list,
    });
    onDone(item.id, r.protocol);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Motivo da devolução"
        className="w-full rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink"
      >
        <option value="">Escolha o motivo…</option>
        {RETURN_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={2}
        placeholder="Descreva o problema encontrado no produto"
        className="w-full rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
      />
      <input
        value={photos}
        onChange={(e) => setPhotos(e.target.value)}
        placeholder="URLs de fotos (separadas por vírgula ou linha)"
        aria-label="URLs de fotos do problema"
        className="w-full rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
      />
      <button
        type="submit"
        disabled={!reason || !desc.trim()}
        className="rounded-[6px] border border-brand bg-surface px-4 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-white disabled:opacity-40"
      >
        Gerar protocolo de devolução
      </button>
    </form>
  );
}

const DISMISS_KEY = "accountPromptDismissed";

function GuestAccountPrompt({ order, onLinked }: { order: Order; onLinked: () => void }) {
  const { user, register } = useAuth();
  const { toast } = useToasts();
  const [dismissed, setDismissed] = useState(
    () => read<string[]>(DISMISS_KEY, []).includes(order.id) || Boolean(order.accountId),
  );
  const [name, setName] = useState(order.address.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user || dismissed) return null;

  const inputClass = (err: string | undefined) =>
    `h-10 w-full rounded-[6px] border bg-surface px-3 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-brand ${
      err ? "border-[#D93026]" : "border-line"
    }`;

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Informe seu nome completo.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Informe um e-mail válido.";
    if (evaluatePassword(password).level === "fraca")
      e.password = "A senha é fraca. Use 8+ caracteres com letras, números e símbolos.";
    if (!confirm || confirm !== password) e.confirm = "As senhas não conferem.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate() || busy) return;
    setBusy(true);
    setServerError("");
    const res = await register(name.trim(), email.trim(), password);
    if (!res.ok) {
      setServerError(res.error ?? "Não foi possível criar a conta.");
      setBusy(false);
      return;
    }
    const account = findAccountByEmail(email.trim());
    if (account) {
      if (!order.accountId) linkOrderToAccount(order.id, account.id);
      if (order.address.cpf && !account.cpf) {
        updateAccount(account.id, { cpf: order.address.cpf });
      }
    }
    toast.success("Conta criada! Seu pedido ficou vinculado à sua conta.");
    onLinked();
  }

  function dismiss() {
    const list = read<string[]>(DISMISS_KEY, []);
    if (!list.includes(order.id)) write(DISMISS_KEY, [...list, order.id]);
    setDismissed(true);
  }

  return (
    <section className="card mb-4 rounded-lg border border-brand/30 bg-brand-soft p-4 sm:p-5" aria-label="Criar conta">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-ink">👤 Você comprou sem criar conta</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Crie sua conta para acompanhar pedidos, salvar favoritos e usar cupons. Seus dados já estão preenchidos.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar convite para criar conta"
          className="text-lg font-bold leading-none text-ink-soft transition hover:text-ink"
        >
          ×
        </button>
      </div>
      <form onSubmit={submit} noValidate className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="guest-name" className="mb-1 block text-xs font-bold text-ink">
            Nome
          </label>
          <input
            id="guest-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "guest-name-err" : undefined}
            className={inputClass(errors.name)}
          />
          {errors.name && (
            <span id="guest-name-err" role="alert" className="mt-1 block text-xs font-semibold text-[#D93026]">
              {errors.name}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="guest-email" className="mb-1 block text-xs font-bold text-ink">
            E-mail
          </label>
          <input
            id="guest-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="voce@exemplo.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "guest-email-err" : undefined}
            className={inputClass(errors.email)}
          />
          {errors.email && (
            <span id="guest-email-err" role="alert" className="mt-1 block text-xs font-semibold text-[#D93026]">
              {errors.email}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="guest-password" className="mb-1 block text-xs font-bold text-ink">
            Nova senha
          </label>
          <PasswordInput
            id="guest-password"
            name="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="Crie uma senha"
            invalid={Boolean(errors.password)}
            describedBy="guest-password-err"
          />
          <PasswordStrength password={password} />
          {errors.password && (
            <span id="guest-password-err" role="alert" className="mt-1 block text-xs font-semibold text-[#D93026]">
              {errors.password}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="guest-confirm" className="mb-1 block text-xs font-bold text-ink">
            Confirmar senha
          </label>
          <PasswordInput
            id="guest-confirm"
            name="confirm"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Repita a senha"
            invalid={Boolean(errors.confirm)}
            describedBy="guest-confirm-err"
          />
          {errors.confirm && (
            <span id="guest-confirm-err" role="alert" className="mt-1 block text-xs font-semibold text-[#D93026]">
              {errors.confirm}
            </span>
          )}
        </div>
        {serverError && (
          <p
            role="alert"
            className="rounded-[4px] border border-[#D93026]/30 bg-surface px-3 py-2 text-xs font-semibold text-[#D93026] sm:col-span-2"
          >
            {serverError}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="btn-brand w-full rounded-[6px] px-4 py-2.5 text-sm font-bold disabled:opacity-60 sm:col-span-2"
        >
          {busy ? "Criando conta…" : "Criar conta"}
        </button>
        <div className="text-center sm:col-span-2">
          <button type="button" onClick={dismiss} className="text-xs font-bold text-ink-soft underline transition hover:text-ink">
            Agora não
          </button>
        </div>
      </form>
    </section>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [orderVersion, setOrderVersion] = useState(0);
  const order = useMemo(() => getOrder(id ?? ""), [id, orderVersion]);
  useEffect(() => {
    if (!user?.id || !id) return;
    const existing = getOrder(id);
    if (!existing || existing.accountId) return;
    linkOrderToAccount(id, user.id);
    setOrderVersion((v) => v + 1);
  }, [id, user]);
  const step = order ? timelineStep(order) : 0;
  const [reviewed, setReviewed] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    if (order) {
      for (const it of order.items) {
        if (getMyReviewForItem(order.id, it.id)) m[it.id] = true;
      }
    }
    return m;
  });
  const markReviewed = (itemId: string) =>
    setReviewed((m) => ({ ...m, [itemId]: true }));
  const [sellerRated, setSellerRated] = useState<Record<string, boolean>>(
    () => {
      const m: Record<string, boolean> = {};
      if (order) {
        for (const it of order.items) {
          const p = getProduct(it.id);
          if (p && getRatingFor(order.id, p.sellerId)) m[p.sellerId] = true;
        }
      }
      return m;
    },
  );
  const sellersInOrder = useMemo(() => {
    if (!order) return [] as { id: string; name: string }[];
    const seen = new Map<string, string>();
    for (const it of order.items) {
      const p = getProduct(it.id);
      if (p && !seen.has(p.sellerId)) seen.set(p.sellerId, it.seller);
    }
    return [...seen].map(([id, name]) => ({ id, name }));
  }, [order]);
  const [cancelled, setCancelled] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [returnProtocols, setReturnProtocols] = useState<
    Record<string, string>
  >(() => {
    const m: Record<string, string> = {};
    if (order) {
      for (const it of order.items) {
        const r = getReturnForItem(order.id, it.id);
        if (r) m[it.id] = r.protocol;
      }
    }
    return m;
  });
  const [openReturns, setOpenReturns] = useState<Record<string, boolean>>({});
  const [nf, setNf] = useState(false);
  useEffect(() => {
    if (!nf) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNf(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [nf]);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-12 sm:pt-28">
        <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
          <span className="text-4xl">🔎</span>
          <p className="text-sm font-semibold text-ink">Pedido não encontrado</p>
          <Link to="/pedidos" className="text-xs font-semibold text-brand hover:underline">
            Voltar para meus pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <Link
        to="/pedidos"
        className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand"
      >
        ← Meus pedidos
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Pedido {order.tracking}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Realizado em {formatDate(order.createdAt)} · {order.payment}
          </p>
        </div>
        <button
          onClick={() => setNf(true)}
          className="rounded-[6px] border border-line bg-surface px-4 py-2 text-xs font-bold text-ink transition hover:border-ink-soft"
        >
          🧾 Nota fiscal
        </button>
      </div>

      {!order.accountId && (
        <GuestAccountPrompt order={order} onLinked={() => setOrderVersion((v) => v + 1)} />
      )}

      {cancelled || order.status === "cancelled" ? (
        <div className="card mb-4 rounded-lg border border-line p-5">
          <p className="text-sm font-bold text-rose-500">
            ✕ Pedido cancelado
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            O pedido foi cancelado. A devolução do valor será processada em
            até 5 dias úteis para o meio de pagamento original.
          </p>
        </div>
      ) : (
        <div className="card mb-4 rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Rastreamento</h2>
            <span className="text-xs font-semibold text-ink-soft">
              {order.pickup
                ? "Pronto para retirada: "
                : order.schedule
                  ? "Entrega agendada: "
                  : "Previsão: "}
              {formatDate(order.estimatedDate)}
              {order.schedule && ` · ${slotLabel(order.schedule.slot)}`}
            </span>
          </div>
          <Timeline
            step={step}
            labels={order.pickup ? PICKUP_STEPS : TRACK_STEPS}
          />
          <ol className="mt-5">
            {trackingEvents(order, step).map((ev, i, arr) => (
              <li key={ev.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`size-3 shrink-0 rounded-full ${
                      ev.done ? "bg-ship" : "bg-line"
                    }`}
                  />
                  {i < arr.length - 1 && (
                    <span className="w-px flex-1 bg-line" aria-hidden />
                  )}
                </div>
                <div className={i < arr.length - 1 ? "pb-4" : ""}>
                  <p
                    className={`text-sm font-bold ${
                      ev.done ? "text-ink" : "text-ink-soft/70"
                    }`}
                  >
                    {ev.label}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {ev.done
                      ? `Ocorrido em ${formatDate(ev.date)} às ${timeOf(ev.date)}`
                      : `Previsto para ${formatDate(ev.date)} às ${timeOf(ev.date)}`}
                  </p>
                  <p className="text-xs text-ink-soft">
                    📍 {ev.location}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!cancelled &&
        (order.status === "confirmed" || order.status === "processing") && (
          <div className="card mb-4 rounded-lg border border-line p-4">
            {confirming ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-ink">
                  Tem certeza que deseja cancelar o pedido?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const c = cancelOrder(order.id);
                      if (c) {
                        setCancelled(true);
                        setConfirming(false);
                      }
                    }}
                    className="rounded-[6px] bg-rose-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-600"
                  >
                    Sim, cancelar pedido
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="rounded-[6px] border border-line bg-surface px-4 py-2 text-xs font-bold text-ink transition hover:border-ink-soft"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-soft">
                  Você ainda pode cancelar este pedido sem custo.
                </p>
                <button
                  onClick={() => setConfirming(true)}
                  className="rounded-[6px] border border-rose-500 bg-surface px-4 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-500/10"
                >
                  Cancelar pedido
                </button>
              </div>
            )}
          </div>
        )}

      <div className="card mb-4 rounded-lg p-5">
        <h2 className="mb-4 text-sm font-bold text-ink">
          Itens ({order.items.length})
        </h2>
        <ul className="divide-y divide-line">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="size-16 shrink-0 overflow-hidden rounded-md">
                <SmartImage src={it.image} alt={it.name} className="size-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/produto/${it.id}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand">
                  {it.name}
                </Link>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {it.qty}x · {it.seller}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-ink">
                {formatBRL(it.price * it.qty)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-ink-soft">
            <dt>Subtotal</dt>
            <dd>{formatBRL(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ink-soft">
            <dt>Frete</dt>
            <dd>{order.shipping === 0 ? "Grátis" : formatBRL(order.shipping)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-ship">
              <dt>Desconto</dt>
              <dd>-{formatBRL(order.discount)}</dd>
            </div>
          )}
          {order.gift && (
            <div className="flex justify-between text-ink-soft">
              <dt>Embrulho presente 🎁</dt>
              <dd>{formatBRL(order.gift.fee)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-black text-ink">
            <dt>Total</dt>
            <dd>{formatBRL(order.total)}</dd>
          </div>
        </dl>
        {order.gift?.message && (
          <p className="mt-2 rounded bg-brand-soft px-3 py-2 text-xs italic text-ink">
            Mensagem do presente: “{order.gift.message}”
          </p>
        )}
      </div>

      {order.status === "delivered" && (
        <div className="card mb-4 rounded-lg p-5">
          <h2 className="mb-2 text-sm font-bold text-ink">Devoluções</h2>
          <p className="mb-4 text-xs text-ink-soft">
            Pedido entregue: solicite a devolução de qualquer item com um
            protocolo rastreável.
          </p>
          <ul className="divide-y divide-line">
            {order.items.map((it) => (
              <li key={it.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md">
                    <SmartImage
                      src={it.image}
                      alt={it.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <Link
                    to={`/produto/${it.id}`}
                    className="line-clamp-1 min-w-0 flex-1 text-sm font-semibold text-ink hover:text-brand"
                  >
                    {it.name}
                  </Link>
                </div>
                {returnProtocols[it.id] ? (
                  <p className="mt-3 rounded bg-line/40 px-3 py-2 text-xs font-semibold text-ink">
                    📋 Protocolo {returnProtocols[it.id]} ·{" "}
                    <Link
                      to="/devolucoes"
                      className="font-bold text-brand hover:underline"
                    >
                      acompanhar devolução
                    </Link>
                  </p>
                ) : openReturns[it.id] ? (
                  <ReturnForm
                    order={order}
                    item={it}
                    onDone={(productId, protocol) =>
                      setReturnProtocols((m) => ({
                        ...m,
                        [productId]: protocol,
                      }))
                    }
                  />
                ) : (
                  <button
                    onClick={() =>
                      setOpenReturns((m) => ({ ...m, [it.id]: true }))
                    }
                    className="mt-3 rounded-[6px] border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink transition hover:border-ink-soft"
                  >
                    Solicitar devolução
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!cancelled && order.status !== "cancelled" && (
      <div className="card mb-4 rounded-lg p-5">
        <h2 className="mb-2 text-sm font-bold text-ink">
          Avaliar itens do pedido
        </h2>
        <p className="mb-4 text-xs text-ink-soft">
          Compartilhe sua opinião: as avaliações aparecem na página do produto.
        </p>
        <ul className="divide-y divide-line">
          {order.items.map((it) => (
            <li key={it.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-md">
                  <SmartImage
                    src={it.image}
                    alt={it.name}
                    className="size-full object-cover"
                  />
                </div>
                <Link
                  to={`/produto/${it.id}`}
                  className="line-clamp-1 min-w-0 flex-1 text-sm font-semibold text-ink hover:text-brand"
                >
                  {it.name}
                </Link>
              </div>
              {reviewed[it.id] ? (
                <p className="mt-3 rounded bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">
                  ✓ Você já avaliou este produto.{" "}
                  <Link
                    to={`/produto/${it.id}`}
                    className="underline"
                  >
                    Ver avaliações
                  </Link>
                </p>
              ) : (
                <ReviewForm
                  orderId={order.id}
                  item={it}
                  onDone={markReviewed}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
      )}

      {order.status === "delivered" && !cancelled && (
      <div className="card mb-4 rounded-lg p-5">
        <h2 className="mb-2 text-sm font-bold text-ink">
          Avaliar o vendedor
        </h2>
        <p className="mb-4 text-xs text-ink-soft">
          Pedido entregue: avalie atendimento, embalagem e prazo. Sua nota
          compõe a reputação da loja.
        </p>
        <ul className="divide-y divide-line">
          {sellersInOrder.map((s) => (
            <li key={s.id} className="py-4 first:pt-0 last:pb-0">
              {sellerRated[s.id] ? (
                <p className="rounded bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">
                  ✓ {s.name} — vendedor avaliado.{" "}
                  <Link
                    to={`/loja/${s.id}`}
                    className="underline"
                  >
                    Ver loja
                  </Link>
                </p>
              ) : (
                <SellerRatingForm
                  orderId={order.id}
                  sellerId={s.id}
                  sellerName={s.name}
                  onDone={(sid) =>
                    setSellerRated((m) => ({ ...m, [sid]: true }))
                  }
                />
              )}
            </li>
          ))}
        </ul>
      </div>
      )}

      <div className="card rounded-lg p-5">
        {order.pickup ? (
          <>
            <h2 className="mb-2 text-sm font-bold text-ink">Ponto de coleta</h2>
            <p className="text-sm text-ink">{order.pickup.point.name}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {order.pickup.point.street}, {order.pickup.point.number} —{" "}
              {order.pickup.point.neighborhood}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {order.pickup.point.city}/{order.pickup.point.state} · CEP{" "}
              {order.pickup.point.cep}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Funcionamento: {order.pickup.point.hours}
            </p>
            <p className="mt-2 text-xs text-ink-soft">
              Retirante: {order.address.name}
              {order.address.cpf ? ` · CPF ${order.address.cpf}` : ""}
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-sm font-bold text-ink">
              Endereço de entrega
            </h2>
            <p className="text-sm text-ink-soft">
              {order.address.name}
              {order.address.cpf ? ` · CPF ${order.address.cpf}` : ""}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {order.address.street}, {order.address.number}
              {order.address.complement ? ` · ${order.address.complement}` : ""}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {order.address.city}/{order.address.state} · CEP {order.address.cep}
            </p>
          </>
        )}
      </div>

      {nf && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Nota fiscal do pedido"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNf(false);
          }}
        >
          <div className="print-area card mx-auto my-6 w-full max-w-2xl rounded-lg p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line pb-4">
              <div>
                <p className="text-lg font-black tracking-tight text-ink">
                  ELECTRONICA STORE
                </p>
                <p className="text-xs text-ink-soft">
                  CNPJ 12.345.678/0001-90 · Av. Comercial, 1000 — São Paulo/SP
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-brand">NF-e (simulada)</p>
                <p className="text-xs text-ink-soft">
                  Nº NF-{order.tracking}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-4">
              <div>
                <dt className="font-bold text-ink-soft">Emissão</dt>
                <dd className="text-ink">
                  {formatDate(order.createdAt)} às{" "}
                  {timeOf(new Date(order.createdAt))}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-ink-soft">Pedido</dt>
                <dd className="text-ink">{order.tracking}</dd>
              </div>
              <div>
                <dt className="font-bold text-ink-soft">Pagamento</dt>
                <dd className="text-ink">{order.payment}</dd>
              </div>
              <div>
                <dt className="font-bold text-ink-soft">Previsão</dt>
                <dd className="text-ink">
                  {formatDate(order.estimatedDate)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs font-bold text-ink-soft">Destinatário</p>
              <p className="mt-1 text-sm text-ink">{order.address.name}</p>
              <p className="text-xs text-ink-soft">
                {order.address.street}, {order.address.number}
                {order.address.complement
                  ? ` · ${order.address.complement}`
                  : ""}
                {order.address.neighborhood
                  ? ` · ${order.address.neighborhood}`
                  : ""}
              </p>
              <p className="text-xs text-ink-soft">
                {order.address.city}/{order.address.state} · CEP{" "}
                {order.address.cep}
              </p>
            </div>

            <table className="mt-4 w-full border-t border-line text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-soft">
                  <th className="border-b border-line py-2 font-semibold">
                    Item
                  </th>
                  <th className="border-b border-line py-2 text-right font-semibold">
                    Qtd
                  </th>
                  <th className="border-b border-line py-2 text-right font-semibold">
                    Unit.
                  </th>
                  <th className="border-b border-line py-2 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="border-b border-line py-2 text-ink">
                      {it.name}
                    </td>
                    <td className="border-b border-line py-2 text-right text-ink">
                      {it.qty}
                    </td>
                    <td className="border-b border-line py-2 text-right text-ink">
                      {formatBRL(it.price)}
                    </td>
                    <td className="border-b border-line py-2 text-right font-bold text-ink">
                      {formatBRL(it.price * it.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-3 space-y-1 text-right text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd>{formatBRL(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ship">
                <dt>Frete</dt>
                <dd>
                  {order.shipping === 0
                    ? "Grátis"
                    : formatBRL(order.shipping)}
                </dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-ship">
                  <dt>Desconto</dt>
                  <dd>-{formatBRL(order.discount)}</dd>
                </div>
              )}
              {order.gift && (
                <div className="flex justify-between text-ink-soft">
                  <dt>Embrulho presente</dt>
                  <dd>{formatBRL(order.gift.fee)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-ink">
                <dt>Total</dt>
                <dd>{formatBRL(order.total)}</dd>
              </div>
            </dl>

            <p className="mt-4 border-t border-line pt-3 text-[11px] text-ink-soft">
              Documento fiscal simulado, gerado para fins de demonstração. Não
              possui valor fiscal.
            </p>

            <div className="no-print mt-4 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="btn-brand rounded-[6px] px-4 py-2 text-xs font-bold"
              >
                🖨 Imprimir / PDF
              </button>
              <button
                onClick={() => setNf(false)}
                className="rounded-[6px] border border-line bg-surface px-4 py-2 text-xs font-bold text-ink transition hover:border-ink-soft"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
