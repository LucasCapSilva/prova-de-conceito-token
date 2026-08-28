import test from "node:test";
import assert from "node:assert/strict";
import {
  maskCPF,
  maskPhone,
  maskCEP,
  maskCard,
  maskExpiry,
  luhnValid,
  expiryValid,
  cvvValid,
  cpfValid,
} from "./masks.ts";

test("Luhn: cartões válidos conhecidos", () => {
  assert.equal(luhnValid("4242424242424242"), true);
  assert.equal(luhnValid("5555555555554444"), true);
  assert.equal(luhnValid("4000000000000002"), true);
});

test("Luhn: cartões inválidos", () => {
  assert.equal(luhnValid("4242424242424241"), false);
  assert.equal(luhnValid("1234567890123456"), false);
  // 12 dígitos é curto demais
  assert.equal(luhnValid("123456789012"), false);
  // 17 dígitos é longo demais
  assert.equal(luhnValid("42424242424242421"), false);
});

test("Luhn: aceita texto sujo com espaços e hífens", () => {
  assert.equal(luhnValid("4242 4242 4242 4242"), true);
  assert.equal(luhnValid("4242-4242-4242-4242"), true);
  assert.equal(luhnValid("4242 4242 4242 4241"), false);
});

test("validade: mês correto expira no mês vigente", () => {
  const now = new Date();
  const cy = now.getFullYear() % 100;
  const cm = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  // mês corrente ainda é válido
  assert.equal(expiryValid(`${pad(cm)}/${pad(cy)}`), true);
  // mês seguinte é válido
  const [ny, nm] = cm === 12 ? [cy + 1, 1] : [cy, cm + 1];
  assert.equal(expiryValid(`${pad(nm)}/${pad(ny)}`), true);
  // ano seguinte é válido
  assert.equal(expiryValid(`12/${pad(cy + 1)}`), true);
  // mês anterior já expirou
  const [py, pm] = cm === 1 ? [cy - 1, 12] : [cy, cm - 1];
  assert.equal(expiryValid(`${pad(pm)}/${pad(py)}`), false);
  // ano anterior expirou
  assert.equal(expiryValid(`12/${pad(cy - 1)}`), false);
});

test("validade: formatos e meses inválidos", () => {
  assert.equal(expiryValid("13/28"), false);
  assert.equal(expiryValid("00/28"), false);
  assert.equal(expiryValid("1/28"), false);
  assert.equal(expiryValid("12/281"), false);
  assert.equal(expiryValid(""), false);
});

test("CVV: 3 e 4 dígitos são válidos, demais não", () => {
  assert.equal(cvvValid("123"), true);
  assert.equal(cvvValid("1234"), true);
  assert.equal(cvvValid("12"), false);
  assert.equal(cvvValid("12345"), false);
  assert.equal(cvvValid("1 2 3"), true);
});

test("máscara de CPF: entrada parcial cresce passo a passo", () => {
  assert.equal(maskCPF(""), "");
  assert.equal(maskCPF("1"), "1");
  assert.equal(maskCPF("123"), "123");
  assert.equal(maskCPF("1234"), "123.4");
  assert.equal(maskCPF("123456"), "123.456");
  assert.equal(maskCPF("1234567"), "123.456.7");
  assert.equal(maskCPF("12345678"), "123.456.78");
  assert.equal(maskCPF("123456789"), "123.456.789");
  assert.equal(maskCPF("1234567890"), "123.456.789-0");
  assert.equal(maskCPF("12345678901"), "123.456.789-01");
});

test("máscara de CPF: colagem de texto sujo e excesso de dígitos", () => {
  assert.equal(maskCPF("123.456.789-01"), "123.456.789-01");
  assert.equal(maskCPF("123 456 789 01"), "123.456.789-01");
  assert.equal(maskCPF("12345678901"), "123.456.789-01");
  // 12 dígitos: o último é cortado
  assert.equal(maskCPF("123456789012"), "123.456.789-01");
});

test("CPF: dígitos verificadores conferidos", () => {
  assert.equal(cpfValid("52998224725"), true);
  assert.equal(cpfValid("11144477735"), true);
  assert.equal(cpfValid("12345678909"), false);
  // todos iguais é inválido por regra
  assert.equal(cpfValid("11111111111"), false);
  // aceita pontuação
  assert.equal(cpfValid("529.982.247-25"), true);
  // 10 dígitos é curto
  assert.equal(cpfValid("5299822472"), false);
});

test("máscara de telefone: parcial e completo", () => {
  assert.equal(maskPhone(""), "");
  assert.equal(maskPhone("1"), "(1");
  assert.equal(maskPhone("11"), "(11");
  assert.equal(maskPhone("119"), "(11) 9");
  assert.equal(maskPhone("1198765"), "(11) 9876-5");
  assert.equal(maskPhone("11987654"), "(11) 9876-54");
  assert.equal(maskPhone("11987654321"), "(11) 98765-4321");
});

test("máscara de telefone: colagem suja e excesso", () => {
  assert.equal(maskPhone("(11) 98765-4321"), "(11) 98765-4321");
  assert.equal(maskPhone("11 98765-4321"), "(11) 98765-4321");
  // 12 dígitos: o último é cortado
  assert.equal(maskPhone("119876543210"), "(11) 98765-4321");
});

test("máscara de CEP: parcial e colagem", () => {
  assert.equal(maskCEP(""), "");
  assert.equal(maskCEP("01"), "01");
  assert.equal(maskCEP("01000"), "01000");
  assert.equal(maskCEP("010000"), "01000-0");
  assert.equal(maskCEP("01000000"), "01000-000");
  assert.equal(maskCEP("01000-000"), "01000-000");
  // 9 dígitos: o último é cortado
  assert.equal(maskCEP("010000001"), "01000-000");
});

test("máscara de cartão: parcial e colagem", () => {
  assert.equal(maskCard(""), "");
  assert.equal(maskCard("4242"), "4242");
  assert.equal(maskCard("42424"), "4242 4");
  assert.equal(maskCard("42424242"), "4242 4242");
  assert.equal(maskCard("4242424242424242"), "4242 4242 4242 4242");
  assert.equal(maskCard("4242-4242-4242-4242"), "4242 4242 4242 4242");
  // 17 dígitos: o último é cortado
  assert.equal(maskCard("42424242424242421"), "4242 4242 4242 4242");
});

test("máscara de validade: parcial e colagem", () => {
  assert.equal(maskExpiry(""), "");
  assert.equal(maskExpiry("1"), "1");
  assert.equal(maskExpiry("12"), "12");
  assert.equal(maskExpiry("123"), "12/3");
  assert.equal(maskExpiry("1234"), "12/34");
  assert.equal(maskExpiry("12/34"), "12/34");
  // 5 dígitos: o último é cortado
  assert.equal(maskExpiry("12345"), "12/34");
});
