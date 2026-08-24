import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <div className="card mx-auto grid max-w-lg place-items-center gap-4 rounded-lg p-12 text-center">
        <span className="text-7xl font-black tracking-tight text-brand">404</span>
        <h1 className="text-xl font-black text-ink">
          Ops, essa página não existe
        </h1>
        <p className="max-w-sm text-sm text-ink-soft">
          O endereço que você tentou acessar não está disponível ou foi
          movido. Que tal voltar para a loja?
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-brand rounded-[6px] px-5 py-2.5 text-sm font-bold"
          >
            Ir para a home
          </Link>
          <Link
            to="/produtos"
            className="rounded-[6px] border border-line bg-surface px-5 py-2.5 text-sm font-bold text-ink transition hover:border-brand"
          >
            Ver produtos
          </Link>
        </div>
      </div>
    </div>
  );
}
