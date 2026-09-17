#!/usr/bin/env node
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(dir, "sketch.js"), "utf8");
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

let failed = 0;
function ok(name, cond, extra) {
  if (cond) console.log("  ok   " + name);
  else {
    failed++;
    console.log(" FAIL  " + name + (extra ? " — " + extra : ""));
  }
}

const sandbox = { console, Uint32Array, Math, module: { exports: {} }, exports: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: "sketch.js" });
const G = sandbox.Genart || sandbox.module.exports;

const A = "0xa3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1a3f1";
const B = "0x77c277c277c277c277c277c277c277c277c277c277c277c277c277c277c277c2";

console.log("genart-hash  (features / source)");

const fa1 = G.features(A);
const fa2 = G.features(A);
const fb = G.features(B);
ok(
  "features stable A",
  JSON.stringify(fa1) === JSON.stringify(fa2),
  JSON.stringify(fa1) + " vs " + JSON.stringify(fa2)
);
ok("features distinct A/B", JSON.stringify(fa1) !== JSON.stringify(fb));
ok("normalize pads hex", G.normalizeHash("0xa3f1a3f1").length === 66);
ok("text digest stable", G.digestText("harbor") === G.digestText("harbor"));
ok("sheet stable", G.sheetHashes(A, 9).join() === G.sheetHashes(A, 9).join());
ok("sheet size", G.sheetHashes(A, 9).length === 9);

const r1 = G.stream(A, "layout");
const r2 = G.stream(A, "layout");
const seq1 = [r1(), r1(), r1(), r1()];
const seq2 = [r2(), r2(), r2(), r2()];
ok("named stream repeatable", seq1.every((v, i) => v === seq2[i]));

ok("index mints hashes outside the renderer", /crypto\.getRandomValues/.test(html));
ok(
  "sketch.js never calls Math.random",
  /forbiddenRandom/.test(src) && !/Math\.random\s*\(\s*\)/.test(src)
);

if (failed) {
  console.log(failed + " failure(s)");
  process.exit(1);
}
console.log("all checks passed");
console.log("sample A", fa1);
console.log("sample B", fb);
