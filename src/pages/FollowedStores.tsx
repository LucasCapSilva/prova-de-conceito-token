import { useState } from "react";
import { Link } from "react-router-dom";
import { getSeller } from "../data/sellers";
import {
  followerCount,
  getFollows,
  unfollowSeller,
} from "../lib/follows";
import { formatCompact } from "../lib/format";
import SmartImage from "../components/SmartImage";
import EmptyState from "../components/EmptyState";

export default function FollowedStores() {
  const [follows, setFollows] = useState<string[]>(() => getFollows());

  const unfollow = (id: string) => {
    unfollowSeller(id);
    setFollows(getFollows());
  };

  const stores = follows
    .map((id) => getSeller(id))
    .filter((s): s is NonNullable<ReturnType<typeof getSeller>> => Boolean(s));

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">Minha conta</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Lojas seguidas
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {stores.length === 0
            ? "Você ainda não segue nenhuma loja."
            : `${stores.length} loja(s) no seu acompanhamento`}
        </p>
      </header>

      {stores.length === 0 ? (
        <EmptyState
          icon="store"
          title="Nenhuma loja seguida"
          message="Siga lojas dos produtos que você gosta para acompanhar novidades e ofertas aqui."
          cta={{ to: "/produtos", label: "Ver catálogo" }}
        />
      ) : (
        <ul className="space-y-3">
          {stores.map((s) => (
            <li key={s.id} className="card rounded-lg p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SmartImage
                  src={s.logo}
                  alt={s.name}
                  width={200}
                  height={200}
                  className="size-14 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{s.name}</p>
                    {s.isOfficial && (
                      <span className="rounded-sm bg-ship/15 px-1.5 py-0.5 text-[11px] font-semibold text-ship">
                        Oficial
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    <span className="text-star">★</span> {s.rating.toFixed(1)} ·{" "}
                    {formatCompact(followerCount(s.id))} seguidores ·{" "}
                    {formatCompact(s.sales)} vendas
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/loja/${s.id}`}
                    className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                  >
                    Ver loja
                  </Link>
                  <button
                    type="button"
                    onClick={() => unfollow(s.id)}
                    className="rounded-[6px] border border-brand bg-white px-3 py-1.5 text-xs font-bold text-brand transition hover:border-brand-dark hover:text-brand-dark"
                  >
                    Deixar de seguir
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
