import { read, write } from "./storage.ts";

const KEY = "seller:replies";

export interface ReviewReply {
  sellerId: string;
  text: string;
  createdAt: number;
}

function load(): Record<string, ReviewReply> {
  const raw = read<unknown>(KEY, {});
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, ReviewReply> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (
      v &&
      typeof v === "object" &&
      typeof (v as ReviewReply).sellerId === "string" &&
      typeof (v as ReviewReply).text === "string"
    ) {
      out[id] = v as ReviewReply;
    }
  }
  return out;
}

function persist(map: Record<string, ReviewReply>) {
  write(KEY, map);
}

export function listReplies(): Record<string, ReviewReply> {
  return load();
}

export function getReply(reviewId: string): ReviewReply | undefined {
  return load()[reviewId];
}

/** Grava ou substitui a resposta; texto em branco remove a resposta. */
export function saveReply(
  sellerId: string,
  reviewId: string,
  text: string,
): ReviewReply | null {
  const map = load();
  const t = text.trim();
  if (!t) {
    if (!map[reviewId]) return null;
    delete map[reviewId];
    persist(map);
    return null;
  }
  const reply: ReviewReply = { sellerId, text: t, createdAt: Date.now() };
  map[reviewId] = reply;
  persist(map);
  return reply;
}
