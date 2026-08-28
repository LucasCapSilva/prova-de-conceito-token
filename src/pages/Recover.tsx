import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import PasswordStrength, { evaluatePassword } from "../components/PasswordStrength";
import {
  completeRecovery,
  confirmRecoveryCode,
  getRecovery,
  issueRecovery,
  type RecoveryTicket,
} from "../lib/recovery";

type Step = "email" | "code" | "password" | "done";

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function Recover() {
  const [ticket, setTicket] = useState<RecoveryTicket | null>(() => getRecovery());
  const [step, setStep] = useState<Step>(ticket ? "code" : "email");
  const [email, setEmail] = useState(ticket ? ticket.email : "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (step !== "code" || !ticket) return;
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [step, ticket]);

  const remainingMs = ticket ? ticket.expiresAt - Date.now() : 0;
  const expired = step === "code" && !!ticket && remainingMs <= 0;

  const onSubmitEmail = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = email.trim();
    if (!normalized) {
      setError("Informe o e-mail da sua conta.");
      return;
    }
    setBusy(true);
    setError(null);
    const t = issueRecovery(normalized);
    setBusy(false);
    if (!t) {
      setError("Nenhuma conta encontrada com este e-mail.");
      return;
    }
    setTicket(t);
    setEmail(t.email);
    setCode("");
    setStep("code");
  };

  const onSubmitCode = (e: FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    if (!confirmRecoveryCode(email, code)) {
      setError("Código inválido. Confira os 6 dígitos exibidos acima.");
      return;
    }
    setError(null);
    setStep("password");
  };

  const reissue = () => {
    const t = issueRecovery(email);
    if (!t) return;
    setTicket(t);
    setCode("");
    setError(null);
  };

  const onSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (password.length === 0) {
      errors.password = "Informe a nova senha.";
    } else if (evaluatePassword(password).level === "fraca") {
      errors.password = "Escolha uma senha mais forte — complete as regras abaixo.";
    }
    if (confirm !== password) {
      errors.confirm = "As senhas não conferem.";
    }
    setFieldErrors(errors);
    setError(null);
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    try {
      await completeRecovery(email, password);
      setStep("done");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível redefinir a senha."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-32 pb-12 sm:pt-28">
      <div className="card rounded-lg p-6">
        {step === "email" && (
          <>
            <h1 className="text-xl font-black text-ink">Recuperar senha</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Informe o e-mail da sua conta para receber o código de
              recuperação.
            </p>
            <form onSubmit={onSubmitEmail} noValidate className="mt-5 space-y-4">
              {error && (
                <p
                  id="recup-erro"
                  role="alert"
                  className="rounded-md border border-[#D93026] bg-[#FDF2F1] px-3 py-2 text-xs font-semibold text-[#D93026]"
                >
                  {error}
                </p>
              )}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">
                  E-mail
                </span>
                <input
                  type="email"
                  id="recup-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  autoComplete="email"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "recup-erro" : undefined}
                  className="h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="btn-brand w-full rounded-[6px] px-4 py-2.5 text-sm font-bold disabled:opacity-60"
              >
                {busy ? "Enviando..." : "Gerar código"}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-ink-soft">
              Lembrou a senha?{" "}
              <Link to="/entrar" className="font-bold text-brand hover:underline">
                Entrar
              </Link>
            </p>
          </>
        )}

        {step === "code" && ticket && (
          <>
            <h1 className="text-xl font-black text-ink">Confira o código</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Enviamos um código de 6 dígitos para{" "}
              <span className="font-semibold text-ink">{ticket.email}</span>.
            </p>
            <div className="mt-4 rounded-md border border-[#0F6CBD] bg-[#EFF6FF] px-3 py-2 text-xs text-[#0F6CBD]">
              <span className="font-bold">Simulação:</span> como esta loja não
              envia e-mails de verdade, o código aparece aqui mesmo, na tela. Em
              um site real, ele chegaria no seu e-mail.
            </div>
            <div className="mt-4 rounded-md border border-line bg-page px-4 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                Seu código
              </p>
              <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-ink">
                {ticket.code}
              </p>
            </div>
            {!expired ? (
              <p className="mt-3 text-center text-xs text-ink-soft">
                O código expira em{" "}
                <span className="font-bold tabular-nums text-ink">
                  {formatCountdown(remainingMs)}
                </span>
                .
              </p>
            ) : (
              <p
                role="alert"
                className="mt-3 rounded-md border border-[#D93026] bg-[#FDF2F1] px-3 py-2 text-center text-xs font-semibold text-[#D93026]"
              >
                O código expirou.
              </p>
            )}
            {expired ? (
              <button
                type="button"
                onClick={reissue}
                className="btn-brand mt-4 w-full rounded-[6px] px-4 py-2.5 text-sm font-bold"
              >
                Gerar novo código
              </button>
            ) : (
              <form onSubmit={onSubmitCode} noValidate className="mt-5 space-y-4">
                {error && (
                  <p
                    id="recup-erro"
                    role="alert"
                    className="rounded-md border border-[#D93026] bg-[#FDF2F1] px-3 py-2 text-xs font-semibold text-[#D93026]"
                  >
                    {error}
                  </p>
                )}
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink">
                    Código de 6 dígitos
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    id="recup-code"
                    name="code"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    autoComplete="one-time-code"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "recup-erro" : undefined}
                    className="h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-center font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-brand"
                  />
                </label>
                <button
                  type="submit"
                  disabled={code.length < 6}
                  className="btn-brand w-full rounded-[6px] px-4 py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  Confirmar código
                </button>
              </form>
            )}
            <p className="mt-4 text-center text-xs text-ink-soft">
              Errou o e-mail?{" "}
              <button
                type="button"
                onClick={() => {
                  setTicket(null);
                  setStep("email");
                  setError(null);
                }}
                className="font-bold text-brand hover:underline"
              >
                Voltar
              </button>
            </p>
          </>
        )}

        {step === "password" && (
          <>
            <h1 className="text-xl font-black text-ink">Nova senha</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Defina uma nova senha para{" "}
              <span className="font-semibold text-ink">{email}</span>.
            </p>
            <form onSubmit={onSubmitPassword} noValidate className="mt-5 space-y-4">
              {error && (
                <p
                  id="recup-erro"
                  role="alert"
                  className="rounded-md border border-[#D93026] bg-[#FDF2F1] px-3 py-2 text-xs font-semibold text-[#D93026]"
                >
                  {error}
                </p>
              )}
              <div>
                <span className="mb-1 block text-xs font-semibold text-ink">
                  Nova senha
                </span>
                <PasswordInput
                  id="recup-password"
                  name="new-password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  invalid={Boolean(fieldErrors.password)}
                  describedBy={fieldErrors.password ? "recup-erro-pw" : undefined}
                />
                {fieldErrors.password && (
                  <p id="recup-erro-pw" className="mt-1 text-xs font-semibold text-[#D93026]">
                    {fieldErrors.password}
                  </p>
                )}
                <PasswordStrength password={password} />
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold text-ink">
                  Confirmar nova senha
                </span>
                <PasswordInput
                  id="recup-confirm"
                  name="new-password-confirm"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  invalid={Boolean(fieldErrors.confirm)}
                  describedBy={fieldErrors.confirm ? "recup-erro-confirm" : undefined}
                />
                {fieldErrors.confirm && (
                  <p id="recup-erro-confirm" className="mt-1 text-xs font-semibold text-[#D93026]">
                    {fieldErrors.confirm}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={busy}
                className="btn-brand w-full rounded-[6px] px-4 py-2.5 text-sm font-bold disabled:opacity-60"
              >
                {busy ? "Salvando..." : "Redefinir senha"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <span className="text-4xl">✅</span>
            <h1 className="mt-3 text-xl font-black text-ink">
              Senha redefinida
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Sua nova senha está salva. Entre com ela para continuar.
            </p>
            <Link
              to="/entrar"
              className="btn-brand mt-5 inline-block rounded-[6px] px-6 py-2.5 text-sm font-bold"
            >
              Entrar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
