import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export type Banner = {
  id: string;
  tone: "brand" | "dark" | "teal";
  tag: string;
  title: string;
  text?: string;
  cta: string;
  to: string;
  emoji: string;
};

const TONES: Record<Banner["tone"], string> = {
  brand: "bg-gradient-to-r from-brand to-[#ff6b3d]",
  dark: "bg-ink",
  teal: "bg-gradient-to-r from-ship to-[#00a88f]",
};

const AUTO_MS = 5000;

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % banners.length),
      AUTO_MS
    );
    return () => window.clearInterval(id);
  }, [paused, banners.length]);

  function go(i: number) {
    setIndex((i + banners.length) % banners.length);
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live="polite"
      >
        {banners.map((b) => (
          <Link
            key={b.id}
            to={b.to}
            aria-hidden={banners[index].id !== b.id}
            tabIndex={banners[index].id === b.id ? 0 : -1}
            className={`relative flex min-w-full items-center justify-between p-7 text-white sm:p-10 lg:p-12 ${TONES[b.tone]}`}
          >
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                {b.tag}
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-4xl">
                {b.title}
              </h2>
              {b.text && (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                  {b.text}
                </p>
              )}
              <span className="mt-5 inline-flex items-center gap-1 rounded-md bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:opacity-90">
                {b.cta} <span aria-hidden>→</span>
              </span>
            </div>
            <span className="hidden text-6xl sm:block lg:text-7xl" aria-hidden>
              {b.emoji}
            </span>
          </Link>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Banner anterior"
            className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-lg font-black text-ink transition hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Próximo banner"
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-lg font-black text-ink transition hover:bg-white"
          >
            ›
          </button>
          <div
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"
            role="tablist"
            aria-label="Indicadores do carrossel"
          >
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir para o banner ${i + 1}: ${b.tag}`}
                aria-selected={i === index}
                role="tab"
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
