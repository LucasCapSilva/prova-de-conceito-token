import test from "node:test";
import assert from "node:assert/strict";
import { frequentTerms, commentMentions } from "./reviewSummary.ts";

test("frequentTerms conta ocorrências por comentário e ordena por frequência", () => {
  const terms = frequentTerms([
    "A bateria dura muito, a bateria é ótima.",
    "O som da bateria me impressionou.",
    "O som é bom e o preço justo.",
  ]);
  assert.equal(terms[0]?.word, "bateria");
  assert.equal(terms[0]?.count, 3);
  assert.equal(terms[1]?.word, "som");
  assert.equal(terms[1]?.count, 2);
});

test("frequentTerms normaliza acentuação e caixa", () => {
  const terms = frequentTerms([
    "Entrega rápida.",
    "RÁPIDA demais, foi rápida.",
  ]);
  assert.equal(terms[0]?.word, "rapida");
  assert.equal(terms[0]?.count, 3);
});

test("frequentTerms ignora stopwords e palavras curtas", () => {
  const terms = frequentTerms([
    "que bom que chegou, que bom",
    "chegou de novo, chegou de novo",
  ]);
  const words = terms.map((t) => t.word);
  assert.ok(!words.includes("que"));
  assert.ok(!words.includes("bom"));
  assert.ok(words.includes("chegou"));
});

test("frequentTerms exige o termo em pelo menos 2 comentários", () => {
  const terms = frequentTerms([
    "produto excelente, entrega rápida.",
    "embalagem perfeita.",
  ]);
  assert.deepEqual(terms, []);
});

test("frequentTerms remove pontuação colada na palavra", () => {
  const terms = frequentTerms([
    "A tela! A tela é linda.",
    "tela linda, tela ótima.",
  ]);
  assert.equal(terms[0]?.word, "tela");
  assert.equal(terms[0]?.count, 4);
});

test("frequentTerms respeita o limite", () => {
  const comments = [
    "alfa beta gama delta.",
    "alfa beta gama delta.",
  ];
  const terms = frequentTerms(comments, 2);
  assert.equal(terms.length, 2);
  assert.ok(terms.every((t) => t.count === 2));
});

test("commentMentions compara sem acento nem caixa", () => {
  assert.ok(commentMentions("rápida", "A entrega foi RÁPIDA."));
  assert.ok(commentMentions("Bateria", "a bateria durou"));
  assert.ok(!commentMentions("tecla", "a tela é boa"));
  assert.ok(!commentMentions("", "qualquer coisa"));
});
