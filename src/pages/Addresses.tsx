import { useState, type FormEvent } from "react";
import { getAddresses, addAddress, removeAddress } from "../lib/addresses";
import { maskCEP, maskCPF } from "../lib/masks";
import type { Address } from "../lib/orders";

const EMPTY: Address = {
  name: "",
  cpf: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  city: "",
  state: "",
};

export default function Addresses() {
  const [list, setList] = useState<Address[]>(() => getAddresses());
  const [form, setForm] = useState<Address>(EMPTY);
  const [open, setOpen] = useState(false);

  const set = (k: keyof Address) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addAddress(form);
    setList(getAddresses());
    setForm(EMPTY);
    setOpen(false);
  };

  const remove = (i: number) => setList(removeAddress(i));

  const field =
    "h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Meus endereços
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {list.length === 0
              ? "Nenhum endereço salvo."
              : `${list.length} endereço${list.length === 1 ? "" : "s"} salvo${list.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="btn-brand shrink-0 rounded-[6px] px-4 py-2 text-sm font-bold"
          aria-expanded={open}
        >
          {open ? "Fechar" : "+ Adicionar"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={onSubmit}
          className="card mb-5 grid grid-cols-2 gap-3 rounded-lg p-5 sm:grid-cols-6"
        >
          <label className="col-span-2 sm:col-span-3">
            <span className="mb-1 block text-xs font-semibold text-ink">Nome</span>
            <input className={field} value={form.name} onChange={(e) => set("name")(e.target.value)} />
          </label>
          <label className="col-span-2 sm:col-span-3">
            <span className="mb-1 block text-xs font-semibold text-ink">CPF (opcional)</span>
            <input className={field} value={form.cpf} onChange={(e) => set("cpf")(maskCPF(e.target.value))} />
          </label>
          <label className="col-span-2 sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-ink">CEP</span>
            <input className={field} value={form.cep} onChange={(e) => set("cep")(maskCEP(e.target.value))} />
          </label>
          <label className="col-span-2 sm:col-span-4">
            <span className="mb-1 block text-xs font-semibold text-ink">Rua / Endereço</span>
            <input className={field} value={form.street} onChange={(e) => set("street")(e.target.value)} />
          </label>
          <label className="col-span-1 sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-ink">Número</span>
            <input className={field} value={form.number} onChange={(e) => set("number")(e.target.value)} />
          </label>
          <label className="col-span-1 sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-ink">Compl.</span>
            <input className={field} value={form.complement} onChange={(e) => set("complement")(e.target.value)} />
          </label>
          <label className="col-span-1 sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-ink">Cidade</span>
            <input className={field} value={form.city} onChange={(e) => set("city")(e.target.value)} />
          </label>
          <label className="col-span-1 sm:col-span-1">
            <span className="mb-1 block text-xs font-semibold text-ink">UF</span>
            <input className={field} value={form.state} onChange={(e) => set("state")(e.target.value)} maxLength={2} />
          </label>
          <div className="col-span-2 flex items-end sm:col-span-6">
            <button
              type="submit"
              className="btn-brand w-full rounded-[6px] px-4 py-2.5 text-sm font-bold sm:w-auto"
            >
              Salvar endereço
            </button>
          </div>
        </form>
      )}

      {list.length === 0 ? (
        !open && (
          <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
            <span className="text-4xl">📍</span>
            <p className="text-sm font-semibold text-ink">Nenhum endereço salvo</p>
            <p className="max-w-xs text-xs text-ink-soft">
              Adicione um endereço para agilizar suas próximas entregas.
            </p>
          </div>
        )
      ) : (
        <ul className="space-y-3">
          {list.map((a, i) => (
            <li key={i} className="card flex items-start justify-between gap-3 rounded-lg p-4">
              <div>
                <p className="text-sm font-bold text-ink">
                  {a.name}
                  {a.cpf ? ` · ${a.cpf}` : ""}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {a.street}, {a.number}
                  {a.complement ? ` · ${a.complement}` : ""}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {a.city}/{a.state} · CEP {a.cep}
                </p>
              </div>
              <button
                onClick={() => remove(i)}
                className="shrink-0 text-xs font-semibold text-ink-soft hover:text-brand"
                aria-label={`Remover endereço ${a.name}`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
