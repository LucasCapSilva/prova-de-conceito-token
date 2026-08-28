import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import type { CouponType } from "../data/coupons";
import {
  createSellerCoupon,
  couponCodeTaken,
  removeSellerCoupon,
  sellerCouponsForSeller,
  setSellerCouponActive,
  updateSellerCoupon,
  type SellerCouponDef,
} from "../lib/sellerCoupons";
import { useToasts } from "../context/toastsCore";
import SellerGate from "../components/SellerGate";

function todayISO(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const TYPES: { key: CouponType; label: string }[] = [
  { key: "percent", label: "Percentual (%)" },
  { key: "fixed", label: "Valor fixo (R$)" },
  { key: "freeship", label: "Frete grátis" },
];

type Status = "ativo" | "expirado" | "desativado";

function statusOf(c: SellerCouponDef, today: string): Status {
  if (!c.active) return "desativado";
  if (c.expiresAt < today) return "expirado";
  return "ativo";
}

const statusBadge: Record<Status, { label: string; cls: string }> = {
  ativo: { label: "Ativo", cls: "bg-ship/15 text-ship" },
  expirado: { label: "Expirado", cls: "bg-line text-ink-soft" },
  desativado: { label: "Desativado", cls: "bg-line text-ink-soft" },
};

function valueLabel(c: SellerCouponDef): string {
  if (c.type === "percent") return `−${c.value}%`;
  if (c.type === "freeship") return "Frete grátis";
  const v = Math.round(c.value * 100) / 100;
  return `−R$ ${String(v).replace(".", ",")}`;
}

const inputCls =
  "mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30";

export default function SellerCoupons() {
  const { user } = useAuth();
  const { toast } = useToasts();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CouponType>("percent");
  const [value, setValue] = useState("10");
  const [minValue, setMinValue] = useState("0");
  const [expiresAt, setExpiresAt] = useState(todayISO(30));
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const seller = user?.sellerId ? getSeller(user.sellerId) : undefined;
  const today = todayISO();
  const mine = user?.sellerId ? sellerCouponsForSeller(user.sellerId) : [];

  if (!user?.sellerId || !seller) {
    return (
      <SellerGate
        icon="🎟️"
        title="Cupons da loja"
        description="Crie, edite e desative cupons que aparecem no bloco da sua loja no carrinho e na central de cupons."
      />
    );
  }

  const sellerId = user.sellerId;

  function validate(v: {
    code: string;
    type: CouponType;
    value: number;
    minValue: number;
    expiresAt: string;
  }): string | null {
    const c = v.code.trim();
    if (c.length < 3 || !/^[a-z0-9]+$/i.test(c)) {
      return "O código precisa ter ao menos 3 letras ou números.";
    }
    if (
      couponCodeTaken(c, sellerId, editingId ?? undefined) ||
      mine.some(
        (m) => m.id !== editingId && m.code.toLowerCase() === c.toLowerCase()
      )
    ) {
      return "Este código já está em uso por sua loja.";
    }
    if (v.type === "percent" && (!Number.isInteger(v.value) || v.value < 1 || v.value > 99)) {
      return "O desconto precisa ser um número inteiro entre 1 e 99%.";
    }
    if (v.type === "fixed" && !(v.value > 0)) {
      return "O valor fixo precisa ser maior que zero.";
    }
    if (v.minValue < 0) {
      return "O valor mínimo não pode ser negativo.";
    }
    if (!v.expiresAt) {
      return "Informe a data de validade.";
    }
    if (v.expiresAt < today) {
      return "A data de validade precisa ser hoje ou no futuro.";
    }
    return null;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = {
      code,
      type,
      value: Number(value),
      minValue: Number(minValue),
      expiresAt,
    };
    const problem = validate(v);
    if (problem) {
      setErr(problem);
      return;
    }
    if (editingId) {
      const cur = mine.find((m) => m.id === editingId);
      updateSellerCoupon(editingId, {
        code: v.code,
        description: description.trim(),
        value: v.type === "freeship" ? 100 : v.value,
        minValue: v.minValue,
        expiresAt: v.expiresAt,
      });
      const name = cur ? cur.code : "Cupom";
      setEditingId(null);
      toast.success(`Cupom ${name} atualizado.`);
    } else {
      const def = createSellerCoupon(sellerId, {
        code: v.code,
        description,
        type: v.type,
        value: v.value,
        minValue: v.minValue,
        expiresAt: v.expiresAt,
      });
      toast.success(`Cupom ${def.code} criado. Ele já vale para o seu bloco no carrinho.`);
    }
    setCode("");
    setDescription("");
    setType("percent");
    setValue("10");
    setMinValue("0");
    setExpiresAt(todayISO(30));
    setErr("");
    setTick((t) => t + 1);
  }

  function startEdit(c: SellerCouponDef) {
    setEditingId(c.id);
    setCode(c.code);
    setDescription(c.description);
    setType(c.type);
    setValue(String(c.value));
    setMinValue(String(c.minValue));
    setExpiresAt(c.expiresAt);
    setErr("");
  }

  function cancelEdit() {
    setEditingId(null);
    setCode("");
    setDescription("");
    setType("percent");
    setValue("10");
    setMinValue("0");
    setExpiresAt(todayISO(30));
    setErr("");
  }

  function toggleActive(c: SellerCouponDef) {
    setSellerCouponActive(c.id, !c.active);
    setTick((t) => t + 1);
    toast.info(
      c.active
        ? `Cupom ${c.code} desativado. Ele não vale mais no carrinho.`
        : `Cupom ${c.code} reativado.`,
    );
  }

  function remove(c: SellerCouponDef) {
    removeSellerCoupon(c.id);
    if (editingId === c.id) cancelEdit();
    setTick((t) => t + 1);
    toast.info(`Cupom ${c.code} removido.`);
  }

  const editing = editingId ? mine.find((m) => m.id === editingId) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">
          Painel do vendedor
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Cupons da loja
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Crie, edite e desative cupons que aparecem no bloco da{" "}
          <span className="font-semibold text-ink">{seller.name}</span> no
          carrinho e na central de cupons.
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
          <Link
            to="/vendedor/promos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Promoções
          </Link>
        </nav>
      </header>

      <form
        onSubmit={submit}
        className="card mb-6 rounded-lg p-4"
        aria-label={editing ? "Editar cupom" : "Criar novo cupom"}
      >
        <h2 className="text-sm font-bold text-ink">
          {editing ? `Editar cupom ${editing.code}` : "Novo cupom"}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-[11px] font-semibold text-ink-soft">
            Código
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EX.: LOJA10"
              className={inputCls}
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-soft">
            Descrição
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Desconto de aniversário da loja"
              className={inputCls}
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-soft">
            Tipo
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CouponType)}
              className={inputCls}
            >
              {TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {type !== "freeship" && (
            <label className="text-[11px] font-semibold text-ink-soft">
              {type === "percent" ? "Desconto (%)" : "Desconto (R$)"}
              <input
                type={type === "percent" ? "number" : "number"}
                min="0"
                max={type === "percent" ? 99 : undefined}
                step={type === "percent" ? 1 : "0.01"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={inputCls}
              />
            </label>
          )}
          <label className="text-[11px] font-semibold text-ink-soft">
            Valor mínimo (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-soft">
            Válido até
            <input
              type="date"
              min={today}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
        {err && <p className="mt-2 text-xs font-semibold text-red-600">{err}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="btn-brand rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            {editing ? "Salvar alterações" : "Criar cupom"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-[6px] border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="card rounded-lg p-4">
        <h2 className="text-sm font-bold text-ink">
          Cupons de {seller.name}
        </h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            Nenhum cupom criado. Use o formulário acima para criar o primeiro —
            ele passa a valer no seu bloco no carrinho e aparece na central de
            cupons.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="pb-2 pr-3 font-semibold">Código</th>
                  <th className="pb-2 pr-3 font-semibold">Descrição</th>
                  <th className="pb-2 pr-3 font-semibold">Desconto</th>
                  <th className="pb-2 pr-3 font-semibold">Mínimo</th>
                  <th className="pb-2 pr-3 font-semibold">Válido até</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((c) => {
                  const st = statusBadge[statusOf(c, today)];
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-line/60 align-top last:border-0"
                    >
                      <td className="py-2 pr-3 font-mono text-xs font-bold text-brand">
                        {c.code}
                      </td>
                      <td className="max-w-[220px] py-2 pr-3 text-ink-soft">
                        {c.description}
                      </td>
                      <td className="py-2 pr-3 font-semibold text-brand">
                        {valueLabel(c)}
                      </td>
                      <td className="py-2 pr-3 text-ink-soft">
                        {c.minValue > 0
                          ? `R$ ${String(Math.round(c.minValue * 100) / 100).replace(".", ",")}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-3 text-ink-soft">{c.expiresAt}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-[3px] px-2 py-0.5 text-[11px] font-bold ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="text-xs font-semibold text-ink hover:text-brand hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(c)}
                            className="text-xs font-semibold text-ink hover:text-brand hover:underline"
                          >
                            {c.active ? "Desativar" : "Reativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(c)}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remover
                          </button>
                        </div>
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
