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

const KEY = "electronica:questions";

function load(): ProductQuestion[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProductQuestion[]) : [];
  } catch {
    return [];
  }
}

function persist(all: ProductQuestion[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage indisponível — ignora */
  }
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
