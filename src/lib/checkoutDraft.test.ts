import test from "node:test";
import assert from "node:assert/strict";
import {
  loadDraft,
  saveDraft,
  clearDraft,
  type CheckoutDraft,
} from "./checkoutDraft.ts";
import { writeRaw } from "./storage.ts";

function draft(partial: Partial<CheckoutDraft> = {}): CheckoutDraft {
  return {
    step: 1,
    address: {
      name: "Maria",
      cpf: "",
      cep: "01001-000",
      street: "Rua X",
      number: "1",
      complement: "",
      city: "São Paulo",
      state: "SP",
    },
    shippingId: "std",
    payment: "pix",
    installments: 1,
    coinsUsed: 0,
    savedAt: 1700000000000,
    ...partial,
  };
}

test("saveDraft grava e loadDraft devolve o rascunho", () => {
  clearDraft();
  saveDraft(draft({ step: 2, coinsUsed: 5, installments: 3 }));
  const back = loadDraft();
  assert.ok(back);
  assert.equal(back.step, 2);
  assert.equal(back.address.cep, "01001-000");
  assert.equal(back.address.city, "São Paulo");
  assert.equal(back.shippingId, "std");
  assert.equal(back.coinsUsed, 5);
  assert.equal(back.installments, 3);
  assert.equal(back.payment, "pix");
});

test("loadDraft sem chave devolve null", () => {
  clearDraft();
  assert.equal(loadDraft(), null);
});

test("loadDraft ignora rascunho vazio (sem conteúdo de endereço)", () => {
  clearDraft();
  saveDraft(
    draft({
      step: 0,
      address: {
        name: "",
        cpf: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        city: "",
        state: "",
      },
    }),
  );
  assert.equal(loadDraft(), null);
});

test("loadDraft com passo fora do intervalo devolve null", () => {
  clearDraft();
  writeRaw("checkoutDraft", JSON.stringify({ step: 99 }));
  assert.equal(loadDraft(), null);
});

test("loadDraft tolera campos ausentes ou inválidos", () => {
  clearDraft();
  writeRaw(
    "checkoutDraft",
    JSON.stringify({
      step: 1,
      payment: "lixo",
      address: { name: "Maria", cep: "01001-000" },
    }),
  );
  const back = loadDraft();
  assert.ok(back);
  assert.equal(back.step, 1);
  assert.equal(back.payment, "pix");
  assert.equal(back.address.name, "Maria");
  assert.equal(back.address.street, "");
  assert.equal(back.installments, 1);
});

test("loadDraft sem endereço válido volta para a etapa 0", () => {
  clearDraft();
  writeRaw("checkoutDraft", JSON.stringify({ step: 3, payment: "boleto" }));
  const back = loadDraft();
  assert.ok(back);
  assert.equal(back.step, 0);
  assert.equal(back.payment, "boleto");
});

test("clearDraft apaga o rascunho", () => {
  saveDraft(draft());
  clearDraft();
  assert.equal(loadDraft(), null);
});
