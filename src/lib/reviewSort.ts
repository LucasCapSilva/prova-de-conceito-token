import type { Review } from "../data/reviews";

export type ReviewSort = "recent" | "top" | "low" | "helpful";

function byDateDesc(a: Review, b: Review): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

/** Devolve uma cópia ordenada; nunca muta a lista recebida. */
export function sortReviews(
  list: Review[],
  sort: ReviewSort = "recent",
): Review[] {
  const out = [...list];
  switch (sort) {
    case "top":
      out.sort((a, b) => b.rating - a.rating || byDateDesc(a, b));
      break;
    case "low":
      out.sort((a, b) => a.rating - b.rating || byDateDesc(a, b));
      break;
    case "helpful":
      out.sort((a, b) => b.helpful - a.helpful || byDateDesc(a, b));
      break;
    case "recent":
    default:
      out.sort(byDateDesc);
  }
  return out;
}
