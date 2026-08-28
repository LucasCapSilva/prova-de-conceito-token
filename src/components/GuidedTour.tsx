import { useEffect, useMemo, useRef, useState } from "react";
import { read, write } from "../lib/storage";

interface TourStep {
  target: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: "busca",
    title: "Busca",
    body: "Procure produtos, marcas e categorias. Dica: pressione / em qualquer tela para focar a busca.",
  },
  {
    target: "categorias",
    title: "Categorias",
    body: "Use o menu de Categorias para navegar pelo catálogo e pelas marcas.",
  },
  {
    target: "carrinho",
    title: "Carrinho",
    body: "Aqui ficam os itens escolhidos. Toque para ver o total e finalizar a compra.",
  },
  {
    target: "favoritos",
    title: "Favoritos",
    body: "Adicione itens aos favoritos e organize suas listas em Favoritos.",
  },
  {
    target: "conta",
    title: "Sua conta",
    body: "Entre ou crie uma conta para acompanhar pedidos, endereços e preferências.",
  },
];

const CARD_W = 340;

function findRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return rect;
}

export default function GuidedTour() {
  const [active, setActive] = useState(() => !read("tourSeen", false));
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(() =>
    active ? findRect(STEPS[0].target) : null
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];

  const finish = () => {
    write("tourSeen", true);
    setActive(false);
  };

  useEffect(() => {
    if (!active) return;
    setRect(findRect(current.target));
  }, [active, current.target, step]);

  useEffect(() => {
    if (!active) return;
    const update = () => setRect(findRect(STEPS[step].target));
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    cardRef.current?.focus();
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (step < STEPS.length - 1) setStep((s) => s + 1);
        else finish();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (step > 0) setStep((s) => s - 1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step]);

  const layout = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = Math.min(CARD_W, vw - 24);
    if (!rect) {
      return {
        cardW,
        card: {
          left: (vw - cardW) / 2,
          top: Math.max(16, vh / 2 - 110),
          bottom: undefined as number | undefined,
        },
        spot: null,
      };
    }
    const below = rect.bottom + 12 + 240 <= vh;
    const card = below
      ? {
          left: Math.min(Math.max(12, rect.left), vw - cardW - 12),
          top: rect.bottom + 12,
          bottom: undefined as number | undefined,
        }
      : {
          left: Math.min(Math.max(12, rect.left), vw - cardW - 12),
          top: undefined as number | undefined,
          bottom: vh - rect.top + 12,
        };
    return { cardW, card, spot: rect };
  }, [rect]);

  if (!active) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Tour guiado pela loja">
      <div aria-hidden="true" className="fixed inset-0 z-[90]" />
      {layout.spot && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[99] rounded-[4px] transition-all duration-200"
          style={{
            left: layout.spot.left - 6,
            top: layout.spot.top - 6,
            width: layout.spot.width + 12,
            height: layout.spot.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      )}
      <div
        ref={cardRef}
        tabIndex={-1}
        className="card fixed z-[100] focus:outline-none"
        style={{
          left: layout.card.left,
          top: layout.card.top,
          bottom: layout.card.bottom,
          width: layout.cardW,
        }}
      >
        <p className="text-xs font-semibold text-ink-soft">
          Passo {step + 1} de {STEPS.length}
        </p>
        <h2 className="mt-1 text-base font-bold text-ink">{current.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          {current.body}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-[4px] border border-line px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn-brand rounded-[4px] px-3 py-2 text-sm font-semibold"
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="btn-brand rounded-[4px] px-3 py-2 text-sm font-semibold"
            >
              Concluir
            </button>
          )}
          <button
            type="button"
            onClick={finish}
            className="ml-auto text-xs font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Pular tour
          </button>
        </div>
      </div>
    </div>
  );
}
