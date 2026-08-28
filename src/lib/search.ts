import { SYNONYMS } from "../data/synonyms.ts";

/**
 * Distância de Levenshtein entre dois strings, com limite opcional:
 * se o mínimo possível de edições passar de `max`, devolve `max + 1`.
 */
export function levenshtein(a: string, b: string, max = Infinity): number {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  if (la === 0) return Math.min(lb, max + 1);
  if (lb === 0) return Math.min(la, max + 1);

  let prev = new Array(lb + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= la; i++) {
    const cur = [i];
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[lb];
}

/**
 * Normaliza texto para busca: decompõe em NFD, remove as marcas de
 * acentuação e converte para minúsculas. "Cafeteíra" vira "cafeteira".
 */
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Termo normalizado -> todos os termos do seu grupo de sinônimos
// (incluindo o próprio termo). Os grupos são bidirecionais: "fone"
// expande para "headphone" e "headphone" expande para "fone".
const SYNONYM_GROUPS: Record<string, string[]> = (() => {
  const groups: Record<string, string[]> = {};
  for (const [head, rest] of Object.entries(SYNONYMS)) {
    const all = [head, ...rest].map(normalizeSearch);
    for (const term of all) {
      const group = groups[term] ?? (groups[term] = []);
      for (const member of all) if (!group.includes(member)) group.push(member);
    }
  }
  return groups;
})();

function expandTerm(term: string): string[] {
  return SYNONYM_GROUPS[term] ?? [term];
}

/**
 * Busca tolerante a erro de digitação, caixa, acentuação e sinônimos.
 *
 * - Consulta vazia casa com tudo.
 * - Se `query` aparece como substring (normalizada), casa.
 * - Senão, casa se cada termo da consulta casa com alguma palavra do texto:
 *   termos com 5+ letras aceitam distância de Levenshtein <= 2; termos
 *   menores aceitam substring. Cada termo é expandido pelos sinônimos de
 *   `data/synonyms.ts` antes do casamento.
 */
export function searchMatch(text: string, query: string): boolean {
  const q = normalizeSearch(query).trim();
  if (!q) return true;
  const t = normalizeSearch(text);
  if (t.includes(q)) return true;

  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const words = t.split(/[^a-z0-9]+/).filter(Boolean);

  return terms.every((term) =>
    expandTerm(term).some((c) =>
      c.length < 5
        ? words.some((w) => w.includes(c))
        : words.some((w) => levenshtein(c, w, 2) <= 2)
    )
  );
}
