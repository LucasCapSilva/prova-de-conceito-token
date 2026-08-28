import { test } from "node:test";
import * as assert from "node:assert/strict";
import { getReply, listReplies, saveReply } from "./reviewReplies.ts";

test("saveReply grava a resposta e getReply devolve", () => {
  const reply = saveReply("seller-volttech", "rev-a1", "Obrigado pela avaliação!");
  assert.ok(reply);
  assert.equal(reply.sellerId, "seller-volttech");
  assert.equal(getReply("rev-a1")?.text, "Obrigado pela avaliação!");
});

test("saveReply substitui a resposta anterior da mesma avaliação", () => {
  saveReply("seller-volttech", "rev-a2", "primeira versão");
  const reply = saveReply("seller-volttech", "rev-a2", "segunda versão");
  assert.equal(reply?.text, "segunda versão");
  assert.equal(getReply("rev-a2")?.text, "segunda versão");
});

test("texto em branco remove a resposta e devolve null", () => {
  saveReply("seller-volttech", "rev-a3", "oi");
  const gone = saveReply("seller-volttech", "rev-a3", "   ");
  assert.equal(gone, null);
  assert.equal(getReply("rev-a3"), undefined);
});

test("texto em branco sem resposta salva devolve null sem persistir", () => {
  const gone = saveReply("seller-volttech", "rev-a4", "");
  assert.equal(gone, null);
  assert.equal(getReply("rev-a4"), undefined);
});

test("listReplies devolve as respostas salvas", () => {
  const all = listReplies();
  assert.equal(all["rev-a1"]?.text, "Obrigado pela avaliação!");
  assert.equal(all["rev-a2"]?.text, "segunda versão");
});
