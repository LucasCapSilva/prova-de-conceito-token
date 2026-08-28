import { useState } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS, CATEGORIES } from "../data/products";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import RecentlyViewed from "../components/RecentlyViewed";
import FlashSale from "../components/FlashSale";
import BannerCarousel, { type Banner } from "../components/BannerCarousel";
import PersonalizedPicks from "../components/PersonalizedPicks";
import { useCart, cartIsAbandoned } from "../context/cartCore";
import { formatBRL } from "../lib/format";

const BANNERS: Banner[] = [
  {
    id: "campanha",
    tone: "brand",
    tag: "Campanha de temporada",
    title: "Até 40% OFF em eletrônicos selecionados",
    text: "Fones, smartwatches, gamer e casa smart com frete grátis e parcelamento em até 12x sem juros.",
    cta: "Ver ofertas",
    to: "/produtos",
    emoji: "⚡",
  },
  {
    id: "gamer",
    tone: "dark",
    tag: "Gamer",
    title: "Setup completo com até 30% OFF",
    text: "Teclados, mouses, cadeiras e periféricos para o seu battle station.",
    cta: "Ver gamer",
    to: "/produtos?cat=gamer",
    emoji: "🎮",
  },
  {
    id: "casa",
    tone: "teal",
    tag: "Casa Smart",
    title: "Sua casa conectada a partir de R$ 89",
    text: "Luzes, tomadas e assistentes com descontos em destaques.",
    cta: "Explorar casa",
    to: "/produtos?cat=casa",
    emoji: "🏠",
  },
  {
    id: "novo",
    tone: "brand",
    tag: "Lançamentos",
    title: "Novidades em áudio e wearables",
    text: "Os lançamentos da semana com cupom extra para quem é do app.",
    cta: "Ver novidades",
    to: "/produtos",
    emoji: "🎧",
  },
];

const CAT_EMOJI: Record<string, string> = {
  audio: "🎧",
  mobile: "📱",
  computadores: "💻",
  wearables: "⌚",
  gamer: "🎮",
  casa: "🏠",
};

type PromoTone = "brand" | "dark" | "teal";

function Promo({
  tone,
  tag,
  title,
  cta,
  to,
  emoji,
  className = "",
}: {
  tone: PromoTone;
  tag: string;
  title: string;
  cta: string;
  to: string;
  emoji: string;
  className?: string;
}) {
  const tones: Record<PromoTone, string> = {
    brand: "bg-gradient-to-br from-brand to-[#c2551e]",
    dark: "bg-ink",
    teal: "bg-gradient-to-br from-ship to-[#005f4e]",
  };
  return (
    <Link
      to={to}
      className={`group relative flex items-center justify-between overflow-hidden rounded-xl p-5 text-white sm:p-6 ${tones[tone]} ${className}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{tag}</p>
        <h3 className="mt-1 text-lg font-bold leading-snug sm:text-xl">{title}</h3>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2">
          {cta} <span aria-hidden>→</span>
        </span>
      </div>
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
    </Link>
  );
}

export default function Home() {
  const { items, count, subtotal } = useCart();
  const [enteredAt] = useState(() => Date.now());
  const abandoned = cartIsAbandoned(items, enteredAt);
  const featured = PRODUCTS.slice(0, 8);
  const cats = CATEGORIES.filter((c) => c.key !== "todos");

  return (
    <div>
      {/* HERO BANNERS */}
      <section className="mx-auto max-w-7xl px-4 pt-32 sm:px-6 sm:pt-28">
        {abandoned && (
          <div
            role="status"
            className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-brand/30 bg-brand-soft px-4 py-2.5 text-sm text-ink"
          >
            <span>
              Você deixou {count} {count === 1 ? "item" : "itens"} no carrinho
              há mais de um dia ({formatBRL(subtotal)}).
            </span>
            <Link
              to="/carrinho"
              className="shrink-0 font-semibold text-brand hover:underline"
            >
              Revisar carrinho →
            </Link>
          </div>
        )}
        <Reveal y={20}>
          <BannerCarousel banners={BANNERS} />
        </Reveal>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <Reveal>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {cats.map((c) => (
              <Link
                key={c.key}
                to={`/produtos?cat=${c.key}`}
                className="group flex flex-col items-center gap-2 rounded-xl bg-white p-3 text-center ring-1 ring-line transition hover:ring-2 hover:ring-brand/40"
              >
                <span className="grid size-12 place-items-center rounded-full bg-brand/10 text-2xl">
                  {CAT_EMOJI[c.key] ?? "🛒"}
                </span>
                <span className="text-xs font-medium text-ink-soft group-hover:text-brand">
                  {c.label}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* OFERTAS RELÂMPAGO */}
      <FlashSale />

      {/* BANNERS PROMO */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Promo
            tone="dark"
            tag="Gamer"
            title="Setup completo com até 30% OFF"
            cta="Ver gamer"
            to="/produtos?cat=gamer"
            emoji="🎮"
          />
          <Promo
            tone="teal"
            tag="Casa Smart"
            title="Sua casa conectada a partir de R$ 89"
            cta="Explorar casa"
            to="/produtos?cat=casa"
            emoji="🏠"
          />
          <Promo
            tone="brand"
            tag="Lançamentos"
            title="Novidades em áudio e wearables"
            cta="Ver novidades"
            to="/produtos"
            emoji="🎧"
          />
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">Em destaque</h2>
            <Link to="/produtos" className="text-sm font-semibold text-brand hover:underline">
              Ver tudo →
            </Link>
          </div>
        </Reveal>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i % 4} />
          ))}
        </div>
      </section>

      <PersonalizedPicks />

      <RecentlyViewed />
    </div>
  );
}
