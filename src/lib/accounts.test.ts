import test from "node:test";
import assert from "node:assert/strict";
import {
  changePassword,
  createAccount,
  createLegacyAccount,
  findAccountByEmail,
  normalizeEmail,
  setAccountPassword,
  updateAccount,
  verifyLogin,
} from "./accounts.ts";
import {
  clearSession,
  consumeExpiredSession,
  createSession,
  getSession,
} from "./session.ts";
import { write } from "./storage.ts";

const uid = () => globalThis.crypto.randomUUID();

test("createAccount: cria conta com salt e hash, sem senha em claro", async () => {
  const email = `novo-${uid()}@exemplo.com`;
  const account = await createAccount("Nome Novo", email, "minha-senha-123");
  assert.equal(account.name, "Nome Novo");
  assert.equal(account.email, email);
  assert.match(account.salt, /^[0-9a-f]{32}$/);
  assert.match(account.hash, /^[0-9a-f]{64}$/);
  assert.equal(account.hash.includes("minha-senha-123"), false);
  assert.match(account.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  const ageMs = Date.now() - Date.parse(account.createdAt);
  assert.ok(ageMs >= 0 && ageMs < 10_000, "createdAt deve ser agora");
  const found = findAccountByEmail(email);
  assert.equal(found?.id, account.id);
});

test("unicidade de e-mail: cadastro duplicado falha, mesmo com caixa diferente", async () => {
  const email = `dup-${uid()}@exemplo.com`;
  await createAccount("Primeiro", email, "senha-123456");
  await assert.rejects(
    createAccount("Segundo", email.toUpperCase(), "outra-123456"),
    /já está cadastrado/,
  );
});

test("normalizeEmail: caixa baixa e espaços nas pontas", () => {
  assert.equal(normalizeEmail("  A@B.COM "), "a@b.com");
});

test("createLegacyAccount: conta sem senha; mesmo e-mail devolve a existente", async () => {
  const email = `legado-${uid()}@exemplo.com`;
  const first = createLegacyAccount("Migrado", ` Migrado ${email} `);
  assert.equal(first.salt, "");
  assert.equal(first.hash, "");
  assert.equal(first.email, `migrado ${email}`);
  const second = createLegacyAccount("Outro nome", first.email);
  assert.equal(second.id, first.id);
  // setAccountPassword habilita o login com senha depois
  await setAccountPassword(first.id, "nova-senha-1");
  const after = findAccountByEmail(first.email);
  assert.match(after?.salt ?? "", /^[0-9a-f]{32}$/);
  assert.match(after?.hash ?? "", /^[0-9a-f]{64}$/);
});

test("verifyLogin: aceita credencial correta e rejeita errada", async () => {
  const email = `login-${uid()}@exemplo.com`;
  await createAccount("Logado", email, "senha-certa-1");
  const ok = await verifyLogin(email, "senha-certa-1");
  assert.equal(ok?.email, email);
  assert.equal(await verifyLogin(email, "senha-errada-2"), null);
  assert.equal(await verifyLogin(`nada-${uid()}@exemplo.com`, "x"), null);
});

test("changePassword: exige senha atual certa e impede repetir a anterior", async () => {
  const account = await createAccount("Troca", `troca-${uid()}@exemplo.com`, "antiga-123");
  await assert.rejects(
    changePassword(account.id, "errada-456", "nova-123456"),
    /Senha atual incorreta/,
  );
  await assert.rejects(
    changePassword(account.id, "antiga-123", "antiga-123"),
    /não pode ser igual/,
  );
  await changePassword(account.id, "antiga-123", "nova-123456");
  assert.equal(await verifyLogin(account.email, "nova-123456") !== null, true);
  assert.equal(await verifyLogin(account.email, "antiga-123"), null);
});

test("updateAccount: aplica o patch e preserva o resto", () => {
  const account = createLegacyAccount("Perfil", `perfil-${uid()}@exemplo.com`);
  updateAccount(account.id, { sellerId: "loja-x", cpf: "123.456.789-09" });
  const after = findAccountByEmail(account.email);
  assert.equal(after?.sellerId, "loja-x");
  assert.equal(after?.cpf, "123.456.789-09");
  assert.equal(after?.name, "Perfil");
});

test("sessão: criada válida, expira e é consumida", () => {
  clearSession();
  createSession("acc-1");
  const fresh = getSession();
  assert.equal(fresh?.accountId, "acc-1");
  // sessão no passado expira no uso
  write("session", {
    accountId: "acc-1",
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  });
  assert.equal(consumeExpiredSession(), true);
  assert.equal(getSession(), null);
  clearSession();
});
