import test from "node:test";
import assert from "node:assert/strict";

import { sortReviews, type ReviewSort } from "./reviewSort.ts";
import type { Review } from "../data/reviews.ts";

function mk(id: string, rating: number, helpful: number, date: string): Review {
  return {
    id,
    productId: "p",
    author: "A",
    rating,
    date,
    comment: "c",
    helpful,
  };
}

const REVIEWS: Review[] = [
  mk("a", 5, 2, "2026-07-01T12:00:00.000Z"),
  mk("b", 4, 9, "2026-07-10T12:00:00.000Z"),
  mk("c", 3, 9, "2026-07-20T12:00:00.000Z"),
  mk("d", 4, 1, "2026-07-15T12:00:00.000Z"),
];

test("recent ordena do mais novo para o mais antigo", () => {
  assert.deepEqual(
    sortReviews(REVIEWS, "recent").map((r) => r.id),
    ["c", "d", "b", "a"],
  );
});

test("top ordena da maior nota para a menor, empatando por data", () => {
  assert.deepEqual(
    sortReviews(REVIEWS, "top").map((r) => r.id),
    ["a", "d", "b", "c"],
  );
});

test("low ordena da menor nota para a maior, empatando por data", () => {
  assert.deepEqual(
    sortReviews(REVIEWS, "low").map((r) => r.id),
    ["c", "d", "b", "a"],
  );
});

test("helpful ordena do mais útil, empatando por data", () => {
  assert.deepEqual(
    sortReviews(REVIEWS, "helpful").map((r) => r.id),
    ["c", "b", "a", "d"],
  );
});

test("não muta a lista de entrada e o padrão é recent", () => {
  const input = [...REVIEWS];
  const out = sortReviews(REVIEWS);
  assert.deepEqual(
    out.map((r) => r.id),
    sortReviews(input, "recent").map((r) => r.id),
  );
  assert.deepEqual(
    REVIEWS.map((r) => r.id),
    input.map((r) => r.id),
  );
  const all: ReviewSort[] = ["recent", "top", "low", "helpful"];
  for (const s of all) {
    sortReviews(REVIEWS, s);
  }
  assert.equal(REVIEWS[0].id, "a");
});
