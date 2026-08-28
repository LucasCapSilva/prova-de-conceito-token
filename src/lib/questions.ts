import { read, write } from "./storage";

export interface ProductQuestion {
  id: string;
  productId: string;
  question: string;
  author: string;
  createdAt: string;
  answer?: string;
  answeredAt?: string;
  answeredBy?: string;
}

const KEY = "questions";

function load(): ProductQuestion[] {
  const raw = read<unknown>(KEY, []);
  return Array.isArray(raw) ? (raw as ProductQuestion[]) : [];
}

function persist(all: ProductQuestion[]) {
  write(KEY, all);
}

export function getQuestions(): ProductQuestion[] {
  return load();
}

export function questionsForProduct(productId: string): ProductQuestion[] {
  return load()
    .filter((q) => q.productId === productId)
    .reverse();
}

export function addQuestion(
  productId: string,
  question: string,
  author = "Você",
): ProductQuestion {
  const q: ProductQuestion = {
    id: `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    productId,
    question,
    author,
    createdAt: new Date().toISOString(),
  };
  const all = load();
  all.unshift(q);
  persist(all);
  return q;
}

export function answerQuestion(
  id: string,
  answer: string,
  by: string,
): ProductQuestion | undefined {
  const all = load();
  const idx = all.findIndex((q) => q.id === id);
  if (idx < 0) return undefined;
  all[idx] = {
    ...all[idx],
    answer,
    answeredAt: new Date().toISOString(),
    answeredBy: by,
  };
  persist(all);
  return all[idx];
}
