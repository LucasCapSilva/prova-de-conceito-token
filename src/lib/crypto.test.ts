import test from "node:test";
import assert from "node:assert/strict";
import {
  bytesToHex,
  generateSalt,
  hashPassword,
  hexToBytes,
  verifyPassword,
} from "./crypto.ts";

test("hash determinístico: mesma senha e mesmo salt dão o mesmo hash", async () => {
  const salt = generateSalt();
  const a = await hashPassword("senha-forte-123", salt);
  const b = await hashPassword("senha-forte-123", salt);
  assert.equal(a, b);
  // 32 bytes de saída em hexadecimal
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("salts diferentes geram hashes diferentes para a mesma senha", async () => {
  const s1 = generateSalt();
  const s2 = generateSalt();
  assert.notEqual(s1, s2);
  const a = await hashPassword("senha-forte-123", s1);
  const b = await hashPassword("senha-forte-123", s2);
  assert.notEqual(a, b);
});

test("senhas diferentes geram hashes diferentes com o mesmo salt", async () => {
  const salt = generateSalt();
  const a = await hashPassword("uma-coisa", salt);
  const b = await hashPassword("outra-coisa", salt);
  assert.notEqual(a, b);
});

test("verifyPassword: aceita a senha correta e rejeita a errada", async () => {
  const salt = generateSalt();
  const hash = await hashPassword("segredo-123", salt);
  assert.equal(await verifyPassword("segredo-123", salt, hash), true);
  assert.equal(await verifyPassword("segredo-124", salt, hash), false);
});

test("verifyPassword: hash inválido devolve false em vez de lançar", async () => {
  const salt = generateSalt();
  assert.equal(await verifyPassword("qualquer", salt, "não-é-hex"), false);
  assert.equal(await verifyPassword("qualquer", salt, ""), false);
});

test("generateSalt: 16 bytes em hex, sempre diferente", () => {
  const s = generateSalt();
  assert.match(s, /^[0-9a-f]{32}$/);
  assert.notEqual(generateSalt(), generateSalt());
});

test("bytesToHex/hexToBytes: ida e volta", () => {
  const bytes = new Uint8Array([0, 1, 254, 255, 16]);
  const hex = bytesToHex(bytes);
  assert.equal(hex, "0001feff10");
  assert.deepEqual(hexToBytes(hex), bytes);
  // ímpar e não hex lançam
  assert.throws(() => hexToBytes("abc"));
  assert.throws(() => hexToBytes("zz"));
});
