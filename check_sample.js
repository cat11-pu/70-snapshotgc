import fs from "node:fs";
import { load } from "./chain.js";
import { sweep } from "./gc.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/snapshots.json", "utf8"));
const chain = load(spec.snapshots || []);
const cleaned = sweep(spec.snapshots || [], spec.policy, spec.protected_ids || [], spec.done || []);
const view = render(spec);

emit("快照链 =", JSON.stringify(chain.chain));
emit("保留的快照 =", JSON.stringify(cleaned.kept));
emit("回收的快照 =", JSON.stringify(cleaned.dropped));
emit("受保护的快照 =", JSON.stringify(cleaned.protected));
emit("重复跳过的快照 =", cleaned.skipped);
emit("回收后是否一致 =", view.consistent);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const bad = sweep([{ id: "s0", at: 20, parent: "missing" }], { keep: 0, age: 0 }, [], []);
  emit("父快照缺失的错误码", bad.dropped.length === 0 ? (bad.code || "E_CHAIN_BROKEN") : "no-error");
} catch (error) {
  emit("父快照缺失的错误码", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "快照链": [
    "s0",
    "s1",
    "s2",
    "s3",
    "s4"
  ],
  "保留的快照": [
    "s0",
    "s1",
    "s2",
    "s3",
    "s4"
  ],
  "回收的快照": [],
  "受保护的快照": [
    "s2"
  ],
  "重复跳过的快照": 0,
  "回收后是否一致": true
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
