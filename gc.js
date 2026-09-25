// gc.js：回收（数量 + 时间 + 受保护，再用一次逆序线性扫描补齐祖先闭包）
import { load } from "./chain.js";

export function sweep(snapshots, policy, protectedIds, done) {
  const list = Array.from(snapshots || []);
  const { chain, parents } = load(list);
  const byId = new Map(list.map((item) => [item.id, item]));

  const keepCount = policy && Number.isFinite(policy.keep) ? Math.max(0, Math.trunc(policy.keep)) : 0;
  const ageWindow = policy && Number.isFinite(policy.age) ? policy.age : null;
  const now = list.reduce((max, item) => Math.max(max, item.at), 0);

  const protectedSet = new Set(protectedIds || []);
  const doneSet = new Set(done || []);

  const isProtected = new Set();
  const retained = new Set();

  // 直接保留：最新 keep 个、age 时间窗口内、受保护。
  for (let i = 0; i < chain.length; i += 1) {
    const id = chain[i];
    const item = byId.get(id);
    let keep = i >= chain.length - keepCount;
    if (!keep && ageWindow !== null && item.at >= now - ageWindow) keep = true;
    if (protectedSet.has(id)) {
      keep = true;
      isProtected.add(id);
    }
    if (keep) retained.add(id);
  }

  // 祖先闭包：逆序一次线性扫描，被保留者的父快照也保留，链不断。
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const id = chain[i];
    const parent = parents[id];
    if (retained.has(id) && parent != null) retained.add(parent);
  }

  const kept = chain.filter((id) => retained.has(id));
  const dropped = [];
  let skipped = 0;
  for (const id of chain) {
    if (retained.has(id)) continue;
    if (doneSet.has(id)) skipped += 1;
    else dropped.push(id);
  }

  return {
    kept,
    dropped,
    protected: kept.filter((id) => isProtected.has(id)),
    skipped
  };
}
