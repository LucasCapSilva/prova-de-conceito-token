import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTS } from "../data/products";
import SmartImage from "./SmartImage";
import Price from "./Price";
import { preloadPath } from "../lib/preload";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function Countdown() {
  const target = useMemo(() => {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return d.getTime();
  }, []);
  const now = useNow(1000);
  const remaining = Math.max(0, target - now);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  const cells = [
    { v: pad(h), l: "horas" },
    { v: pad(m), l: "min" },
    { v: pad(s), l: "seg" },
  ];
  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Ofertas terminam em ${h} horas, ${m} minutos e ${s} segundos`}
      className="flex items-center gap-1"
    >
      {cells.map((c, i) => (
        <span key={c.l} className="flex items-center gap-1">
          <span className="grid min-w-9 place-items-center rounded bg-ink px-1.5 py-1 text-sm font-bold tabular-nums text-white">
            {c.v}
          </span>
          {i < cells.length - 1 && (
            <span className="text-sm font-bold text-ink-soft" aria-hidden>
              :
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function FlashSale() {
  const deals = useMemo(() => PRODUCTS.filter((p) => p.oldPrice).slice(0, 8), []);
  const rowRef = useRef<HTMLDivElement>(null);

  if (deals.length === 0) return null;

  const scroll = (dir: number) => {
    rowRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-r from-brand-soft to-white p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl" aria-hidden>
              ⚡
            </span>
            <div>
              <h2 className="text-lg font-black text-ink sm:text-xl">
                Ofertas relâmpago
              </h2>
              <p className="text-xs text-ink-soft">Descontos por tempo limitado</p>
            </div>
            <Countdown />
          </div>
          <Link
            to="/produtos"
            className="text-sm font-semibold text-brand hover:underline"
          >
            Ver tudo →
          </Link>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Rolar ofertas para a esquerda"
            className="absolute left-1 top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/95 text-lg text-ink shadow-sm backdrop-blur transition hover:border-brand hover:text-brand lg:grid"
          >
            ‹
          </button>
          <div
            ref={rowRef}
            className="flex snap-x gap-3 overflow-x-auto pb-2"
          >
            {deals.map((p) => {
              const old = p.oldPrice ?? p.price;
              const off = Math.round((1 - p.price / old) * 100);
              return (
                <Link
                  key={p.id}
                  to={`/produto/${p.id}`}
                  onMouseEnter={() => preloadPath(`/produto/${p.id}`)}
                  className="w-40 shrink-0 snap-start sm:w-44"
                >
                  <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
                    <SmartImage
                      src={p.image}
                      alt={p.name}
                      className="aspect-square w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded bg-brand px-1.5 py-0.5 text-[11px] font-bold text-white">
                      -{off}%
                    </span>
                  </div>
                  <p className="mt-2 truncate text-xs text-ink-soft">{p.name}</p>
                  <Price className="mt-1" price={p.price} oldPrice={old} size="sm" />
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Rolar ofertas para a direita"
            className="absolute right-1 top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/95 text-lg text-ink shadow-sm backdrop-blur transition hover:border-brand hover:text-brand lg:grid"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
