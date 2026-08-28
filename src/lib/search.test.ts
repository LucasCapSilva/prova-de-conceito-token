import { test } from "node:test";
import assert from "node:assert/strict";
import { levenshtein, searchMatch, normalizeSearch } from "./search.ts";

test("levenshtein: distâncias conhecidas", () => {
  assert.equal(levenshtein("kitten", "sitting"), 3);
  assert.equal(levenshtein("flaw", "lawn"), 2);
  assert.equal(levenshtein("a", "a"), 0);
  assert.equal(levenshtein("", "abc"), 3);
});

test("levenshtein: limite max corta o cálculo cedo", () => {
  // distância real é 3; com max 2 devolve 3 (max + 1)
  assert.equal(levenshtein("kitten", "sitting", 2), 3);
  // diferença de tamanho maior que max: curto-circuito
  assert.equal(levenshtein("abc", "abcdef", 1), 2);
});

test("searchMatch: consulta vazia casa com tudo", () => {
  assert.equal(searchMatch("Notebook Dell", "   "), true);
  assert.equal(searchMatch("", "x"), false);
});

test("searchMatch: substring case-insensitive casa", () => {
  assert.equal(searchMatch("Notebook Dell Inspiron", "notebook"), true);
  assert.equal(searchMatch("Notebook Dell Inspiron", "NOTEBOOK"), true);
  // palavra longa e sem relação não casa
  assert.equal(searchMatch("Notebook Dell Inspiron", "kitchenware"), false);
});

test("searchMatch: erro de digitação em termo com 5+ letras (até 2 edições)", () => {
  // "notbook" (7) vs "notebook" (8): 1 inserção
  assert.equal(searchMatch("Notebook Dell Inspiron", "notbook"), true);
  // "notbqok" vs "notebook": 2 edições
  assert.equal(searchMatch("Notebook Dell Inspiron", "notbqok"), true);
  // "xyzwv" vs "notebook": longe demais
  assert.equal(searchMatch("Notebook Dell Inspiron", "xyzwv"), false);
});

test("searchMatch: termo menor que 5 letras usa substring", () => {
  // "caf" casa por substring em "cafeteira"
  assert.equal(searchMatch("Cafeteira Automática", "caf"), true);
  // termo sem relação não casa
  assert.equal(searchMatch("Cafeteira Automática", "xyz"), false);
});

test("normalizeSearch: remove acentos e normaliza caixa", () => {
  assert.equal(normalizeSearch("Cafeteíra"), "cafeteira");
  // "Ã" decompõe em A + tilde, então "LEITÃO" vira "leitao"
  assert.equal(normalizeSearch("CAFÉ COM LEITÃO"), "cafe com leitao");
  assert.equal(normalizeSearch("Saída 10%"), "saida 10%");
});

test("searchMatch: acentuação do texto casa com consulta sem acento", () => {
  // "cafeteira" casa com "Cafeteíra" e com "Cafeteira"
  assert.equal(searchMatch("Cafeteíra Automática", "cafeteira"), true);
  assert.equal(searchMatch("Cafeteira Automática", "cafeteira"), true);
  // e o contrário: consulta acentuada casa com texto sem acento
  assert.equal(searchMatch("Cafeteira Automática", "cafeteíra"), true);
  // caixa não importa
  assert.equal(searchMatch("CAFETEIRA AUTOMÁTICA", "cafeteíra"), true);
  // acento na consulta não impede o match: "fõ" vira "fo" e casa "fone"
  assert.equal(searchMatch("Fone Premium", "fõ"), true);
  // termo acentuado sem relação não casa
  assert.equal(searchMatch("Notebook Dell", "cafeteíra"), false);
});

test("searchMatch: todos os termos precisam casar", () => {
  // "fone" casa, "headset" casa no texto "headphone"? não: substring não casa
  assert.equal(searchMatch("Fone de Ouvido", "fone bluetooth"), false);
  assert.equal(
    searchMatch("Fone de Ouvido Bluetooth", "fone bluetooth"),
    true,
  );
});

test("sinônimos: fone casa com headphone e headset", () => {
  assert.equal(searchMatch("Headphone Bluetooth", "fone"), true);
  assert.equal(searchMatch("Headset Gamer 7.1", "fone"), true);
  // plural casa por substring
  assert.equal(searchMatch("Fones de Ouvido", "headset"), true);
  // e no sentido inverso
  assert.equal(searchMatch("Fone de Ouvido", "headphone"), true);
});

test("sinônimos: celular casa com smartphone", () => {
  assert.equal(searchMatch("Smartphone 128GB", "celular"), true);
  assert.equal(searchMatch("Celular 5G", "smartphone"), true);
});

test("sinônimos: tv casa com televisão", () => {
  assert.equal(searchMatch("Smart TV 55 polegadas", "televisao"), true);
  assert.equal(searchMatch("Televisão 4K UHD", "tv"), true);
});

test("sinônimos: sem relação continua não casando", () => {
  assert.equal(searchMatch("Caixa de Som Portátil", "fone"), false);
  assert.equal(searchMatch("Caixa de Som Portátil", "celular"), false);
});
