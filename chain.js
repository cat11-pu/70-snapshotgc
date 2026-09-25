// chain.js：快照链。按时间升序排出编号链，并记录父子对应。
export function load(snapshots) {
  const sorted = [...snapshots].sort((a, b) => a.at - b.at);
  const chain = sorted.map((item) => item.id);
  const parents = {};
  for (const item of sorted) {
    if (item.parent !== null && item.parent !== undefined) {
      parents[item.id] = item.parent;
    }
  }
  return { chain, parents };
}
