import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import { getCoins } from "../lib/coins";
import {
  getLockState,
  LOCKOUT_MAX_ATTEMPTS,
  LOCKOUT_MINUTES,
} from "../lib/lockouts";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const { user, loginWithCredentials, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from;

  const lock = getLockState(email);
  const locked = lock.lockedUntil > Date.now();
  const [, setNowTick] = useState(0);
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNowTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [locked]);
  useEffect(() => {
    if (user && from) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

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
            <p className="text-xs font-semibold text-ink">Loja vinculada</p>
            {user.sellerId ? (
              <p className="mt-1 text-[11px] font-semibold text-brand">
                ✓ Vendendo como{" "}
                {getSeller(user.sellerId)?.name ?? "vendedor"}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-ink-soft">
                Nenhuma loja vinculada. Defina no perfil para gerenciar
                produtos e pedidos.
              </p>
            )}
            <Link
              to="/perfil"
              className="mt-2 inline-block text-[11px] font-bold text-brand hover:underline"
            >
              {user.sellerId ? "Alterar no perfil →" : "Definir minha loja →"}
            </Link>
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

  const remainingMs = locked ? Math.max(0, lock.lockedUntil - Date.now()) : 0;
  const mm = String(Math.floor(remainingMs / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((remainingMs % 60_000) / 1000)).padStart(2, "0");
  const remainingAttempts = LOCKOUT_MAX_ATTEMPTS - lock.count;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length === 0) {
      setError("Informe o e-mail e a senha.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await loginWithCredentials(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "E-mail ou senha inválidos.");
      return;
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-32 pb-12 sm:pt-28">
      <div className="card rounded-lg p-6">
        <h1 className="text-xl font-black text-ink">Entrar</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Entre com seu e-mail e senha para salvar favoritos e acompanhar
          pedidos.
        </p>
        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
          {error && (
            <p
              id="login-erro"
              role="alert"
              className="rounded-md border border-[#D93026] bg-[#FDF2F1] px-3 py-2 text-xs font-semibold text-[#D93026]"
            >
              {error}
            </p>
          )}
          {locked && (
            <div
              role="alert"
              className="rounded-md border border-[#D93026] bg-[#FDF2F1] px-3 py-2 text-xs font-semibold text-[#D93026]"
            >
              <p>Muitas tentativas incorretas para este e-mail.</p>
              <p role="timer" className="mt-1 tabular-nums">
                Tente novamente em {mm}:{ss}.
              </p>
            </div>
          )}
          {!locked && lock.count > 0 && (
            <p className="rounded-md border border-[#C77700] bg-[#FFF7E6] px-3 py-2 text-xs font-semibold text-[#8A5200]">
              Restam {remainingAttempts} de {LOCKOUT_MAX_ATTEMPTS}{" "}
              tentativas antes do bloqueio de {LOCKOUT_MINUTES} minutos.
            </p>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              E-mail
            </span>
            <input
              type="email"
              id="login-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-erro" : undefined}
              className="h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              Senha
            </span>
            <PasswordInput
              id="login-password"
              name="password"
              value={password}
              onChange={setPassword}
              placeholder="Sua senha"
              autoComplete="current-password"
              invalid={Boolean(error)}
              describedBy={error ? "login-erro" : undefined}
            />
          </label>
          <button
            type="submit"
            disabled={busy || locked}
            className="btn-brand w-full rounded-[6px] px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {locked ? `Bloqueado (${mm}:${ss})` : busy ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-soft">
          Esqueceu a senha?{" "}
          <Link to="/recuperar" className="font-bold text-brand hover:underline">
            Recuperar
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-soft">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-bold text-brand hover:underline">
            Criar conta
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-soft">
          Demonstração — nenhum dado é enviado a servidores.
        </p>
      </div>
    </div>
  );
}
