import test from "node:test";
import assert from "node:assert/strict";
import { GUIDES, getGuide, guideForCategory } from "./guides.ts";
import { CATEGORIES, PRODUCTS, type Category } from "./products.ts";

const productIds = new Set(PRODUCTS.map((p) => p.id));
const validCats = new Set(CATEGORIES.map((c) => c.key));

test("há cinco guias de compra", () => {
  assert.equal(GUIDES.length, 5);
});

test("slugs e ids são únicos e minúsculos", () => {
  const slugs = GUIDES.map((g) => g.slug);
  const ids = GUIDES.map((g) => g.id);
  assert.equal(new Set(slugs).size, slugs.length, "slug duplicado");
  assert.equal(new Set(ids).size, ids.length, "id duplicado");
  for (const g of GUIDES) {
    assert.equal(g.slug, g.slug.toLowerCase());
    assert.ok(g.slug.includes("-"), `slug sem hífen: ${g.slug}`);
  }
});

test("cada guia tem categoria válida, título, intro e seções", () => {
  for (const g of GUIDES) {
    assert.ok(validCats.has(g.category), `categoria inválida: ${g.category}`);
    assert.ok(g.title.length > 3);
    assert.ok(g.intro.length > 10);
    assert.ok(g.sections.length >= 3, `poucas seções em ${g.slug}`);
    for (const s of g.sections) {
      assert.ok(s.heading.length > 3);
      assert.ok(s.body.length > 10);
    }
  }
});

test("todos os produtos referenciados pelos guias existem no catálogo", () => {
  for (const g of GUIDES) {
    assert.ok(g.productIds.length >= 3, `poucos produtos em ${g.slug}`);
    const seen = new Set<string>();
    for (const id of g.productIds) {
      assert.ok(productIds.has(id), `produto inexistente ${id} em ${g.slug}`);
      assert.ok(!seen.has(id), `produto repetido ${id} em ${g.slug}`);
      seen.add(id);
    }
  }
});

test("cada categoria tem no máximo um guia", () => {
  const perCat = new Map<Category, number>();
  for (const g of GUIDES) {
    perCat.set(g.category, (perCat.get(g.category) ?? 0) + 1);
  }
  for (const [cat, n] of perCat) {
    assert.ok(n <= 1, `múltiplos guias para ${cat}`);
  }
});

test("getGuide encontra por slug e falha com slug ausente", () => {
  const first = GUIDES[0];
  assert.ok(getGuide(first.slug));
  assert.equal(getGuide(first.slug)?.id, first.id);
  assert.equal(getGuide("nao-existe"), undefined);
});

test("guideForCategory mapeia categoria para o guia correto", () => {
  for (const g of GUIDES) {
    const found = guideForCategory(g.category);
    assert.equal(found?.slug, g.slug);
  }
});

test("guideForCategory retorna undefined sem guia", () => {
  const catsWithGuide = new Set(GUIDES.map((g) => g.category));
  const without = [...validCats].find((c) => !catsWithGuide.has(c as Category));
  if (without) {
    assert.equal(guideForCategory(without as Category), undefined);
  } else {
    assert.fail("esperava uma categoria sem guia");
  }
});
