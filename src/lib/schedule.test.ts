import test from "node:test";
import assert from "node:assert/strict";
import {
  SCHEDULE_SLOTS,
  nextBusinessDays,
  slotLabel,
  toISODate,
} from "./schedule.ts";

test("nextBusinessDays: retorna a quantidade pedida", () => {
  assert.equal(nextBusinessDays(5).length, 5);
  assert.equal(nextBusinessDays(15).length, 15);
});

test("nextBusinessDays: apenas segunda a sexta, em ordem crescente", () => {
  const days = nextBusinessDays(15, new Date(2026, 7, 20));
  let prev: Date | null = null;
  for (const iso of days) {
    const d = new Date(iso + "T12:00:00");
    const dow = d.getDay();
    assert.notEqual(dow, 0, "domingo não entra");
    assert.notEqual(dow, 6, "sábado não entra");
    if (prev) assert.ok(d.getTime() > prev.getTime());
    prev = d;
  }
});

test("nextBusinessDays: a partir de sexta, o primeiro dia útil é segunda", () => {
  // 2026-08-21 é sexta-feira.
  const days = nextBusinessDays(5, new Date(2026, 7, 21));
  assert.deepEqual(days, [
    "2026-08-24",
    "2026-08-25",
    "2026-08-26",
    "2026-08-27",
    "2026-08-28",
  ]);
});

test("nextBusinessDays: a partir de domingo pula o fim de semana", () => {
  // 2026-08-23 é domingo.
  assert.equal(nextBusinessDays(1, new Date(2026, 7, 23))[0], "2026-08-24");
});

test("nextBusinessDays: atravessa o fim de semana entre contagens", () => {
  const days = nextBusinessDays(10, new Date(2026, 7, 21));
  // sexta 21 → seg 24..sex 28 (5) + seg 31..sex 04 (5)
  assert.equal(days[5], "2026-08-31");
  assert.equal(days[9], "2026-09-04");
});

test("slotLabel: retorna o rótulo do slot conhecido", () => {
  for (const s of SCHEDULE_SLOTS) {
    assert.equal(slotLabel(s.id), s.label);
  }
});

test("slotLabel: slot desconhecido vira string vazia", () => {
  assert.equal(slotLabel("inexistente"), "");
});

test("toISODate: zero-padding de mês e dia", () => {
  assert.equal(toISODate(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(toISODate(new Date(2026, 11, 31)), "2026-12-31");
});
