export interface PricePoint {
  month: string;
  value: number;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function priceHistory(productId: string, currentPrice: number): PricePoint[] {
  const rand = mulberry32(hashStr(productId));
  const now = new Date();
  const points: PricePoint[] = [];
  for (let i = 5; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const drift = (rand() - 0.5) * 0.2;
    const value = Math.max(1, Math.round(currentPrice * (1 + drift) * 100) / 100);
    points.push({
      month: d.toLocaleDateString("pt-BR", { month: "short" }),
      value,
    });
  }
  const cur = new Date(now.getFullYear(), now.getMonth(), 1);
  points.push({
    month: cur.toLocaleDateString("pt-BR", { month: "short" }),
    value: currentPrice,
  });
  return points;
}
