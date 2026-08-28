import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_STATE,
  parseState,
  buildParams,
  filterProducts,
  facetCounts,
  sortProducts,
  discountPct,
  paginate,
  countActiveFilters,
  PAGE_SIZE,
  type CatalogState,
} from "./catalog.ts";
import { PRODUCTS, CATEGORIES, type Product } from "../data/products.ts";

function state(partial: Partial<CatalogState> = {}): CatalogState {
  return { ...DEFAULT_STATE, ...partial };
}

const p0 = PRODUCTS[0];
const prices = PRODUCTS.map((p) => p.price);
const lo = Math.min(...prices);
const hi = Math.max(...prices);

test("sem filtros devolve o catálogo inteiro", () => {
  assert.equal(filterProducts(state()).length, PRODUCTS.length);
});

test("filtro q casa com o nome sem diferenciar caixa", () => {
  const out = filterProducts(state({ q: p0.name }));
  assert.ok(out.some((p) => p.id === p0.id));
  assert.ok(
    out.every((p) =>
      `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(
        p0.name.toLowerCase()
      )
    )
  );
});

test("filtro por categoria", () => {
  const cat = CATEGORIES.find((c) => c.key !== "todos")?.key ?? p0.category;
  const expected = PRODUCTS.filter((p) => p.category === cat);
  const out = filterProducts(state({ cat }));
  assert.equal(out.length, expected.length);
  assert.ok(out.every((p) => p.category === cat));
});

test("filtro por faixa de preço (inclusiva) e faixa vazia", () => {
  const all = filterProducts(state({ min: String(lo), max: String(hi) }));
  assert.equal(all.length, PRODUCTS.length);
  const none = filterProducts(state({ min: String(hi * 2) }));
  assert.equal(none.length, 0);
  const mid = filterProducts(state({ min: "100", max: "100000" }));
  const expected = PRODUCTS.filter(
    (p) => p.price >= 100 && p.price <= 100000
  ).length;
  assert.equal(mid.length, expected);
});

test("filtro por avaliação mínima", () => {
  const out = filterProducts(state({ rating: "4" }));
  const expected = PRODUCTS.filter((p) => p.rating >= 4).length;
  assert.ok(expected > 0);
  assert.equal(out.length, expected);
  assert.ok(out.every((p) => p.rating >= 4));
});

test("filtro por condição (novo/usado)", () => {
  const novos = filterProducts(state({ condition: "novo" }));
  assert.ok(novos.length > 0);
  assert.ok(novos.every((p) => p.condition === "novo"));
  const usados = filterProducts(state({ condition: "usado" }));
  assert.equal(
    usados.length,
    PRODUCTS.filter((p) => p.condition === "usado").length
  );
});

test("filtro por marca", () => {
  const out = filterProducts(state({ brand: p0.brand }));
  assert.ok(out.length > 0);
  assert.ok(out.every((p) => p.brand === p0.brand));
});

test("filtro por frete grátis", () => {
  const out = filterProducts(state({ freeShip: true }));
  const expected = PRODUCTS.filter((p) => p.freeShipping);
  assert.equal(out.length, expected.length);
  assert.ok(out.every((p) => p.freeShipping));
});

test("filtro por vendedor oficial", () => {
  const out = filterProducts(state({ official: true }));
  assert.ok(out.length > 0);
  assert.ok(out.length < PRODUCTS.length);
});

test("filtros combinados: categoria + marca + busca", () => {
  const out = filterProducts(
    state({ cat: p0.category, brand: p0.brand, q: p0.name })
  );
  assert.ok(out.some((p) => p.id === p0.id));
  assert.ok(
    out.every(
      (p) => p.category === p0.category && p.brand === p0.brand
    )
  );
});

function mk(
  id: string,
  price: number,
  sold: number,
  rating: number
): Product {
  return {
    id,
    name: id,
    category: "audio",
    price,
    rating,
    reviews: 1,
    sold,
    image: "https://example.com/a.jpg",
    gallery: [],
    description: "",
    highlights: [],
    brand: "X",
    sellerId: "seller-volttech",
    stock: 1,
    freeShipping: false,
    condition: "novo",
    warrantyMonths: 12,
    freeReturn: true,
    exchangeDays: 7,
    installments: { count: 1, value: price },
  };
}

const a = mk("a", 300, 10, 4.0);
const b = mk("b", 100, 50, 4.9);
const c = mk("c", 200, 30, 4.5);
const ids = (list: Product[]) => list.map((p) => p.id);

test("ordenações: menor preço, mais vendidos, maior preço, avaliação", () => {
  assert.deepEqual(ids(sortProducts([a, b, c], "menor-preco")), ["b", "c", "a"]);
  assert.deepEqual(ids(sortProducts([a, b, c], "mais-vendidos")), [
    "b",
    "c",
    "a",
  ]);
  assert.deepEqual(ids(sortProducts([a, b, c], "maior-preco")), ["a", "c", "b"]);
  assert.deepEqual(ids(sortProducts([a, b, c], "avaliacao")), ["b", "c", "a"]);
});

test("relevância preserva a ordem original e não muta a entrada", () => {
  const input = [a, b, c];
  const out = sortProducts(input, "relevancia");
  assert.deepEqual(ids(out), ["a", "b", "c"]);
  assert.deepEqual(ids(input), ["a", "b", "c"]);
});

test("paginação: primeira página", () => {
  const first = paginate(PRODUCTS, 1);
  assert.equal(first.length, Math.min(PAGE_SIZE, PRODUCTS.length));
  assert.equal(first[0].id, PRODUCTS[0].id);
});

test("paginação: última página", () => {
  const pages = Math.ceil(PRODUCTS.length / PAGE_SIZE);
  const last = paginate(PRODUCTS, pages);
  assert.equal(last.length, PRODUCTS.length % PAGE_SIZE || PAGE_SIZE);
  assert.equal(last[0].id, PRODUCTS[(pages - 1) * PAGE_SIZE].id);
});

test("paginação: página além do fim devolve vazia e página 0 vira 1", () => {
  const pages = Math.ceil(PRODUCTS.length / PAGE_SIZE);
  assert.deepEqual(paginate(PRODUCTS, pages + 1), []);
  assert.deepEqual(paginate(PRODUCTS, 0), paginate(PRODUCTS, 1));
  assert.deepEqual(paginate([], 1), []);
});

test("parseState: sem params devolve o estado padrão", () => {
  assert.deepEqual(parseState(new URLSearchParams()), DEFAULT_STATE);
});

test("parseState: lê todos os params válidos", () => {
  const s = parseState(
    new URLSearchParams(
      "q=fone&cat=audio&min=100&max=2000&rating=4&cond=usado&brand=Volt&ship=1&official=1&sort=menor-preco&page=3"
    )
  );
  assert.equal(s.q, "fone");
  assert.equal(s.cat, "audio");
  assert.equal(s.min, "100");
  assert.equal(s.max, "2000");
  assert.equal(s.rating, "4");
  assert.equal(s.condition, "usado");
  assert.equal(s.brand, "Volt");
  assert.equal(s.freeShip, true);
  assert.equal(s.official, true);
  assert.equal(s.sort, "menor-preco");
  assert.equal(s.page, 3);
});

test("parseState: valores inválidos caem no padrão", () => {
  const s = parseState(
    new URLSearchParams("sort=xyz&cat=nao-existe&cond=xyz&ship=0&page=0")
  );
  assert.equal(s.sort, "relevancia");
  assert.equal(s.cat, "todos");
  assert.equal(s.condition, "todos");
  assert.equal(s.freeShip, false);
  assert.equal(s.page, 1);
});

test("buildParams: estado padrão não gera params e round-trip preserva", () => {
  assert.equal(buildParams(DEFAULT_STATE).toString(), "");
  const params = new URLSearchParams(
    "q=fone&cat=audio&min=100&cond=usado&sort=menor-preco&page=3"
  );
  const s = parseState(params);
  assert.deepEqual(
    Object.fromEntries(buildParams(s).entries()),
    Object.fromEntries(params.entries())
  );
});

test("filterProducts memoiza por assinatura dos filtros", () => {
  const first = filterProducts(state({ cat: p0.category }));
  const second = filterProducts({ ...state({ cat: p0.category }) });
  assert.equal(first, second);
  assert.equal(
    first,
    filterProducts(state({ cat: p0.category, page: 2 }))
  );
  const other = filterProducts(
    state({ cat: p0.category, sort: "menor-preco" })
  );
  assert.notEqual(other, first);
});

test("countActiveFilters conta só filtros, não busca/página", () => {
  assert.equal(countActiveFilters(DEFAULT_STATE), 0);
  assert.equal(
    countActiveFilters(state({ min: "1", max: "2", rating: "4" })),
    3
  );
  assert.equal(countActiveFilters(state({ q: "fone", page: 9 })), 0);
});

test("facetCounts: marcas e categorias somam ao total do catálogo", () => {
  const fc = facetCounts(state());
  assert.equal(
    Object.values(fc.brands).reduce((a, b) => a + b, 0),
    PRODUCTS.length
  );
  assert.equal(
    Object.values(fc.cats).reduce((a, b) => a + b, 0),
    PRODUCTS.length
  );
});

test("facetCounts: totais acompanham os filtros ativos", () => {
  const fc = facetCounts(state({ min: "100", max: "100000" }));
  assert.equal(fc.total, filterProducts(state({ min: "100", max: "100000" })).length);
  assert.equal(
    Object.values(fc.cats).reduce((a, b) => a + b, 0),
    fc.total
  );
});

test("facetCounts: contagem de marca ignora o filtro de marca ativo", () => {
  const fc = facetCounts(state({ brand: p0.brand }));
  const expected = PRODUCTS.filter((p) => p.brand === p0.brand).length;
  assert.equal(fc.brands[p0.brand], expected);
  assert.equal(fc.total, filterProducts(state({ brand: p0.brand })).length);
});

test("discountPct: zero sem oldPrice e quando o preço não caiu", () => {
  const without = PRODUCTS.find((p) => p.oldPrice === undefined);
  if (without) assert.equal(discountPct(without), 0);
  const fake: Product = { ...p0, oldPrice: p0.price };
  assert.equal(discountPct(fake), 0);
  const fake2: Product = { ...p0, oldPrice: p0.price * 2 };
  assert.equal(discountPct(fake2), 50);
});

test("filtro somente com desconto devolve só produtos com oldPrice maior", () => {
  const out = filterProducts(state({ discountOnly: true }));
  assert.ok(out.length > 0);
  assert.ok(out.every((p) => p.oldPrice !== undefined && p.oldPrice > p.price));
  const expected = PRODUCTS.filter(
    (p) => p.oldPrice !== undefined && p.oldPrice > p.price
  ).length;
  assert.equal(out.length, expected);
});

test("filtro por parcelas: até 6x e 10x ou mais", () => {
  for (const inst of ["6", "10"] as const) {
    const out = filterProducts(state({ installments: inst }));
    const n = Number(inst);
    assert.ok(out.every((p) => p.installments.count >= n));
    const expected = PRODUCTS.filter((p) => p.installments.count >= n).length;
    assert.equal(out.length, expected);
  }
});

test("parseState/buildParams: install round-trip e valor inválido", () => {
  const s = parseState(new URLSearchParams("install=6"));
  assert.equal(s.installments, "6");
  assert.equal(buildParams(s).get("install"), "6");
  const bad = parseState(new URLSearchParams("install=99"));
  assert.equal(bad.installments, "");
  assert.equal(buildParams(bad).get("install"), null);
});

test("ordenação maior desconto ordena decrescente e empata no fim", () => {
  const out = filterProducts(state({ sort: "maior-desconto" }));
  const pcts = out.map((p) => discountPct(p));
  for (let i = 1; i < pcts.length; i++)
    assert.ok(pcts[i - 1] >= pcts[i]);
  const first = out[0];
  assert.ok(first.oldPrice !== undefined && first.oldPrice > first.price);
});
