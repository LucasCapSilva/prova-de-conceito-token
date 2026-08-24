import { useState } from "react";
import type { Product } from "../data/products";
import {
  addQuestion,
  questionsForProduct,
  type ProductQuestion,
} from "../lib/questions";

interface QA {
  id: number;
  question: string;
  answer: string;
  author: string;
}

const SEED: QA[] = [
  {
    id: 1,
    question: "Este produto acompanha nota fiscal e garantia?",
    answer: "Sim, enviamos nota fiscal eletrônica e a garantia é de 12 meses.",
    author: "Vendedor",
  },
  {
    id: 2,
    question: "O prazo de entrega é para todo o Brasil?",
    answer:
      "Sim, o prazo varia entre 2 e 12 dias úteis conforme a sua região.",
    author: "Vendedor",
  },
  {
    id: 3,
    question: "Posso trocar se não ficar satisfeito?",
    answer:
      "Pode! Você tem 30 dias corridos após o recebimento para solicitar a troca.",
    author: "Vendedor",
  },
];

export default function Questions({ product }: { product: Product }) {
  const [items, setItems] = useState<ProductQuestion[]>(() =>
    questionsForProduct(product.id),
  );
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    const q = text.trim();
    if (!q) return;
    setItems((prev) => [addQuestion(product.id, q), ...prev]);
    setText("");
    setSent(true);
  };

  return (
    <section className="card mt-10 rounded-lg p-5">
      <h2 className="text-lg font-bold text-ink">
        Perguntas sobre {product.name}
      </h2>

      {items.length > 0 && (
        <ul className="mt-4 space-y-4">
          {items.map((qa) => (
            <li key={qa.id} className="border-b border-line pb-4 last:border-0">
              <p className="text-sm font-semibold text-ink">
                <span className="text-brand">P:</span> {qa.question}
              </p>
              <p className="mt-2 text-sm text-ink">
                <span className="font-semibold text-ship">
                  {qa.answeredAt ? "Vendedor" : "Aguardando"}:
                </span>{" "}
                {qa.answer ??
                  "Sua pergunta foi enviada e será respondida em breve."}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-5 text-sm font-bold text-ink">
        Perguntas frequentes do vendedor
      </h3>
      <ul className="mt-3 space-y-4">
        {SEED.map((qa) => (
          <li key={qa.id} className="border-b border-line pb-4 last:border-0">
            <p className="text-sm font-semibold text-ink">
              <span className="text-brand">P:</span> {qa.question}
            </p>
            <p className="mt-2 text-sm text-ink">
              <span className="font-semibold text-ship">{qa.author}:</span>{" "}
              {qa.answer}
            </p>
          </li>
        ))}
      </ul>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label
          htmlFor="pergunta"
          className="mb-1 block text-sm font-medium text-ink"
        >
          Envie uma pergunta sobre este produto
        </label>
        <div className="flex gap-2">
          <input
            id="pergunta"
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSent(false);
            }}
            placeholder="Escreva sua pergunta..."
            className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="btn-brand rounded px-4 py-2 text-sm font-semibold"
          >
            Enviar
          </button>
        </div>
        {sent && (
          <p role="status" className="mt-2 text-xs text-ship">
            Pergunta enviada! O vendedor responderá em breve.
          </p>
        )}
      </form>
    </section>
  );
}
