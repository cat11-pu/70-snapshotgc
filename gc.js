// gc.js：回收（基线：全部删掉、不看保留策略）
export function sweep(snapshots, policy, protectedIds, done) {
  return { kept: [], dropped: snapshots.map((item) => item.id), protected: [], skipped: 0 };
}
