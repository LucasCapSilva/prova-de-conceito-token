import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import SellerGate from "../components/SellerGate";
import { getProduct, PRODUCTS } from "../data/products";
import {
  answerQuestion,
  getQuestions,
  type ProductQuestion,
} from "../lib/questions";
import { formatDate } from "../lib/format";

const productById = new Map(PRODUCTS.map((p) => [p.id, p]));

export default function SellerQuestions() {
  const { user } = useAuth();
  const seller = user?.sellerId ? getSeller(user.sellerId) : undefined;
  const [, setTick] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mine: ProductQuestion[] = seller
    ? getQuestions()
        .filter(
          (q) =>
            (productById.get(q.productId)?.sellerId ?? q.productId) ===
            seller.id,
        )
        .sort((a, b) => {
          const aOpen = a.answer ? 1 : 0;
          const bOpen = b.answer ? 1 : 0;
          if (aOpen !== bOpen) return aOpen - bOpen;
          return b.createdAt.localeCompare(a.createdAt);
        })
    : [];

  const openCount = mine.filter((q) => !q.answer).length;

  if (!user?.sellerId || !seller) {
    return (
      <SellerGate
        icon="🏪"
        title="Responder perguntas"
        description="Responda às perguntas dos clientes sobre os produtos da sua loja."
      />
    );
  }

  const answer = (q: ProductQuestion) => {
    const text = (drafts[q.id] ?? "").trim();
    if (!text) return;
    answerQuestion(q.id, text, seller.name);
    setDrafts((d) => {
      const next = { ...d };
      delete next[q.id];
      return next;
    });
    setTick((t) => t + 1);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">
          Painel do vendedor
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Perguntas
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {mine.length} pergunta(s) sobre produtos de {seller.name}
          {openCount > 0
            ? ` · ${openCount} aguardando resposta`
            : " · tudo respondido"}
        </p>
        <nav className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/vendedor"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Painel
          </Link>
          <Link
            to="/vendedor/produtos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Meus produtos
          </Link>
          <Link
            to="/vendedor/pedidos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Pedidos
          </Link>
        </nav>
      </header>

      {mine.length === 0 ? (
        <div className="card grid place-items-center gap-2 rounded-lg p-10 text-center">
          <span className="text-3xl" aria-hidden>
            💬
          </span>
          <p className="text-sm text-ink-soft">
            Ninguém fez perguntas sobre seus produtos ainda. As perguntas
            enviadas na página de cada produto aparecem aqui para você
            responder.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {mine.map((q) => {
            const product = getProduct(q.productId);
            return (
              <li key={q.id} className="card rounded-lg p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {q.question}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {q.author} · {formatDate(q.createdAt)}
                      {product ? (
                        <>
                          {" · "}
                          <Link
                            to={`/produto/${product.id}`}
                            className="text-brand hover:underline"
                          >
                            {product.name}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {q.answer ? (
                    <span className="shrink-0 rounded-[3px] bg-ship/15 px-2 py-0.5 text-[11px] font-bold text-ship">
                      Respondida
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-[3px] bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                      Aguardando
                    </span>
                  )}
                </div>

                {q.answer ? (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="text-sm text-ink">
                      <span className="font-semibold text-ship">
                        {q.answeredBy ?? "Vendedor"}:
                      </span>{" "}
                      {q.answer}
                    </p>
                  </div>
                ) : (
                  <form
                    className="mt-3 border-t border-line pt-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      answer(q);
                    }}
                  >
                    <textarea
                      value={drafts[q.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [q.id]: e.target.value }))
                      }
                      rows={2}
                      placeholder="Escreva sua resposta para o cliente..."
                      className="w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                    />
                    <button
                      type="submit"
                      disabled={!(drafts[q.id] ?? "").trim()}
                      className="btn-brand mt-2 rounded-[6px] px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                    >
                      Enviar resposta
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
