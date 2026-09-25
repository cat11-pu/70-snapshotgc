// chain.js：快照链（按时间升序建链，记录父子对应；父快照缺失即断链）
export function load(snapshots) {
  const list = Array.from(snapshots || []);
  const ids = new Set();
  for (const item of list) ids.add(item.id);

  const parents = {};
  for (const item of list) {
    if (item.parent != null && !ids.has(item.parent)) {
      const error = new Error("broken chain: snapshot " + item.id + " references missing parent " + item.parent);
      error.code = "E_CHAIN_BROKEN";
      throw error;
    }
    parents[item.id] = item.parent;
  }

  const ordered = list
    .map((item, index) => ({ id: item.id, at: item.at, index }))
    .sort((a, b) => (a.at === b.at ? a.index - b.index : a.at - b.at));

  return { chain: ordered.map((item) => item.id), parents };
}
