import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import PasswordStrength, { evaluatePassword } from "../components/PasswordStrength";
import { useAuth } from "../context/authCore";
import { useToasts } from "../context/toastsCore";
import { cpfValid, maskCPF, maskPhone } from "../lib/masks";
import { getSeller, SELLERS } from "../data/sellers";
import { loyaltyStatus } from "../lib/loyalty";
import { formatBRL } from "../lib/format";

export default function Profile() {
  const { user, updateUser, changePassword, setPassword, setSeller } = useAuth();
  const { toast } = useToasts();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [cpf, setCpf] = useState(user?.cpf ?? "");
  const [birthdate, setBirthdate] = useState(user?.birthdate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwBusy, setPwBusy] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
        <div className="card p-6 text-center">
          <p className="text-ink">
            Para editar seu perfil, entre na sua conta.
          </p>
          <Link
            to="/entrar"
            className="btn-brand mt-4 inline-block rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  const loyalty = loyaltyStatus();
  const badgeClass =
    loyalty.level.id === "ouro"
      ? "bg-tag text-brand"
      : loyalty.level.id === "prata"
        ? "bg-line text-ink"
        : "bg-brand-soft text-brand";
  const field =
    "h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand";
  const err = (k: string) =>
    errors[k] ? <p className="mt-1 text-xs text-brand">{errors[k]}</p> : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 3) errs.name = "Informe seu nome completo.";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Informe um e-mail válido.";
    if (phone.replace(/\D/g, "").length < 10)
      errs.phone = "Informe um telefone com DDD.";
    if (!cpfValid(cpf)) errs.cpf = "Informe um CPF válido com 11 dígitos.";
    if (!birthdate) {
      errs.birthdate = "Informe sua data de nascimento.";
    } else {
      const d = new Date(birthdate + "T00:00:00");
      if (Number.isNaN(d.getTime()) || d > new Date())
        errs.birthdate = "A data não pode estar no futuro.";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    updateUser({ name: name.trim(), email, phone, cpf, birthdate });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const onPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwCurrent) errs.current = "Informe a senha atual.";
    if (!pwNext) {
      errs.next = "Informe a nova senha.";
    } else if (evaluatePassword(pwNext).level === "fraca") {
      errs.next = "Escolha uma senha mais forte — complete as regras abaixo.";
    }
    if (pwNext && pwConfirm !== pwNext)
      errs.confirm = "As senhas não conferem.";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setPwBusy(true);
    const res = await changePassword(pwCurrent, pwNext);
    setPwBusy(false);
    if (res.ok) {
      setPwCurrent("");
      setPwNext("");
      setPwConfirm("");
      setPwErrors({});
      toast.success("Senha alterada com sucesso.");
    } else {
      setPwErrors({ current: res.error ?? "Não foi possível alterar a senha." });
    }
  };

  const onSetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwNext) {
      errs.next = "Informe a nova senha.";
    } else if (evaluatePassword(pwNext).level === "fraca") {
      errs.next = "Escolha uma senha mais forte — complete as regras abaixo.";
    }
    if (pwNext && pwConfirm !== pwNext)
      errs.confirm = "As senhas não conferem.";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setPwBusy(true);
    const res = await setPassword(pwNext);
    setPwBusy(false);
    if (res.ok) {
      setPwNext("");
      setPwConfirm("");
      setPwErrors({});
      toast.success("Senha definida com sucesso.");
    } else {
      setPwErrors({ next: res.error ?? "Não foi possível definir a senha." });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Meu perfil
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Seus dados pessoais, usados em pedidos e faturas.
        </p>
      </div>

      <section
        className="card mb-6 p-5 sm:p-6"
        aria-labelledby="fidelidade-titulo"
      >
        <div className="flex items-center gap-3">
          <h2
            id="fidelidade-titulo"
            className="text-lg font-black text-ink"
          >
            Nível de fidelidade
          </h2>
          <span
            className={`rounded-[3px] px-2 py-0.5 text-xs font-black uppercase ${badgeClass}`}
          >
            {loyalty.level.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Você gastou {formatBRL(loyalty.spent)} nos últimos 12 meses.
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-[2px] bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(loyalty.progress * 100)}
          aria-label="Progresso para o próximo nível"
        >
          <div
            className="h-full rounded-[2px] bg-brand"
            style={{ width: `${loyalty.progress * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {loyalty.next
            ? `Faltam ${formatBRL(loyalty.toNext)} para o nível ${loyalty.next.label}.`
            : "Você está no nível máximo."}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-ink">
          <li>
            • Cashback com {loyalty.level.cashbackBonus > 0 ? "+" : ""}
            {loyalty.level.cashbackBonus} ponto(s) percentual a mais
          </li>
          <li>
            • Frete grátis em compras acima de{" "}
            {formatBRL(loyalty.level.freeShipAt)}
          </li>
        </ul>
      </section>

      <form onSubmit={onSubmit} className="card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Nome</span>
            <input
              className={`mt-1 ${field}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Nome"
            />
            {err("name")}
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">E-mail</span>
            <input
              type="email"
              className={`mt-1 ${field}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="E-mail"
            />
            {err("email")}
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Telefone</span>
            <input
              className={`mt-1 ${field}`}
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(11) 98765-4321"
              aria-label="Telefone"
            />
            {err("phone")}
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">CPF</span>
            <input
              className={`mt-1 ${field}`}
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              aria-label="CPF"
            />
            {err("cpf")}
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Data de nascimento
            </span>
            <input
              type="date"
              className={`mt-1 ${field}`}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              aria-label="Data de nascimento"
            />
            {err("birthdate")}
          </label>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            className="btn-brand rounded-[6px] px-5 py-2.5 text-sm font-bold"
          >
            Salvar alterações
          </button>
          {saved && (
            <span className="text-sm font-semibold text-ship">
              ✓ Perfil salvo
            </span>
          )}
        </div>
      </form>

      <section
        className="card mt-6 p-5 sm:p-6"
        aria-labelledby="minha-loja-titulo"
      >
        <h2 id="minha-loja-titulo" className="text-lg font-black text-ink">
          Minha loja
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Vincule sua conta a uma loja para usar o painel do vendedor em{" "}
          <span className="font-semibold text-brand">/vendedor</span>.
        </p>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-ink">
            Loja vinculada
          </span>
          <select
            className={`mt-1 ${field}`}
            value={user.sellerId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              setSeller(id === "" ? null : id);
              toast.success(
                id === ""
                  ? "Loja removida da conta."
                  : `Agora você vende como ${getSeller(id)?.name ?? "vendedor"}.`
              );
            }}
            aria-label="Loja vinculada à conta"
          >
            <option value="">Nenhuma loja</option>
            {SELLERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {user.sellerId ? (
          <p className="mt-3 text-sm font-semibold text-ship">
            ✓ Sua conta está vinculada a {getSeller(user.sellerId)?.name}.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Ao vincular uma loja, o painel do vendedor fica disponível.
          </p>
        )}
        {user.sellerId && (
          <Link
            to="/vendedor"
            className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
          >
            Abrir painel do vendedor →
          </Link>
        )}
      </section>

      {user.id && user.hasPassword ? (
        <form
          onSubmit={onPasswordSubmit}
          className="card mt-6 p-5 sm:p-6"
          noValidate
        >
          <h2 className="text-lg font-black text-ink">Alterar senha</h2>
          <p className="mt-1 text-sm text-ink-soft">
            A nova senha não pode ser igual à anterior.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Senha atual
              </span>
              <PasswordInput
                id="perfil-senha-atual"
                name="currentPassword"
                value={pwCurrent}
                onChange={setPwCurrent}
                autoComplete="current-password"
                placeholder="Sua senha atual"
                invalid={Boolean(pwErrors.current)}
                describedBy={pwErrors.current ? "erro-senha-atual" : undefined}
              />
              {pwErrors.current && (
                <p id="erro-senha-atual" className="mt-1 text-xs text-brand">
                  {pwErrors.current}
                </p>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Nova senha
              </span>
              <PasswordInput
                id="perfil-senha-nova"
                name="newPassword"
                value={pwNext}
                onChange={setPwNext}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                invalid={Boolean(pwErrors.next)}
                describedBy={pwErrors.next ? "erro-senha-nova" : undefined}
              />
              {pwErrors.next && (
                <p id="erro-senha-nova" className="mt-1 text-xs text-brand">
                  {pwErrors.next}
                </p>
              )}
              <PasswordStrength password={pwNext} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Confirmar nova senha
              </span>
              <PasswordInput
                id="perfil-senha-confirma"
                name="confirmPassword"
                value={pwConfirm}
                onChange={setPwConfirm}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                invalid={Boolean(pwErrors.confirm)}
                describedBy={
                  pwErrors.confirm ? "erro-senha-confirma" : undefined
                }
              />
              {pwErrors.confirm && (
                <p
                  id="erro-senha-confirma"
                  className="mt-1 text-xs text-brand"
                >
                  {pwErrors.confirm}
                </p>
              )}
            </label>
          </div>
          <button
            type="submit"
            disabled={pwBusy}
            className="btn-brand mt-4 rounded-[6px] px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {pwBusy ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      ) : user.id ? (
        <form
          onSubmit={onSetPasswordSubmit}
          className="card mt-6 p-5 sm:p-6"
          noValidate
        >
          <h2 className="text-lg font-black text-ink">Definir senha</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Sua conta veio do login antigo e ainda não tem senha. Defina uma
            agora para proteger seus dados.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Nova senha
              </span>
              <PasswordInput
                id="perfil-definir-senha"
                name="newPassword"
                value={pwNext}
                onChange={setPwNext}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                invalid={Boolean(pwErrors.next)}
                describedBy={pwErrors.next ? "erro-definir-senha" : undefined}
              />
              {pwErrors.next && (
                <p
                  id="erro-definir-senha"
                  className="mt-1 text-xs text-brand"
                >
                  {pwErrors.next}
                </p>
              )}
              <PasswordStrength password={pwNext} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">
                Confirmar nova senha
              </span>
              <PasswordInput
                id="perfil-definir-senha-confirma"
                name="confirmPassword"
                value={pwConfirm}
                onChange={setPwConfirm}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                invalid={Boolean(pwErrors.confirm)}
                describedBy={
                  pwErrors.confirm ? "erro-definir-confirma" : undefined
                }
              />
              {pwErrors.confirm && (
                <p
                  id="erro-definir-confirma"
                  className="mt-1 text-xs text-brand"
                >
                  {pwErrors.confirm}
                </p>
              )}
            </label>
          </div>
          <button
            type="submit"
            disabled={pwBusy}
            className="btn-brand mt-4 rounded-[6px] px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {pwBusy ? "Definindo..." : "Definir senha"}
          </button>
        </form>
      ) : (
        <div className="card mt-6 p-5">
          <p className="text-sm text-ink-soft">
            Esta conta ainda não tem senha cadastrada. Entre no fluxo de
            recuperação para definir uma.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
        <Link
          to="/preferencias"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Preferências de notificação →
        </Link>
        <Link
          to="/privacidade"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Privacidade e dados →
        </Link>
      </div>
    </div>
  );
}
