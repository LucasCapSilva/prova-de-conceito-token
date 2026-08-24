import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import { PRODUCTS } from "../data/products";
import { getOrders } from "../lib/orders";
import { formatBRL, formatCompact } from "../lib/format";

function hashStr(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function SalesChart({ months, values }: { months: Date[]; values: number[] }) {
  const W = 560;
  const H = 240;
  const PAD_L = 64;
  const PAD_R = 10;
  const PAD_T = 24;
  const PAD_B = 30;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const maxVal = Math.max(...values);
  const top = Math.ceil(maxVal / 1000) * 1000 || 1000;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f);
  const barW = plotW / values.length;
  const bar = barW - 10;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Barras de vendas dos últimos 12 meses"
      className="w-full"
    >
      {ticks.map((t) => {
        const y = PAD_T + plotH - (t / top) * plotH;
        return (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y}
              y2={y}
              stroke="var(--line)"
              strokeWidth={t === 0 ? 1.5 : 1}
              strokeDasharray={t === 0 ? undefined : "3 4"}
            />
            <text
              x={PAD_L - 8}
              y={y + 3.5}
              textAnchor="end"
              fontSize={10}
              fill="var(--ink-soft)"
            >
              {t === 0 ? "0" : `R$ ${formatCompact(t)}`}
            </text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const x = PAD_L + i * barW + 5;
        const h = (v / top) * plotH;
        const y = PAD_T + plotH - h;
        const current = i === values.length - 1;
        const month = months[i];
        const label = month
          ? month.toLocaleDateString("pt-BR", { month: "short" })
          : "";
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bar}
              height={Math.max(h, 2)}
              rx={2}
              fill="var(--brand)"
              opacity={current ? 1 : 0.35}
            >
              <title>
                {label} {month?.getFullYear()} — {formatBRL(v)}
              </title>
            </rect>
            {current && (
              <text
                x={x + bar / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill="var(--brand)"
              >
                {`R$ ${formatCompact(v)}`}
              </text>
            )}
            <text
              x={x + bar / 2}
              y={H - 10}
              textAnchor="middle"
              fontSize={10}
              fontWeight={current ? 700 : 400}
              fill={current ? "var(--brand)" : "var(--ink-soft)"}
            >
              {label}
            </text>
          </g>
        );
      })}
      <line
        x1={PAD_L}
        x2={PAD_L}
        y1={PAD_T}
        y2={PAD_T + plotH}
        stroke="var(--line)"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span
          className="grid size-9 place-items-center rounded-md bg-brand-soft text-base"
          aria-hidden
        >
          {icon}
        </span>
        <p className="text-xs font-semibold text-ink-soft">{label}</p>
      </div>
      <p className="mt-3 text-xl font-black tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();

  if (!user?.sellerId) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
        <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
          <span className="text-4xl">🏪</span>
          <h1 className="text-lg font-black text-ink">
            Painel do vendedor
          </h1>
          <p className="max-w-sm text-sm text-ink-soft">
            Entre com uma conta de vendedor para gerenciar produtos, pedidos e
            perguntas da sua loja.
          </p>
          <Link
            to="/entrar"
            className="btn-brand mt-1 rounded-[6px] px-4 py-2 text-sm font-bold"
          >
            Entrar como vendedor
          </Link>
        </div>
      </div>
    );
  }

  const seller = getSeller(user.sellerId);
  if (!seller) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
        <div className="card rounded-lg p-12 text-center text-sm text-ink-soft">
          Vendedor não encontrado.
        </div>
      </div>
    );
  }

  const products = PRODUCTS.filter((p) => p.sellerId === seller.id);
  const revenue = products.reduce((acc, p) => acc + p.price * p.sold, 0);
  const active = products.filter((p) => p.stock > 0).length;
  const orders = getOrders().filter((o) =>
    o.items.some((it) => it.seller === seller.name),
  );
  const pending = orders.filter(
    (o) => o.status === "confirmed" || o.status === "processing",
  ).length;

  const months = Array.from({ length: 12 }, (_, idx) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - idx));
    return d;
  });
  const base = revenue / 12 || 1;
  const values = months.map((d) => {
    const h = hashStr(
      `${seller.id}:${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`,
    );
    return Math.round(base * (0.6 + (h % 1000) / 1000));
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">
          Painel do vendedor
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {seller.name}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {seller.location} · na Electronica Store desde {seller.since}
        </p>
        <nav className="mt-3 flex flex-wrap gap-2">
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
          <Link
            to="/vendedor/perguntas"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Perguntas
          </Link>
        </nav>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon="💰"
          label="Faturamento"
          value={formatBRL(revenue)}
          hint="Acumulado das vendas registradas"
        />
        <StatCard
          icon="🧾"
          label="Pedidos"
          value={String(orders.length)}
          hint={`${pending} aguardando atendimento`}
        />
        <StatCard
          icon="📦"
          label="Produtos ativos"
          value={String(active)}
          hint={`${products.length} no total na loja`}
        />
        <StatCard
          icon="⭐"
          label="Reputação"
          value={`${seller.rating.toFixed(1)} / 5`}
          hint={`${formatCompact(seller.sales)} vendas realizadas`}
        />
      </div>

      <section className="card mt-4 rounded-lg p-4">
        <h2 className="text-sm font-bold text-ink">
          Vendas — últimos 12 meses
        </h2>
        <p className="mt-1 text-[11px] text-ink-soft">
          Faturamento mensal da loja. Passe o mouse sobre as barras para ver o
          valor exato.
        </p>
        <div className="mt-3">
          <SalesChart months={months} values={values} />
        </div>
      </section>

      <section className="card mt-4 rounded-lg p-4">
        <h2 className="text-sm font-bold text-ink">Resumo da loja</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md border border-line bg-page p-3">
            <dt className="text-[11px] font-semibold text-ink-soft">
              Unidade de venda média
            </dt>
            <dd className="mt-1 font-bold text-ink">
              {products.length > 0
                ? formatBRL(revenue / Math.max(1, products.reduce((a, p) => a + p.sold, 0)))
                : formatBRL(0)}
            </dd>
          </div>
          <div className="rounded-md border border-line bg-page p-3">
            <dt className="text-[11px] font-semibold text-ink-soft">
              Selo oficial
            </dt>
            <dd className="mt-1 font-bold text-ink">
              {seller.isOfficial ? "Loja oficial ✓" : "Vendedor verificado"}
            </dd>
          </div>
          <div className="rounded-md border border-line bg-page p-3">
            <dt className="text-[11px] font-semibold text-ink-soft">
              Estoque total
            </dt>
            <dd className="mt-1 font-bold text-ink">
              {formatCompact(
                products.reduce((acc, p) => acc + p.stock, 0),
              )}{" "}
              unidades
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
