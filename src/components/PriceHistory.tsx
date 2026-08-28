import { useMemo } from "react";
import { formatBRL } from "../lib/format";
import { priceHistory } from "../lib/priceHistory";

const W = 560;
const H = 220;
const PAD_X = 28;
const TOP = 24;
const BOTTOM = 40;

export default function PriceHistory({
  productId,
  price,
}: {
  productId: string;
  price: number;
}) {
  const points = useMemo(() => priceHistory(productId, price), [productId, price]);
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values) === lo ? lo * 1.1 : Math.max(...values);
  const minIdx = values.indexOf(lo);

  const n = points.length;
  const plotW = W - PAD_X * 2;
  const plotH = H - TOP - BOTTOM;
  const x = (i: number) => PAD_X + (i / (n - 1)) * plotW;
  const y = (v: number) => TOP + plotH - ((v - lo) / (hi - lo)) * plotH;

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)} ${(TOP + plotH).toFixed(1)} L${x(0).toFixed(1)} ${(TOP + plotH).toFixed(1)} Z`;
  const grid = [lo, (lo + hi) / 2, hi];

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-bold text-ink">Histórico de preço</h2>
      <div className="card p-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Evolução do preço nos últimos 6 meses. Menor preço: ${formatBRL(lo)} em ${points[minIdx].month}. Preço atual: ${formatBRL(price)}.`}
          className="w-full"
        >
          {grid.map((g) => (
            <g key={g}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={y(g)}
                y2={y(g)}
                stroke="var(--line)"
                strokeDasharray="4 4"
              />
              <text
                x={PAD_X}
                y={y(g) - 5}
                fill="currentColor"
                className="text-[10px] text-ink-soft"
              >
                {formatBRL(g)}
              </text>
            </g>
          ))}
          <path d={area} fill="var(--brand-soft)" />
          <path d={line} fill="none" stroke="var(--brand)" strokeWidth={2} />
          {points.map((p, i) => {
            const isMin = i === minIdx;
            return (
              <g key={p.month + i}>
                <circle
                  cx={x(i)}
                  cy={y(p.value)}
                  r={isMin ? 5 : 3.5}
                  fill={isMin ? "var(--brand)" : "var(--surface)"}
                  stroke="var(--brand)"
                  strokeWidth={2}
                />
                <text
                  x={x(i)}
                  y={H - 12}
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-[10px] text-ink-soft"
                >
                  {p.month}
                </text>
                {isMin && (
                  <text
                    x={x(i)}
                    y={y(p.value) - 10}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[10px] font-bold text-brand"
                  >
                    menor: {formatBRL(p.value)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-xs text-ink-soft">
          Preços estimados dos últimos 6 meses. Menor preço:{" "}
          <span className="font-bold text-brand">{formatBRL(lo)}</span> (
          {points[minIdx].month}).
        </p>
      </div>
    </section>
  );
}
