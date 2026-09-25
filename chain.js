// chain.js：快照链（基线：不记父子、全部当独立快照）
export function load(snapshots) {
  return { chain: snapshots.map((item) => item.id), parents: {} };
}
