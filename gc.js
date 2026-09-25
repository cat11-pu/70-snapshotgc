// gc.js：回收。保留最新 keep 个、age 时间内的快照与受保护快照，
// 并把被保留快照的祖先一并留下（链不得断）。全程一次线性扫描。
export function sweep(snapshots, policy, protectedIds, done) {
  const { keep = 0, age = 0 } = policy || {};
  const sorted = [...snapshots].sort((a, b) => a.at - b.at);
  const indexOf = new Map();
  const byId = new Map();
  sorted.forEach((item, index) => {
    indexOf.set(item.id, index);
    byId.set(item.id, item);
  });

  // 父快照缺失即断链，直接报错。
  for (const item of sorted) {
    if (item.parent !== null && item.parent !== undefined && !byId.has(item.parent)) {
      const error = new Error("E_CHAIN_BROKEN: " + item.id + " 的父快照 " + item.parent + " 缺失");
      error.code = "E_CHAIN_BROKEN";
      throw error;
    }
  }

  const now = policy && typeof policy.now === "number"
    ? policy.now
    : (sorted.length > 0 ? sorted[sorted.length - 1].at : 0);
  const keptFlags = new Array(sorted.length).fill(false);

  // 最新 keep 个必留。
  for (let index = Math.max(0, sorted.length - keep); index < sorted.length; index += 1) {
    keptFlags[index] = true;
  }
  // age 时间内的必留。
  for (let index = 0; index < sorted.length; index += 1) {
    if (now - sorted[index].at <= age) keptFlags[index] = true;
  }
  // 受保护的必留。
  const protectedList = [];
  for (const id of protectedIds || []) {
    if (byId.has(id)) {
      keptFlags[indexOf.get(id)] = true;
      protectedList.push(id);
    }
  }
  // 祖先回填：父快照时间必早于子快照，从新到旧单趟传播即可，不反复回溯。
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (!keptFlags[index]) continue;
    const parent = sorted[index].parent;
    if (parent !== null && parent !== undefined && indexOf.has(parent)) {
      keptFlags[indexOf.get(parent)] = true;
    }
  }

  // 已处理过的快照幂等跳过，计入 skipped。
  const doneSet = new Set(done || []);
  const kept = [];
  const dropped = [];
  let skipped = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    const id = sorted[index].id;
    if (keptFlags[index]) { kept.push(id); continue; }
    if (doneSet.has(id)) { skipped += 1; continue; }
    dropped.push(id);
  }
  return { kept, dropped, protected: protectedList, skipped };
}
