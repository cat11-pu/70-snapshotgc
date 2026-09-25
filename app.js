// app.js：渲染结果
import { load } from "./chain.js";
import { sweep } from "./gc.js";

export function render(spec) {
  const snapshots = spec.snapshots || [];
  const chain = load(snapshots);
  const cleaned = sweep(snapshots, spec.policy, spec.protected_ids || [], spec.done || []);
  // 不变量自检：保留集合里任一快照的父快照也必须保留；受保护快照不得在回收清单。
  const keptSet = new Set(cleaned.kept);
  const droppedSet = new Set(cleaned.dropped);
  let consistent = true;
  for (const id of cleaned.kept) {
    const parent = chain.parents[id];
    if (parent !== undefined && !keptSet.has(parent)) { consistent = false; break; }
  }
  for (const id of cleaned.protected) {
    if (droppedSet.has(id)) { consistent = false; break; }
  }
  return { chain: chain.chain, kept: cleaned.kept, dropped: cleaned.dropped,
           protected: cleaned.protected, skipped: cleaned.skipped, consistent };
}
