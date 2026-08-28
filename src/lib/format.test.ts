import test from "node:test";
import assert from "node:assert/strict";
import { formatBRL, formatDate, formatCompact, formatInstallments } from "./format.ts";

test("formatBRL: zero", () => {
  const out = formatBRL(0);
  assert.ok(out.includes("R$"));
  assert.ok(out.includes("0,00"));
});

test("formatBRL: valor negativo", () => {
  const out = formatBRL(-100);
  assert.ok(out.startsWith("-"));
  assert.ok(out.includes("100,00"));
});

test("formatBRL: milhar e separadores", () => {
  assert.ok(formatBRL(1000).includes("1.000,00"));
  assert.ok(formatBRL(1234567.89).includes("1.234.567,89"));
});

test("formatCompact: abaixo de mil mantém o número", () => {
  assert.equal(formatCompact(999), "999");
});

test("formatCompact: virada de mil (999 -> 1000)", () => {
  assert.equal(formatCompact(1000), "1 mil");
  assert.equal(formatCompact(1234), "1,2 mil");
});

test("formatCompact: perto de e na virada de milhão", () => {
  assert.equal(formatCompact(999999), "1.000 mil");
  assert.equal(formatCompact(1000000), "1 mi");
  assert.equal(formatCompact(1500000), "1,5 mi");
});

test("formatInstallments: à vista (count 1) não tem parcelamento", () => {
  const out = formatInstallments({ count: 1, value: 500 });
  assert.equal(out, formatBRL(500));
  assert.ok(!out.includes("x de"));
  assert.ok(!out.includes("sem juros"));
});

test("formatInstallments: parcelado (count > 1) mostra parcelas e sem juros", () => {
  const out = formatInstallments({ count: 12, value: 89.9 });
  assert.ok(out.startsWith("12x de "));
  assert.ok(out.endsWith(" sem juros"));
  assert.ok(out.includes(formatBRL(89.9)));
});

test("formatDate: data inválida lança erro (não retorna 'Invalid Date')", () => {
  assert.throws(() => formatDate("não-é-data"));
});

test("formatDate: data válida por string e por Date", () => {
  const byString = formatDate("2026-08-25");
  const byDate = formatDate(new Date("2026-08-25T12:00:00"));
  assert.equal(typeof byString, "string");
  assert.equal(typeof byDate, "string");
  assert.ok(byString.length > 0);
  assert.ok(byDate.length > 0);
  assert.ok(!byString.includes("Invalid"));
  assert.ok(!byDate.includes("Invalid"));
});
