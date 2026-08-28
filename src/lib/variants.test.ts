import test from "node:test";
import assert from "node:assert/strict";
import {
  variantKeyFromSelection,
  parseVariantKey,
  optionsForSelection,
  isSelectionComplete,
  missingGroups,
  selectionPriceDelta,
  stockForSelection,
  unitPriceFor,
  maxQtyFor,
  describeSelection,
  priceChange,
} from "./variants.ts";
import type { Product } from "../data/products.ts";

function mkProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod",
    name: "Produto",
    category: "audio",
    price: 500,
    rating: 4.5,
    reviews: 10,
    sold: 100,
    image: "https://example.com/a.jpg",
    gallery: ["https://example.com/a.jpg"],
    description: "descricao",
    highlights: [],
    brand: "Marca",
    sellerId: "seller-volttech",
    stock: 20,
    freeShipping: false,
    condition: "novo",
    warrantyMonths: 12,
    freeReturn: false,
    exchangeDays: 7,
    installments: { count: 10, value: 50 },
    ...overrides,
  };
}

const comVar = mkProduct({
  id: "fone-var",
  price: 500,
  stock: 20,
  variants: [
    {
      id: "cor",
      label: "Cor",
      options: [
        { id: "preto", name: "Preto", hex: "#000000", stock: 5 },
        { id: "branco", name: "Branco", hex: "#ffffff", stock: 0 },
      ],
    },
    {
      id: "cap",
      label: "Capacidade",
      options: [
        { id: "128", name: "128GB", stock: 10 },
        { id: "256", name: "256GB", priceDelta: 100, stock: 3 },
      ],
    },
  ],
});

const semVar = mkProduct({ id: "simples", price: 300, stock: 7 });

test("preço e estoque refletem a combinação escolhida", () => {
  const key = "cor:preto|cap:256";
  assert.equal(selectionPriceDelta(comVar, parseVariantKey(key)), 100);
  assert.equal(unitPriceFor(comVar, key), 600);
  assert.equal(stockForSelection(comVar, parseVariantKey(key)), 3);
  assert.equal(maxQtyFor(comVar, key), 3);
});

test("combinação esgotada zera o estoque sem mexer no preço", () => {
  const key = "cor:branco|cap:128";
  assert.equal(stockForSelection(comVar, parseVariantKey(key)), 0);
  assert.equal(maxQtyFor(comVar, key), 0);
  assert.equal(unitPriceFor(comVar, key), 500);
});

test("opções da seleção devolvem os objetos escolhidos", () => {
  const opts = optionsForSelection(comVar, { cor: "preto", cap: "256" });
  assert.equal(opts.length, 2);
  assert.deepEqual(
    opts.map((o) => o.id),
    ["preto", "256"]
  );
});

test("produto sem variação: seleção vazia já é completa", () => {
  assert.equal(variantKeyFromSelection(semVar, {}), null);
  assert.equal(isSelectionComplete(semVar, {}), true);
  assert.deepEqual(missingGroups(semVar, {}), []);
  assert.equal(unitPriceFor(semVar, null), 300);
  assert.equal(maxQtyFor(semVar, null), 7);
  assert.equal(describeSelection(semVar, null), "");
});

test("seleção parcial não é completa e lista o que falta", () => {
  assert.equal(isSelectionComplete(comVar, {}), false);
  assert.deepEqual(missingGroups(comVar, {}), ["Cor", "Capacidade"]);
  assert.equal(isSelectionComplete(comVar, { cor: "preto" }), false);
  assert.deepEqual(missingGroups(comVar, { cor: "preto" }), ["Capacidade"]);
  assert.equal(
    isSelectionComplete(comVar, { cor: "preto", cap: "128" }),
    true
  );
});

test("chave e seleção fazem round-trip, e a descrição junta os nomes", () => {
  assert.equal(
    variantKeyFromSelection(comVar, { cor: "branco", cap: "256" }),
    "cor:branco|cap:256"
  );
  assert.deepEqual(parseVariantKey("cor:preto|cap:256"), {
    cor: "preto",
    cap: "256",
  });
  assert.deepEqual(parseVariantKey(null), {});
  assert.equal(describeSelection(comVar, "cor:preto|cap:256"), "Preto · 256GB");
});

test("priceChange: sem mudança não avisa (null)", () => {
  assert.equal(priceChange(100, 100), null);
  assert.equal(priceChange(100, 100.001), null);
});

test("priceChange: preço subiu devolve delta positivo", () => {
  assert.deepEqual(priceChange(100, 120.5), {
    added: 100,
    current: 120.5,
    delta: 20.5,
  });
});

test("priceChange: preço caiu devolve delta negativo", () => {
  assert.deepEqual(priceChange(100, 89.99), {
    added: 100,
    current: 89.99,
    delta: -10.01,
  });
});

test("priceChange: added inválido (zero, negativo, NaN) não avisa", () => {
  assert.equal(priceChange(0, 100), null);
  assert.equal(priceChange(-5, 100), null);
  assert.equal(priceChange(NaN, 100), null);
});

test("priceChange: arredonda o delta em centavos", () => {
  assert.equal(priceChange(100, 100.01)?.delta, 0.01);
  assert.equal(priceChange(100, 99.99)?.delta, -0.01);
});
