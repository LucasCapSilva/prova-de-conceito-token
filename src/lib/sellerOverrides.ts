import {
  PRODUCTS,
  installmentsFor,
  type Category,
  type Product,
} from "../data/products.ts";
import { read, write } from "./storage.ts";

const KEY = "seller:overrides";
const CUSTOM_KEY = "seller:customProducts";

export interface NewSellerProductInput {
  name: string;
  category: Category;
  brand: string;
  price: number;
  stock: number;
  images: string[];
  highlights: string[];
}

export interface SellerOverride {
  price?: number;
  stock?: number;
  featured?: boolean;
}

export type OverridesMap = Record<string, SellerOverride>;

function load(): OverridesMap {
  const raw = read<unknown>(KEY, null);
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as OverridesMap)
    : {};
}

function persist(map: OverridesMap) {
  write(KEY, map);
}

export function getOverrides(): OverridesMap {
  return load();
}

export function getOverride(productId: string): SellerOverride | undefined {
  return load()[productId];
}

export function hasOverride(productId: string): boolean {
  return productId in load();
}

export function saveOverride(
  productId: string,
  patch: SellerOverride,
): void {
  const map = load();
  map[productId] = { ...map[productId], ...patch };
  persist(map);
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return;
  if (patch.price !== undefined) p.price = patch.price;
  if (patch.stock !== undefined) p.stock = patch.stock;
  if (patch.featured !== undefined) p.featured = patch.featured;
}

function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || "produto";
}

function loadCustom(): Product[] {
  const raw = read<unknown>(CUSTOM_KEY, null);
  return Array.isArray(raw) ? (raw as Product[]) : [];
}

function persistCustom(list: Product[]) {
  write(CUSTOM_KEY, list);
}

export function createSellerProduct(
  sellerId: string,
  input: NewSellerProductInput,
): Product {
  const slug = slugify(input.name);
  const id = `custom-${sellerId}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const images = input.images.map((u) => u.trim()).filter((u) => u !== "");
  const fallback = (kw: string) =>
    `https://loremflickr.com/900/900/${kw}`;
  const gallery =
    images.length > 0
      ? images
      : [fallback(slug), fallback(`${slug}-detalhe`), fallback(`${slug}-lado`)];
  const price = Math.max(0.01, Math.round(input.price * 100) / 100);
  const highlights =
    input.highlights.map((h) => h.trim()).filter((h) => h !== "").slice(0, 5);
  const product: Product = {
    id,
    name: input.name.trim(),
    category: input.category,
    price,
    rating: 0,
    reviews: 0,
    sold: 0,
    image: gallery[0],
    gallery,
    description: "Produto anunciado diretamente pela loja.",
    highlights:
      highlights.length > 0
        ? highlights
        : ["Qualidade garantida", "Garantia do fabricante", "Embalagem original"],
    brand: input.brand.trim() || "Genérico",
    sellerId,
    stock: Math.max(0, Math.floor(input.stock)),
    freeShipping: true,
    condition: "novo",
    warrantyMonths: 12,
    freeReturn: true,
    exchangeDays: 7,
    installments: installmentsFor(price),
  };
  const list = loadCustom();
  list.push(product);
  persistCustom(list);
  PRODUCTS.push(product);
  return product;
}

const PROMOS_KEY = "seller:promos";

export interface SellerPromo {
  productId: string;
  percent: number;
  startsAt: string;
  endsAt: string;
  createdAt: number;
}

export type PromoStatus = "agendada" | "ativa" | "encerrada";

type PromosMap = Record<string, SellerPromo>;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function isPromoActive(promo: SellerPromo, today: string): boolean {
  return today >= promo.startsAt && today <= promo.endsAt;
}

export function promoStatus(promo: SellerPromo, today: string): PromoStatus {
  if (today < promo.startsAt) return "agendada";
  if (today > promo.endsAt) return "encerrada";
  return "ativa";
}

function loadPromos(): PromosMap {
  const raw = read<unknown>(PROMOS_KEY, null);
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as PromosMap)
    : {};
}

function persistPromos(map: PromosMap) {
  write(PROMOS_KEY, map);
}

export function listPromos(): SellerPromo[] {
  return Object.values(loadPromos());
}

interface AppliedPromo {
  base: number;
  previousOldPrice?: number;
}

const appliedPromos: Record<string, AppliedPromo> = {};

function applyPromo(promo: SellerPromo): void {
  if (appliedPromos[promo.productId]) return;
  const p = PRODUCTS.find((x) => x.id === promo.productId);
  if (!p) return;
  appliedPromos[promo.productId] = {
    base: p.price,
    previousOldPrice: p.oldPrice,
  };
  p.oldPrice = p.price;
  p.price = Math.round(p.price * (1 - promo.percent / 100) * 100) / 100;
}

function revertPromo(promo: SellerPromo): void {
  const info = appliedPromos[promo.productId];
  const p = PRODUCTS.find((x) => x.id === promo.productId);
  if (!info || !p) return;
  p.price = info.base;
  p.oldPrice = info.previousOldPrice;
  delete appliedPromos[promo.productId];
}

export function addPromo(promo: Omit<SellerPromo, "createdAt">): void {
  const full: SellerPromo = { ...promo, createdAt: Date.now() };
  const map = loadPromos();
  map[full.productId] = full;
  persistPromos(map);
  if (isPromoActive(full, todayISO())) applyPromo(full);
}

export function removePromo(productId: string): void {
  const map = loadPromos();
  const promo = map[productId];
  delete map[productId];
  persistPromos(map);
  if (promo && isPromoActive(promo, todayISO())) revertPromo(promo);
}

// Restaura os produtos criados pela loja e aplica os overrides salvos aos
// objetos compartilhados do catálogo, para que todo o site enxergue as
// mudanças imediatamente.
for (const p of loadCustom()) {
  if (
    p &&
    typeof p.id === "string" &&
    typeof p.price === "number" &&
    !PRODUCTS.some((x) => x.id === p.id)
  ) {
    PRODUCTS.push(p);
  }
}

for (const [pid, o] of Object.entries(load())) {
  const p = PRODUCTS.find((x) => x.id === pid);
  if (!p) continue;
  if (o.price !== undefined) p.price = o.price;
  if (o.stock !== undefined) p.stock = o.stock;
  if (o.featured !== undefined) p.featured = o.featured;
}

const _today = todayISO();
for (const promo of Object.values(loadPromos())) {
  if (isPromoActive(promo, _today)) applyPromo(promo);
}

export type { Product };
