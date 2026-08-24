import { useState, type FormEvent } from "react";
import {
  addCard,
  getCards,
  removeCard,
  setPrimary,
  type SavedCard,
} from "../lib/cards";
import {
  cvvValid,
  expiryValid,
  luhnValid,
  maskCard,
  maskExpiry,
} from "../lib/masks";

export default function Cards() {
  const [list, setList] = useState<SavedCard[]>(() => getCards());
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const field =
    "h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand";
  const err = (k: string) =>
    errors[k] ? <p className="mt-1 text-xs text-brand">{errors[k]}</p> : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!luhnValid(number)) errs.number = "Número de cartão inválido.";
    if (holder.trim().length < 3) errs.holder = "Informe o nome do portador.";
    if (!expiryValid(expiry)) errs.expiry = "Validade inválida ou vencida.";
    if (!cvvValid(cvv)) errs.cvv = "O CVV deve ter 3 ou 4 dígitos.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setList(addCard({ number, holder, expiry }));
    setNumber("");
    setHolder("");
    setExpiry("");
    setCvv("");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Cartões salvos
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Só os 4 últimos dígitos ficam gravados, nunca o número completo.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {list.length === 0 && (
          <p className="card rounded-md p-4 text-sm text-ink-soft sm:col-span-2">
            Nenhum cartão salvo ainda. Adicione um para usar no checkout.
          </p>
        )}
        {list.map((c) => (
          <div key={c.id} className="card rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-ink">
                  {c.brand}{" "}
                  <span className="tracking-wide">
                    •••• •••• •••• {c.last4}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {c.holder} · Validade {c.expiry}
                </p>
              </div>
              {c.primary && (
                <span className="shrink-0 rounded-[2px] bg-brand-soft px-1.5 py-0.5 text-[11px] font-black text-brand">
                  Principal
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {!c.primary && (
                <button
                  onClick={() => setList(setPrimary(c.id))}
                  className="rounded-[6px] border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
                >
                  Definir principal
                </button>
              )}
              <button
                onClick={() => setList(removeCard(c.id))}
                className="rounded-[6px] border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft transition hover:border-brand hover:text-brand"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="card rounded-md p-5">
        <h2 className="text-base font-black text-ink">Adicionar cartão</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-ink">
              Número do cartão
            </span>
            <input
              className={`mt-1 ${field}`}
              value={number}
              onChange={(e) => setNumber(maskCard(e.target.value))}
              placeholder="0000 0000 0000 0000"
              aria-label="Número do cartão"
            />
            {err("number")}
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-ink">
              Nome do portador
            </span>
            <input
              className={`mt-1 ${field}`}
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="Como está impresso no cartão"
              aria-label="Nome do portador"
            />
            {err("holder")}
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Validade</span>
            <input
              className={`mt-1 ${field}`}
              value={expiry}
              onChange={(e) => setExpiry(maskExpiry(e.target.value))}
              placeholder="MM/AA"
              aria-label="Validade"
            />
            {err("expiry")}
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">CVV</span>
            <input
              className={`mt-1 ${field}`}
              value={cvv}
              onChange={(e) =>
                setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="000"
              aria-label="CVV"
            />
            {err("cvv")}
          </label>
        </div>
        <button
          type="submit"
          className="btn-brand mt-5 rounded-[6px] px-5 py-2.5 text-sm font-bold"
        >
          Salvar cartão
        </button>
      </form>
    </div>
  );
}
