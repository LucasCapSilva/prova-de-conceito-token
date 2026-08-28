import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { read, write } from "../lib/storage";

const HINT_KEY = "pwHint";

function dismissedIds(): string[] {
  const raw = read<unknown>(HINT_KEY, []);
  return Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string")
    : [];
}

export default function PasswordSetupBanner() {
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);

  if (!user?.id || user.hasPassword || hidden) return null;
  if (dismissedIds().includes(user.id)) return null;

  const dismiss = () => {
    const next = [...new Set([...dismissedIds(), user.id])];
    write(HINT_KEY, next);
    setHidden(true);
  };

  return (
    <div
      role="region"
      aria-label="Aviso para definir senha"
      className="fixed left-0 right-0 top-[118px] z-40 border-b border-line bg-brand-soft sm:top-[96px]"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <p className="flex-1 text-sm font-semibold text-ink">
          Sua conta veio do login antigo e ainda não tem senha.{" "}
          <Link
            to="/perfil"
            className="font-bold text-brand hover:underline"
          >
            Defina uma agora
          </Link>{" "}
          para proteger seus dados.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar aviso de senha"
          className="shrink-0 rounded-[4px] p-2 text-ink-soft transition-colors hover:bg-brand/10 hover:text-ink"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
