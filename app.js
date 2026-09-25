// app.js：渲染结果
import { load } from "./chain.js";
import { sweep } from "./gc.js";

export function render(spec) {
  const chain = load(spec.snapshots || []);
  const cleaned = sweep(spec.snapshots || [], spec.policy, spec.protected_ids || [], spec.done || []);
  return { chain: chain.chain, kept: cleaned.kept, dropped: cleaned.dropped,
           protected: cleaned.protected, skipped: cleaned.skipped, consistent: true };
}
