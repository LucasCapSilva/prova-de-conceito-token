import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/produtos", label: "Produtos" },
  { to: "/carrinho", label: "Carrinho" },
  { to: "/sobre", label: "Sobre" },
];

const CATS = [
  { to: "/produtos?cat=audio", label: "Áudio" },
  { to: "/produtos?cat=mobile", label: "Mobile" },
  { to: "/produtos?cat=gamer", label: "Gamer" },
  { to: "/produtos?cat=casa", label: "Casa Smart" },
];

function Col({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">{children}</ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-md bg-brand text-white">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 7h12l-1 13H7L6 7z" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              </svg>
            </span>
            <span className="text-lg font-bold text-brand">electronica</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            Tudo em eletrônicos com preços que inspiram. A loja que conecta você
            ao próximo dispositivo, um pedido de cada vez.
          </p>
        </div>

        <Col title="Navegação">
          {NAV.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="transition-colors hover:text-brand">
                {l.label}
              </Link>
            </li>
          ))}
        </Col>

        <Col title="Categorias">
          {CATS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="transition-colors hover:text-brand">
                {l.label}
              </Link>
            </li>
          ))}
        </Col>

        <Col title="Ajuda">
          <li>
            <Link to="/ajuda" className="transition-colors hover:text-brand">
              Central de Ajuda
            </Link>
          </li>
          <li>contato@electronica.com.br</li>
          <li>0800 000 1234</li>
          <li>Seg–Sex · 9h às 18h</li>
        </Col>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} electronica. Loja demonstrativa — imagens meramente ilustrativas.
      </div>
    </footer>
  );
}
