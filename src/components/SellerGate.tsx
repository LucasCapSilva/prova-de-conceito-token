import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";

export default function SellerGate({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const { user } = useAuth();
  const seller = user?.sellerId ? getSeller(user.sellerId) : undefined;

  if (user?.sellerId && seller) return null;

  const hasAccount = Boolean(user);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
        <span className="text-4xl" aria-hidden>
          {icon}
        </span>
        <h1 className="text-lg font-black text-ink">{title}</h1>
        <p className="max-w-sm text-sm text-ink-soft">{description}</p>
        {hasAccount ? (
          <>
            <p className="text-sm font-semibold text-ink">
              Sua conta ainda não tem uma loja vinculada.
            </p>
            <Link
              to="/perfil"
              className="btn-brand mt-1 rounded-[6px] px-4 py-2 text-sm font-bold"
            >
              Definir minha loja no perfil
            </Link>
          </>
        ) : (
          <Link
            to="/entrar"
            className="btn-brand mt-1 rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            Entrar
          </Link>
        )}
      </div>
    </div>
  );
}
