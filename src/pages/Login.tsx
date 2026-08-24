import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { SELLERS } from "../data/sellers";
import { getCoins } from "../lib/coins";

export default function Login() {
  const { user, login, setSeller, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sellerId, setSellerId] = useState("");

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 pb-12 sm:pt-28">
        <div className="card rounded-lg p-6 text-center">
          <span className="text-4xl">👋</span>
          <h1 className="mt-3 text-xl font-black text-ink">Olá, {user.name}!</h1>
          <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
          <p className="mt-4 text-xs text-ink-soft">
            Você está conectado. Sessões desta loja são simuladas (mock) e
            ficam salvas neste navegador.
          </p>
          <div className="mt-5 rounded-md border border-line bg-page p-3 text-left">
            <label className="mb-1 block text-xs font-semibold text-ink">
              Perfil de vendedor
            </label>
            <select
              value={user.sellerId ?? ""}
              onChange={(e) => setSeller(e.target.value || null)}
              className="h-9 w-full rounded-[6px] border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="">Não vendo na loja</option>
              {SELLERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {user.sellerId ? (
              <p className="mt-2 text-[11px] font-semibold text-brand">
                ✓ Vendendo como vendedor da loja
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-ink-soft">
                Ative para gerenciar seus produtos e pedidos.
              </p>
            )}
          </div>
          <div className="mt-3 rounded-md border border-line bg-page p-3 text-left">
            <p className="text-xs font-black uppercase tracking-wide text-ink-soft">
              Moedas de fidelidade
            </p>
            <p className="mt-1 text-lg font-black text-brand">
              🪙 {getCoins()} moedas
            </p>
            <p className="text-[11px] text-ink-soft">
              Ganhe 1 moeda por real gasto e use no checkout (até 5% do total).
            </p>
            <Link
              to="/moedas"
              className="mt-2 inline-block text-[11px] font-bold text-brand hover:underline"
            >
              Fazer check-in diário →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link
              to={user.sellerId ? "/vendedor" : "/pedidos"}
              className="rounded-[6px] border border-line bg-surface px-4 py-2 text-sm font-bold text-ink transition hover:border-brand"
            >
              {user.sellerId ? "Painel do vendedor" : "Meus pedidos"}
            </Link>
            <Link
              to="/perfil"
              className="rounded-[6px] border border-line bg-surface px-4 py-2 text-sm font-bold text-ink transition hover:border-brand"
            >
              Meu perfil
            </Link>
            <Link
              to="/cartoes"
              className="rounded-[6px] border border-line bg-surface px-4 py-2 text-sm font-bold text-ink transition hover:border-brand"
            >
              Cartões salvos
            </Link>
            <button
              onClick={logout}
              className="rounded-[6px] bg-ink px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim() || "Cliente";
    login(
      trimmedName,
      email.trim() || `${trimmedName.toLowerCase()}@email.com`,
      sellerId || null,
    );
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-32 pb-12 sm:pt-28">
      <div className="card rounded-lg p-6">
        <h1 className="text-xl font-black text-ink">Entrar</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Entre com seu nome e e-mail para salvar favoritos e acompanhar
          pedidos.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              Nome
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              className="h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              E-mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              className="h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              Tipo de conta
            </span>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="">Cliente</option>
              {SELLERS.map((s) => (
                <option key={s.id} value={s.id}>
                  Vendedor — {s.name}
                </option>
              ))}
            </select>
            {sellerId !== "" && (
              <span className="mt-1 block text-[11px] text-ink-soft">
                Você poderá acessar o painel do vendedor em{" "}
                <span className="font-semibold text-brand">/vendedor</span>.
              </span>
            )}
          </label>
          <button
            type="submit"
            className="btn-brand w-full rounded-[6px] px-4 py-2.5 text-sm font-bold"
          >
            Entrar
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-soft">
          Demonstração — nenhum dado é enviado a servidores.
        </p>
      </div>
    </div>
  );
}
