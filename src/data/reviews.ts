import { PRODUCTS, type Product } from "./products";

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  photos?: string[];
}

const FIRST = [
  "Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabriela", "Henrique",
  "Isabela", "João", "Karina", "Lucas", "Mariana", "Nelson", "Olívia", "Paulo",
  "Rebeca", "Sofia", "Túlio", "Vanessa",
];

const LAST = [
  "Silva", "Souza", "Lima", "Costa", "Pereira", "Almeida", "Ferreira",
  "Rodrigues", "Gomes", "Martins", "Araújo", "Barbosa", "Ribeiro", "Cardoso",
  "Melo", "Rocha", "Dias", "Moreira",
];

const COMMENTS: { text: string; min: number }[] = [
  { text: "Produto excelente, superou minhas expectativas. Recomendo muito!", min: 5 },
  { text: "Chegou rápido e muito bem embalado. Ótima qualidade.", min: 5 },
  { text: "Muito bom pelo preço. Cumpre o que promete.", min: 4 },
  { text: "Atendimento impecável e produto de primeira. Voltarei a comprar.", min: 5 },
  { text: "Bom produto, só demorou um pouco na entrega. Mas valeu a pena.", min: 4 },
  { text: "Qualidade ótima, uso todos os dias. Aprovado!", min: 5 },
  { text: "Ótimo custo-benefício, recomendo a todos.", min: 4 },
  { text: "Ficou perfeito! Melhor do que eu imaginava.", min: 5 },
  { text: "Muito satisfeito, chegou antes do prazo e sem defeitos.", min: 5 },
  { text: "Bom no geral, só achei que poderia ser um pouco mais robusto.", min: 3 },
  { text: "Cumpre a função, mas a bateria deixou a desejar.", min: 3 },
  { text: "Boa compra, entrega ok. Recomendo.", min: 4 },
];

const PHOTO_SEEDS = ["review-photo-1", "review-photo-2", "review-photo-3"];

function h(id: string): number {
  let v = 2166136261;
  for (let i = 0; i < id.length; i++) {
    v ^= id.charCodeAt(i);
    v = Math.imul(v, 16777619) >>> 0;
  }
  return v >>> 0;
}

const BASE = Date.UTC(2026, 6, 15);

function buildReview(product: Product, slot: number): Review {
  const id = `${product.id}-rev-${slot}`;
  const hh = h(id);
  const author = `${FIRST[hh % FIRST.length]} ${LAST[(hh >> 4) % LAST.length]}`;
  const comment = COMMENTS[hh % COMMENTS.length];
  const rating = Math.max(3, Math.min(5, comment.min - (hh % 2)));
  const daysAgo = 3 + (hh % 170);
  const date = new Date(BASE - daysAgo * 86_400_000).toISOString();
  const helpful = hh % 40;
  const photos = hh % 4 === 0 ? [`${PHOTO_SEEDS[hh % PHOTO_SEEDS.length]}`] : undefined;
  return {
    id,
    productId: product.id,
    author,
    rating,
    date,
    comment: comment.text,
    helpful,
    photos,
  };
}

export const REVIEWS: Review[] = PRODUCTS.flatMap((p) => [
  buildReview(p, 0),
  buildReview(p, 1),
]);

export function reviewsFor(productId: string): Review[] {
  return REVIEWS.filter((r) => r.productId === productId);
}

export function ratingSummary(productId: string) {
  const list = reviewsFor(productId);
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: list.filter((r) => r.rating === star).length,
  }));
  const total = list.length;
  const avg = total
    ? list.reduce((acc, r) => acc + r.rating, 0) / total
    : 0;
  return { total, avg, counts };
}
