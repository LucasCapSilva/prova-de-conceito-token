import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  getReport,
  listReports,
  reportReview,
  reportedIds,
} from "./reviewReports.ts";
import { write } from "./storage.ts";

test("reportReview grava a denúncia e getReport devolve", () => {
  const report = reportReview(
    "notebook-x",
    "den-rev-1",
    "Spam ou propaganda",
    "muito spam",
  );
  assert.ok(report);
  assert.equal(report.productId, "notebook-x");
  assert.equal(report.comment, "muito spam");
  const found = getReport("den-rev-1");
  assert.equal(found?.reason, "Spam ou propaganda");
});

test("segunda denúncia sobre a mesma avaliação substitui a anterior", () => {
  reportReview("notebook-x", "den-rev-2", "Conteúdo ofensivo", "primeiro");
  const second = reportReview(
    "notebook-x",
    "den-rev-2",
    "Conteúdo irrelevante",
    "segundo",
  );
  assert.equal(second?.reason, "Conteúdo irrelevante");
  assert.equal(getReport("den-rev-2")?.reason, "Conteúdo irrelevante");
  assert.equal(getReport("den-rev-2")?.comment, "segundo");
});

test("reviewId em branco não grava nada", () => {
  assert.equal(
    reportReview("notebook-x", "   ", "Spam ou propaganda"),
    null,
  );
  assert.equal(getReport("   "), undefined);
});

test("reportedIds marca as avaliações denunciadas", () => {
  const ids = reportedIds();
  assert.ok(ids.has("den-rev-1"));
  assert.ok(ids.has("den-rev-2"));
  assert.ok(!ids.has("rev-nao-denunciada"));
});

test("listReports ordena por data, da mais recente para a mais antiga", () => {
  write("review:reports", {
    "den-ordem-a": {
      productId: "p",
      reviewId: "den-ordem-a",
      reason: "Spam ou propaganda",
      comment: "",
      reportedAt: 1000,
    },
    "den-ordem-b": {
      productId: "p",
      reviewId: "den-ordem-b",
      reason: "Spam ou propaganda",
      comment: "",
      reportedAt: 3000,
    },
    "den-ordem-c": {
      productId: "p",
      reviewId: "den-ordem-c",
      reason: "Spam ou propaganda",
      comment: "",
      reportedAt: 2000,
    },
  });
  const ids = listReports().map((r) => r.reviewId);
  assert.deepEqual(ids, ["den-ordem-b", "den-ordem-c", "den-ordem-a"]);
});
