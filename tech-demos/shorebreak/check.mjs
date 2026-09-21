import fs from "fs";
import vm from "vm";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(dir, "wave.js"), "utf8");
const sandbox = { console, Math, performance: { now: () => 0 } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const Shore = sandbox.Shore;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function walk(frame) {
  const ops = frame.ops;
  assert(ops && ops.length > 8, "expected a drawn scene");
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op.k === "strip") {
      assert(op.a.length === op.b.length && op.a.length >= 2, "strip sides mismatch");
      for (const chain of [op.a, op.b]) {
        for (const p of chain) {
          assert(Number.isFinite(p.x) && Number.isFinite(p.y), "non-finite vertex");
          assert(p.x > -2 && p.x < 3 && p.y > -2 && p.y < 3, "vertex out of range");
        }
      }
    } else if (op.k === "dot") {
      assert(Number.isFinite(op.x) && Number.isFinite(op.y) && Number.isFinite(op.rad), "bad dot");
      assert(op.a > 0 && op.rad > 0, "empty dot");
    } else {
      throw new Error("unknown op " + op.k);
    }
  }
}

const set = Shore.createSet(4);
assert(set.palette.name === "Dawn glass", "seed 4 should be dawn glass");

const hero = Shore.frame(set, 0, 0.22);
walk(hero);
assert(hero.label === "Curling", "hero label was " + hero.label);
assert(hero.debug.maxHang > 0.06, "hero lip hang too small: " + hero.debug.maxHang);
assert(hero.debug.swash > 0.45, "hero swash missing: " + hero.debug.swash);
assert(hero.debug.phases[0] > 0.3 && hero.debug.phases[0] < 0.48, "hero wave not pitching");

let sawCrash = false;
const cycle = set.cycle;
for (let step = 0; step <= 30; step++) {
  const t = (step / 30) * cycle;
  const frame = Shore.frame(set, t, 0.22);
  walk(frame);
  if (t < 3 && frame.label === "Crashing") sawCrash = true;
}
assert(sawCrash, "no crash inside the first 3 seconds");

const calm = Shore.frame(set, 0, 0);
const rough = Shore.frame(set, 0, 1);
assert(rough.debug.maxHang >= calm.debug.maxHang, "storm should not shrink the lip");

const other = Shore.createSet(5);
assert(other.palette.name !== set.palette.name, "new set should be able to change palette");
walk(Shore.frame(other, 2.2, 0.8));

console.log(
  "shorebreak ok",
  "hang", hero.debug.maxHang.toFixed(3),
  "swash", hero.debug.swash.toFixed(3),
  "label", hero.label,
  "ops", hero.ops.length
);
