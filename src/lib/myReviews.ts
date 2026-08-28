import type { Review } from "../data/reviews";
import { read, write } from "./storage";

const KEY = "myreviews";

export function getMyReviews(): Review[] {
  const raw = read<unknown>(KEY, []);
  return Array.isArray(raw) ? (raw as Review[]) : [];
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
  write(KEY, all);
  return review;
}
