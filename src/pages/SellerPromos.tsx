import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import { PRODUCTS, type Product } from "../data/products";
import {
  addPromo,
  listPromos,
  promoStatus,
  removePromo,
  type PromoStatus,
} from "../lib/sellerOverrides";
import { useToasts } from "../context/toastsCore";
import SellerGate from "../components/SellerGate";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const statusBadge: Record<PromoStatus, { label: string; cls: string }> = {
  agendada: { label: "Agendada", cls: "bg-line text-ink-soft" },
  ativa: { label: "Ativa", cls: "bg-ship/15 text-ship" },
  encerrada: { label: "Encerrada", cls: "bg-line text-ink-soft" },
};

export default function SellerPromos() {
  const { user } = useAuth();
  const { toast } = useToasts();
  const [productId, setProductId] = useState("");
  const [percent, setPercent] = useState("");
  const [startsAt, setStartsAt] = useState(todayISO());
  const [endsAt, setEndsAt] = useState("");
  const [err, setErr] = useState("");
  const [, setTick] = useState(0);

  const seller = user?.sellerId ? getSeller(user.sellerId) : undefined;
  const products: Product[] = seller
    ? PRODUCTS.filter((p) => p.sellerId === seller.id)
    : [];
  const promos = listPromos().filter((pr) =>
    products.some((p) => p.id === pr.productId),
  );
  promos.sort((a, b) => b.createdAt - a.createdAt);

  if (!user?.sellerId || !seller) {
    return (
      <SellerGate
        icon="🏷️"
        title="Promoções"
        description="Crie e gerencie promoções com data de início e fim."
      />
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const pct = Number(percent);
    if (!productId) {
      setErr("Escolha um produto para promover.");
      return;
    }
    if (!Number.isInteger(pct) || pct < 1 || pct > 99) {
      setErr("O desconto precisa ser um número entre 1 e 99%.");
      return;
    }
    if (!startsAt || !endsAt) {
      setErr("Informe as datas de início e fim.");
      return;
    }
    if (endsAt < startsAt) {
      setErr("A data de fim precisa ser igual ou posterior à de início.");
      return;
    }
    addPromo({ productId, percent: pct, startsAt, endsAt });
    setProductId("");
    setPercent("");
    setEndsAt("");
    setErr("");
    setTick((t) => t + 1);
    const prod = PRODUCTS.find((p) => p.id === productId);
    toast.success(
      `Promoção de ${pct}% em ${prod ? prod.name : "produto"} criada com sucesso.`,
    );
  }

  function remove(id: string) {
    const prod = PRODUCTS.find((p) => p.id === id);
    removePromo(id);
    setTick((t) => t + 1);
    toast.info(
      `Promoção removida${prod ? ` de ${prod.name}` : ""}. O preço voltou ao normal.`,
    );
  }

  const selected = products.find((p) => p.id === productId);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">
          Painel do vendedor
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Promoções
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Descontos com data de início e fim, refletidos como preço antigo no
          catálogo enquanto vigentes.
        </p>
        <nav className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/vendedor"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Painel
          </Link>
          <Link
            to="/vendedor/produtos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Meus produtos
          </Link>
        </nav>
      </header>

      <form
        onSubmit={submit}
        className="card mb-6 rounded-lg p-4"
        aria-label="Criar nova promoção"
      >
        <h2 className="text-sm font-bold text-ink">Nova promoção</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-[11px] font-semibold text-ink-soft">
            Produto
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Selecionar…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-ink-soft">
            Desconto (%)
            <input
              type="number"
              min="1"
              max="99"
              step="1"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="ex.: 15"
              className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-soft">
            Começa em
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-soft">
            Termina em
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              min={startsAt}
              className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </label>
        </div>
        {err && <p className="mt-2 text-xs font-semibold text-red-600">{err}</p>}
        {selected && Number(percent) >= 1 && Number(percent) <= 99 && (
          <p className="mt-2 text-xs text-ink-soft">
            Preço de <span className="font-semibold text-ink">{selected.name}</span>{" "}
            durante a promoção:{" "}
            <span className="font-semibold text-brand">
              {Math.round(selected.price * (1 - Number(percent) / 100) * 100) / 100}
            </span>
          </p>
        )}
        <div className="mt-3">
          <button
            type="submit"
            className="btn-brand rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            Criar promoção
          </button>
        </div>
      </form>

      <div className="card rounded-lg p-4">
        <h2 className="text-sm font-bold text-ink">
          Promoções de {seller.name}
        </h2>
        {promos.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            Nenhuma promoção criada. Use o formulário acima para agendar o
            primeiro desconto.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="pb-2 pr-3 font-semibold">Produto</th>
                  <th className="pb-2 pr-3 font-semibold">Desconto</th>
                  <th className="pb-2 pr-3 font-semibold">Período</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => {
                  const p = products.find((x) => x.id === promo.productId);
                  const st = statusBadge[promoStatus(promo, todayISO())];
                  return (
                    <tr
                      key={promo.productId}
                      className="border-b border-line/60 last:border-0"
                    >
                      <td className="py-2 pr-3 font-semibold text-ink">
                        {p ? p.name : promo.productId}
                      </td>
                      <td className="py-2 pr-3 text-brand">-{promo.percent}%</td>
                      <td className="py-2 pr-3 text-ink-soft">
                        {promo.startsAt} → {promo.endsAt}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-[3px] px-2 py-0.5 text-[11px] font-bold ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => remove(promo.productId)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
