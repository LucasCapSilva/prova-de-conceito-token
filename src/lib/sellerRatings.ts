import { read, write } from "./storage";

export interface SellerRating {
  id: string;
  orderId: string;
  sellerId: string;
  service: number;
  packaging: number;
  delivery: number;
  comment?: string;
  at: number;
}

export interface SellerReputation {
  count: number;
  service: number;
  packaging: number;
  delivery: number;
  overall: number;
}

const KEY = "sellerratings";
const MAX_COMMENT = 500;

export function getSellerRatings(): SellerRating[] {
  return read<SellerRating[]>(KEY, []);
}

export function getRatingFor(
  orderId: string,
  sellerId: string,
): SellerRating | null {
  return getSellerRatings().find(
    (r) => r.orderId === orderId && r.sellerId === sellerId,
  ) ?? null;
}

export function addSellerRating(
  input: Omit<SellerRating, "id" | "at">,
): SellerRating {
  const rating: SellerRating = {
    ...input,
    id: `${input.orderId}:${input.sellerId}`,
    at: Date.now(),
  };
  if (rating.comment !== undefined) {
    rating.comment = rating.comment.slice(0, MAX_COMMENT);
  }
  const all = getSellerRatings().filter(
    (r) => !(r.orderId === rating.orderId && r.sellerId === rating.sellerId),
  );
  all.push(rating);
  write(KEY, all);
  return rating;
}

export function sellerReputation(sellerId: string): SellerReputation | null {
  const all = getSellerRatings().filter((r) => r.sellerId === sellerId);
  if (all.length === 0) return null;
  const sum = all.reduce(
    (acc, r) => ({
      service: acc.service + r.service,
      packaging: acc.packaging + r.packaging,
      delivery: acc.delivery + r.delivery,
    }),
    { service: 0, packaging: 0, delivery: 0 },
  );
  const service = sum.service / all.length;
  const packaging = sum.packaging / all.length;
  const delivery = sum.delivery / all.length;
  return {
    count: all.length,
    service,
    packaging,
    delivery,
    overall: (service + packaging + delivery) / 3,
  };
}
