import { read, write } from "./storage.ts";

const KEY = "ad:reports";

export const AD_REPORT_REASONS = [
  "Preço enganoso",
  "Produto proibido",
  "Imagem indevida",
] as const;

export type AdReportReason = (typeof AD_REPORT_REASONS)[number];

export interface AdReport {
  productId: string;
  reason: AdReportReason | string;
  comment: string;
  protocol: string;
  reportedAt: number;
}

function load(): Record<string, AdReport> {
  const raw = read<unknown>(KEY, {});
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, AdReport> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const r = v as AdReport;
    if (
      v &&
      typeof v === "object" &&
      typeof r.productId === "string" &&
      typeof r.reason === "string" &&
      typeof r.protocol === "string" &&
      typeof r.reportedAt === "number"
    ) {
      out[id] = {
        ...r,
        comment: typeof r.comment === "string" ? r.comment : "",
      };
    }
  }
  return out;
}

function persist(map: Record<string, AdReport>) {
  write(KEY, map);
}

export function listAdReports(): AdReport[] {
  const map = load();
  return Object.values(map).sort((a, b) => b.reportedAt - a.reportedAt);
}

export function getAdReport(productId: string): AdReport | undefined {
  return load()[productId];
}

/** Produtos anunciados denunciados ficam marcados para o usuário local. */
export function reportedAdIds(): Set<string> {
  return new Set(Object.keys(load()));
}

function makeProtocol(productId: string): string {
  const rand = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `AD-${productId.slice(0, 6).toUpperCase()}-${Date.now()
    .toString(36)
    .toUpperCase()}-${rand}`;
}

/** Grava a denúncia e devolve o protocolo gerado. */
export function reportAd(
  productId: string,
  reason: AdReportReason | string,
  comment = "",
): AdReport | null {
  const id = productId.trim();
  if (!id) return null;
  const map = load();
  const existing = map[id];
  const report: AdReport = {
    productId: id,
    reason,
    comment: comment.trim(),
    protocol: existing?.protocol ?? makeProtocol(id),
    reportedAt: Date.now(),
  };
  map[id] = report;
  persist(map);
  return report;
}
