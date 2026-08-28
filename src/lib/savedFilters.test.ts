import test from "node:test";
import assert from "node:assert/strict";
import {
  getSavedFilters,
  saveFilter,
  removeSavedFilter,
  type SavedFilter,
} from "./savedFilters.ts";
import { writeRaw, remove } from "./storage.ts";
import { DEFAULT_STATE, type CatalogState } from "./catalog.ts";

function state(partial: Partial<CatalogState> = {}): CatalogState {
  return { ...DEFAULT_STATE, ...partial };
}

test("saveFilter grava e getSavedFilters devolve na ordem", () => {
  remove("savedFilters");
  const a = saveFilter("Minha lista", state({ brand: "Samsung" }));
  const b = saveFilter("Outra", state({ discountOnly: true }));
  assert.ok(a.length === 1);
  assert.equal(b.length, 2);
  const list = getSavedFilters();
  assert.equal(list.length, 2);
  assert.equal(list[0].name, "Minha lista");
  assert.equal(list[0].state.brand, "Samsung");
  assert.equal(list[1].name, "Outra");
  assert.equal(list[1].state.discountOnly, true);
  assert.ok(list[0].id !== list[1].id);
});

test("ids gerados por saveFilter são únicos", () => {
  remove("savedFilters");
  const list: SavedFilter[] = [];
  for (let i = 0; i < 50; i += 1) list.push(...saveFilter(`f${i}`, state()));
  const ids = new Set(list.map((f) => f.id));
  assert.equal(ids.size, 50);
});

test("removeSavedFilter remove apenas o id informado", () => {
  remove("savedFilters");
  const a = saveFilter("A", state({ min: "100" }));
  saveFilter("B", state({ max: "200" }));
  const id = a[0].id;
  const rest = removeSavedFilter(id);
  assert.equal(rest.length, 1);
  assert.equal(rest[0].name, "B");
  assert.equal(rest[0].state.max, "200");
});

test("removeSavedFilter com id inexistente mantém a lista", () => {
  remove("savedFilters");
  saveFilter("A", state());
  assert.equal(removeSavedFilter("inexistente").length, 1);
});

test("getSavedFilters ignora entradas corrompidas", () => {
  remove("savedFilters");
  const good = saveFilter("Ok", state({ rating: "4" }));
  writeRaw(
    "savedFilters",
    JSON.stringify([
      { id: "ruim", name: 123 },
      "lixo",
      null,
      good[0],
    ]),
  );
  const list = getSavedFilters();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, good[0].id);
  assert.equal(list[0].state.rating, "4");
});

test("getSavedFilters com chave ausente devolve lista vazia", () => {
  remove("savedFilters");
  assert.deepEqual(getSavedFilters(), []);
});
