// app.js：渲染结果
import { load } from "./chain.js";
import { sweep } from "./gc.js";

export function render(spec) {
  const snapshots = spec.snapshots || [];
  const chain = load(snapshots);
  const cleaned = sweep(snapshots, spec.policy, spec.protected_ids || [], spec.done || []);

  const keptSet = new Set(cleaned.kept);
  const droppedSet = new Set(cleaned.dropped);
  let consistent = true;
  for (const id of cleaned.kept) {
    const parent = chain.parents[id];
    if (parent != null && !keptSet.has(parent)) consistent = false;
  }
  for (const id of cleaned.protected) {
    if (droppedSet.has(id)) consistent = false;
  }

  return { chain: chain.chain, kept: cleaned.kept, dropped: cleaned.dropped,
           protected: cleaned.protected, skipped: cleaned.skipped, consistent };
}
