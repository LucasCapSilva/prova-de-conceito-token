import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BUDGET_KB = Number(process.env.BUDGET_KB ?? 250);
const budgetBytes = BUDGET_KB * 1024;

const assetsDir = join("dist", "assets");

let indexFile;
try {
  indexFile = readdirSync(assetsDir).find((name) => /^index-.*\.js$/.test(name));
} catch {
  console.error("budget: rode `npm run build` antes (dist/ nao existe).");
  process.exit(1);
}

if (!indexFile) {
  console.error("budget: nao encontrei dist/assets/index-*.js.");
  process.exit(1);
}

const raw = readFileSync(join(assetsDir, indexFile));
const gzipped = gzipSync(raw);

const kb = (bytes) => (bytes / 1024).toFixed(1);
console.log(`budget: ${indexFile}`);
console.log(`budget: raw    ${kb(raw.length)} kB`);
console.log(`budget: gzip   ${kb(gzipped.length)} kB`);
console.log(`budget: teto   ${BUDGET_KB} kB (gzip, BUDGET_KB para sobrescrever)`);

if (gzipped.length > budgetBytes) {
  console.error(`budget: FALHOU — o index gzipado passou de ${BUDGET_KB} kB.`);
  process.exit(1);
}

console.log("budget: ok");
