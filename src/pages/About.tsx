import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Reveal from "../components/Reveal";

const VALUES = [
  {
    icon: "⚡",
    title: "Inovação real",
    text: "Só colocamos em linha tecnologia que usamos no dia a dia — testada, aprovada e amada pela equipe.",
  },
  {
    icon: "🌱",
    title: "Sustentabilidade",
    text: "Embalagens 100% recicláveis, logística reversa de dispositivos e meta de operação carbono-neutra até 2027.",
  },
  {
    icon: "🤝",
    title: "Pessoas em 1º lugar",
    text: "Suporte humano 7 dias por semana. Aqui você fala com gente de verdade que entende de tecnologia.",
  },
  {
    icon: "🔬",
    title: "Obsessão por qualidade",
    text: "Cada produto passa por um checklist de 47 pontos antes de chegar à sua casa. Zero atalhos.",
  },
];

const STATS: [string, string][] = [
  ["2019", "ano de fundação"],
  ["50 mil+", "clientes atendidos"],
  ["120+", "marcas parceiras"],
  ["4.9★", "satisfação média"],
];

const TIMELINE: [string, string, string][] = [
  ["2019", "Dois amigos, um notebook e um sonho", "A Electronica abre como um pequeno e-commerce de acessórios em São Paulo."],
  ["2021", "Primeira loja física", "Nossa flagship no centro da cidade vira ponto de encontro da comunidade tech."],
  ["2023", "Linha própria de áudio", "Lançamos o Pro Max Headphones — hoje nosso mais vendido com 12 mil unidades."],
  ["2026", "50 mil clientes e contando", "Viramos referência em curadoria, suporte e experiência de compra no Brasil."],
];

const TEAM = [
  { initials: "LP", name: "Lucas Pereira", role: "CEO & Co-founder" },
  { initials: "AS", name: "Ana Souza", role: "CTO & Co-founder" },
  { initials: "MR", name: "Mateus Rocha", role: "Head de Produto" },
  { initials: "CB", name: "Carla Brito", role: "Líder de Design" },
];

export default function About() {
  return (
    <div className="pt-32 sm:pt-28">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-32 top-10 size-96 rounded-full bg-brand-soft blur-[120px]" />
        <div className="absolute -right-24 top-40 size-96 rounded-full bg-ship/10 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-widest text-brand"
          >
            NOSSA HISTÓRIA
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 text-4xl font-bold leading-tight text-ink sm:text-6xl"
          >
            Conectando pessoas ao <span className="text-brand">futuro</span> desde 2019
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft"
          >
            A Electronica nasceu de uma frustração simples: comprar eletrônicos
            bons era caro, confuso e impessoal. Quisemos mudar isso — e
            criamos uma loja onde cada produto é escolhido com cuidado, cada
            pedido é tratado com obsessão e cada cliente vira comunidade.
          </motion.p>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([n, l], i) => (
            <Reveal key={l} delay={i * 0.1}>
              <div className="rounded-xl border border-line bg-surface p-7 text-center">
                <p className="text-3xl font-bold text-brand">{n}</p>
                <p className="mt-2 text-sm text-ink-soft">{l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <Reveal>
          <h2 className="text-center text-3xl font-bold text-ink sm:text-4xl">
            Nossa <span className="text-brand">jornada</span>
          </h2>
        </Reveal>
        <div className="relative mt-12 before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-brand before:via-brand/30 before:to-transparent sm:before:-translate-x-1/2">
          {TIMELINE.map(([year, title, text], i) => (
            <Reveal key={year} delay={i * 0.1}>
              <div className={`mb-12 flex sm:flex-row ${i % 2 ? "sm:justify-end" : ""}`}>
                <div className="max-w-md rounded-xl border border-line bg-surface p-6 transition-colors hover:border-brand/40">
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                    {year}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          <h2 className="text-center text-3xl font-bold text-ink sm:text-4xl">
            O que nos <span className="text-brand">move</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -8 }}
                className="h-full rounded-xl border border-line bg-surface p-7 transition-colors hover:border-brand/40"
              >
                <span className="grid size-14 place-items-center rounded-xl bg-brand-soft text-2xl">
                  {v.icon}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-ink">
                  {v.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{v.text}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Reveal>
          <h2 className="text-center text-3xl font-bold text-ink sm:text-4xl">
            Quem faz a <span className="text-brand">mágica</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.1}>
              <div className="rounded-xl border border-line bg-surface p-7 text-center transition-colors hover:border-brand/40">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="mx-auto grid size-20 place-items-center rounded-full bg-brand text-2xl font-bold text-white"
                >
                  {m.initials}
                </motion.div>
                <h3 className="mt-5 font-semibold text-ink">{m.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{m.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-12 text-center">
            <div className="absolute -left-20 -top-20 size-64 rounded-full bg-brand-soft blur-[100px]" />
            <div className="absolute -bottom-24 -right-16 size-64 rounded-full bg-ship/10 blur-[100px]" />
            <h2 className="relative text-3xl font-bold text-ink sm:text-4xl">
              Faça parte da <span className="text-brand">Electronica</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-ink-soft">
              Conheça de perto o que fazem nossos produtos por dentro.
            </p>
            <Link
              to="/produtos"
              className="relative mt-8 inline-block rounded-md bg-brand px-9 py-4 font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Explorar catálogo
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
