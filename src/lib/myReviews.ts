import type { Review } from "../data/reviews";

const KEY = "electronica:myreviews";

export function getMyReviews(): Review[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Review[]) : [];
  } catch {
    return [];
  }
}

export function myReviewsFor(productId: string): Review[] {
  return getMyReviews().filter((r) => r.productId === productId);
}

export function getMyReviewForItem(
  orderId: string,
  itemId: string
): Review | undefined {
  return getMyReviews().find((r) => r.id === `my-${orderId}-${itemId}`);
}

export function addMyReview(review: Review): Review {
  const all = getMyReviews();
  const idx = all.findIndex((r) => r.id === review.id);
  if (idx >= 0) all[idx] = review;
  else all.unshift(review);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage indisponível — ignora */
  }
  return review;
}
