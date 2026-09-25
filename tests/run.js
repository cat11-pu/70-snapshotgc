import assert from "node:assert";
import { load } from "../chain.js";
import { sweep } from "../gc.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const snapshots = [{ id: "s0", at: 0, parent: null }, { id: "s1", at: 5, parent: "s0" }];

check("load returns chain", () => {
  assert.ok(Array.isArray(load(snapshots).chain));
});

check("load returns parents map", () => {
  assert.strictEqual(typeof load(snapshots).parents, "object");
});

check("sweep returns kept", () => {
  assert.ok(Array.isArray(sweep(snapshots, { keep: 1, age: 10 }, [], []).kept));
});

check("sweep returns dropped", () => {
  assert.ok(Array.isArray(sweep(snapshots, { keep: 1, age: 10 }, [], []).dropped));
});

check("render exposes skipped", () => {
  assert.strictEqual(typeof render({ snapshots: snapshots, policy: { keep: 1, age: 10 }, protected_ids: [], done: [] }).skipped, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
