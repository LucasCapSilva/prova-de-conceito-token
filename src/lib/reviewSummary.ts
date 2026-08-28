import { normalizeSearch } from "./search.ts";

export interface TermCount {
  word: string;
  count: number;
}

const STOPWORDS = new Set([
  "que",
  "por",
  "com",
  "mas",
  "para",
  "foi",
  "tem",
  "tem",
  "mais",
  "bem",
  "bom",
  "como",
  "quando",
  "ainda",
  "nao",
  "tambem",
  "muito",
  "cada",
  "algo",
  "pois",
  "assim",
  "entao",
  "porque",
  "onde",
  "sobre",
  "entre",
  "apos",
  "antes",
  "depois",
  "mesmo",
  "mesma",
  "isso",
  "isto",
  "aquele",
  "aquela",
  "aquilo",
  "coisa",
  "coisas",
  "porem",
  "sem",
  "se",
  "ja",
  "sim",
  "ela",
  "eles",
  "elas",
  "nos",
  "nas",
  "nos",
  "num",
  "numa",
  "uns",
  "uns",
  "uns",
  "uns",
  "uns",
]);

/**
 * Extrai os termos mais frequentes dos comentários de avaliação.
 * Normaliza acento e caixa, remove pontuação, descarta stopwords e
 * palavras curtas; só entra termo que aparece em pelo menos 2 comentários.
 */
export function frequentTerms(comments: string[], limit = 10): TermCount[] {
  const counts = new Map<string, number>();
  for (const c of comments) {
    for (const raw of normalizeSearch(c).split(/\s+/)) {
      const w = raw.replace(/[^a-z0-9]/g, "");
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/** O comentário menciona o termo (comparação sem acento nem caixa)? */
export function commentMentions(term: string, comment: string): boolean {
  const t = normalizeSearch(term).trim();
  return t.length > 0 && normalizeSearch(comment).includes(t);
}
