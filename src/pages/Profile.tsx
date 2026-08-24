import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { cpfValid, maskCPF, maskPhone } from "../lib/masks";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [cpf, setCpf] = useState(user?.cpf ?? "");
  const [birthdate, setBirthdate] = useState(user?.birthdate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

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

      <Link
        to="/preferencias"
        className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
      >
        Preferências de notificação →
      </Link>
    </div>
  );
}
