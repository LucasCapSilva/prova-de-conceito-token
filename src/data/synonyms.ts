// Dicionário de sinônimos da busca (dados).
//
// Chave: termo como o usuário digita; valores: equivalentes que podem
// aparecer nos produtos — e o contrário também vale. Tudo é normalizado
// (caixa e acento) em `lib/search.ts` antes de montar os grupos.
export const SYNONYMS: Record<string, string[]> = {
  fone: ["headphone", "headset"],
  celular: ["smartphone"],
  tv: ["televisão"],
};
