import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authCore";
import PasswordStrength, { evaluatePassword } from "../components/PasswordStrength";
import PasswordInput from "../components/PasswordInput";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(name: string, email: string, password: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {};
  if (name.trim().length < 2) errors.name = "Informe seu nome.";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Informe um e-mail válido.";
  if (password.length === 0) {
    errors.password = "Informe uma senha.";
  } else if (evaluatePassword(password).level === "fraca") {
    errors.password =
      "Escolha uma senha mais forte — complete as regras abaixo.";
  }
  if (confirm.length === 0 || confirm !== password) {
    errors.confirm = "As senhas não conferem.";
  }
  return errors;
}

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 pt-32 pb-12 sm:pt-28">
        <div className="card rounded-lg p-6 text-center">
          <span className="text-4xl">✅</span>
          <h1 className="mt-3 text-xl font-black text-ink">
            Você já tem uma conta
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Conectado como <span className="font-semibold text-ink">{user.email}</span>.
          </p>
          <Link
            to="/perfil"
            className="mt-5 inline-block rounded-[6px] border border-line bg-surface px-4 py-2 text-sm font-bold text-ink transition hover:border-brand"
          >
            Ir para meu perfil
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate(name, email, password, confirm);
    setErrors(next);
    setServerError(null);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    try {
      const result = await register(name.trim(), email.trim(), password);
      if (!result.ok) {
        setServerError(result.error ?? "Não foi possível criar a conta.");
        setBusy(false);
        return;
      }
      const from = (location.state as { from?: string } | null)?.from;
      if (typeof from === "string" && from.length > 0) {
        navigate(from, { replace: true });
      } else {
        const idx = window.history.state?.idx as number | undefined;
        if (typeof idx === "number" && idx > 0) {
          navigate(-1);
        } else {
          navigate("/", { replace: true });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `h-10 w-full rounded-[6px] border bg-surface px-3 text-sm text-ink outline-none focus:border-brand ${
      hasError ? "border-[#D93026]" : "border-line"
    }`;

  return (
    <div className="mx-auto max-w-md px-4 pt-32 pb-12 sm:pt-28">
      <div className="card rounded-lg p-6">
        <h1 className="text-xl font-black text-ink">Criar conta</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Crie sua conta para salvar favoritos, acompanhar pedidos e usar
          cupons.
        </p>
        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              Nome
            </span>
            <input
              type="text"
              id="registro-nome"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "erro-nome" : undefined}
              className={inputClass(Boolean(errors.name))}
            />
            {errors.name && (
              <span id="erro-nome" role="alert" className="mt-1 block text-xs font-semibold text-[#D93026]">
                {errors.name}
              </span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              E-mail
            </span>
            <input
              type="email"
              id="registro-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "erro-email" : undefined}
              className={inputClass(Boolean(errors.email))}
            />
            {errors.email && (
              <span id="erro-email" role="alert" className="mt-1 block text-xs font-semibold text-[#D93026]">
                {errors.email}
              </span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              Senha
            </span>
            <PasswordInput
              id="registro-senha"
              name="password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
              describedBy={errors.password ? "erro-senha" : undefined}
            />
            {errors.password && (
              <span id="erro-senha" role="alert" className="mt-1 block text-xs font-semibold text-[#D93026]">
                {errors.password}
              </span>
            )}
            <PasswordStrength password={password} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">
              Confirmar senha
            </span>
            <PasswordInput
              id="registro-senha2"
              name="passwordConfirm"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repita a senha"
              autoComplete="new-password"
              invalid={Boolean(errors.confirm)}
              describedBy={errors.confirm ? "erro-senha2" : undefined}
            />
            {errors.confirm && (
              <span id="erro-senha2" role="alert" className="mt-1 block text-xs font-semibold text-[#D93026]">
                {errors.confirm}
              </span>
            )}
          </label>
          {serverError && (
            <p
              role="alert"
              className="rounded-[6px] border border-[#D93026]/30 bg-[#D93026]/5 px-3 py-2 text-xs font-semibold text-[#D93026]"
            >
              {serverError}{" "}
              <Link to="/entrar" className="underline">
                Entrar com essa conta
              </Link>
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-brand w-full rounded-[6px] px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {busy ? "Criando conta…" : "Criar conta"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-soft">
          Já tem conta?{" "}
          <Link to="/entrar" className="font-bold text-brand hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
