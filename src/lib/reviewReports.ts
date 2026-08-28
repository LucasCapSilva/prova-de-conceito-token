import { read, write } from "./storage.ts";

const KEY = "review:reports";

export const REPORT_REASONS = [
  "Conteúdo ofensivo",
  "Spam ou propaganda",
  "Conteúdo irrelevante",
  "Dados pessoais expostos",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export interface ReviewReport {
  productId: string;
  reviewId: string;
  reason: ReportReason | string;
  comment: string;
  reportedAt: number;
}

function load(): Record<string, ReviewReport> {
  const raw = read<unknown>(KEY, {});
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, ReviewReport> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const r = v as ReviewReport;
    if (
      v &&
      typeof v === "object" &&
      typeof r.productId === "string" &&
      typeof r.reviewId === "string" &&
      typeof r.reason === "string" &&
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

function persist(map: Record<string, ReviewReport>) {
  write(KEY, map);
}

export function listReports(): ReviewReport[] {
  const map = load();
  return Object.values(map).sort((a, b) => b.reportedAt - a.reportedAt);
}

export function getReport(reviewId: string): ReviewReport | undefined {
  return load()[reviewId];
}

/** Avaliações denunciadas ficam ocultas para o usuário local. */
export function reportedIds(): Set<string> {
  return new Set(Object.keys(load()));
}

/** Grava a denúncia; reviewId em branco não grava nada. */
export function reportReview(
  productId: string,
  reviewId: string,
  reason: ReportReason | string,
  comment = "",
): ReviewReport | null {
  const id = reviewId.trim();
  if (!id) return null;
  const map = load();
  const report: ReviewReport = {
    productId,
    reviewId: id,
    reason,
    comment: comment.trim(),
    reportedAt: Date.now(),
  };
  map[id] = report;
  persist(map);
  return report;
}
