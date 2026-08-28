import { read, write } from "./storage";

const KEY = "returns";

export type ReturnStatus = "aberta" | "analise" | "aprovada" | "concluida";

export interface ReturnEvent {
  label: string;
  date: string;
}

export interface ReturnRequest {
  id: string;
  protocol: string;
  orderId: string;
  productId: string;
  itemName: string;
  image: string;
  reason: string;
  description: string;
  photos: string[];
  createdAt: string;
}

const THRESHOLDS: { afterMs: number; status: ReturnStatus }[] = [
  { afterMs: 45 * 60 * 1000, status: "concluida" },
  { afterMs: 15 * 60 * 1000, status: "aprovada" },
  { afterMs: 5 * 60 * 1000, status: "analise" },
];

export function effectiveStatus(r: ReturnRequest): ReturnStatus {
  const elapsed = Date.now() - new Date(r.createdAt).getTime();
  for (const t of THRESHOLDS) {
    if (elapsed >= t.afterMs) return t.status;
  }
  return "aberta";
}

export function returnTimeline(
  r: ReturnRequest
): { label: string; date: string; done: boolean }[] {
  const created = new Date(r.createdAt).getTime();
  const now = Date.now();
  const steps = [
    { label: "Solicitação aberta", afterMs: 0 },
    { label: "Em análise", afterMs: 5 * 60 * 1000 },
    { label: "Devolução aprovada", afterMs: 15 * 60 * 1000 },
    { label: "Devolução concluída", afterMs: 45 * 60 * 1000 },
  ];
  return steps.map((s) => ({
    label: s.label,
    date: new Date(created + s.afterMs).toISOString(),
    done: now >= created + s.afterMs,
  }));
}

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  aberta: "Aberta",
  analise: "Em análise",
  aprovada: "Aprovada",
  concluida: "Concluída",
};

function load(): ReturnRequest[] {
  const raw = read<unknown>(KEY, []);
  return Array.isArray(raw) ? (raw as ReturnRequest[]) : [];
}

export function getReturns(): ReturnRequest[] {
  return load();
}

export function getReturnForItem(
  orderId: string,
  productId: string
): ReturnRequest | undefined {
  return load().find(
    (r) => r.orderId === orderId && r.productId === productId
  );
}

export function createReturn(input: {
  orderId: string;
  productId: string;
  itemName: string;
  image: string;
  reason: string;
  description: string;
  photos: string[];
}): ReturnRequest {
  const all = load();
  const req: ReturnRequest = {
    id: `ret-${input.orderId}-${input.productId}`,
    protocol: `DEV-${String(Date.now()).slice(-6)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  all.unshift(req);
  write(KEY, all);
  return req;
}
