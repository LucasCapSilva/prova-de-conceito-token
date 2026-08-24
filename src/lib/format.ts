export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }
  return n.toLocaleString("pt-BR");
}

export function formatInstallments(inst: { count: number; value: number }): string {
  if (inst.count <= 1) return formatBRL(inst.value);
  return `${inst.count}x de ${formatBRL(inst.value)} sem juros`;
}
