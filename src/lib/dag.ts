export type DagEdge = { from: string; to: string };

export class CycleError extends Error {
  public readonly cycle: string[];
  constructor(cycle: string[]) {
    super(`Dependency cycle detected: ${cycle.join(" → ")}`);
    this.name = "CycleError";
    this.cycle = cycle;
  }
}

/**
 * Return true if adding the edge `from → to` would create a cycle given
 * existing edges. An edge means "from depends on to" (from cannot start until
 * to completes). A cycle exists if `to` can already reach `from`.
 */
export function wouldCreateCycle(
  existing: DagEdge[],
  from: string,
  to: string,
): boolean {
  if (from === to) return true;
  const adj = buildAdjacency(existing);
  return reachable(adj, to, from);
}

/**
 * Topological sort — returns nodes ordered so that every edge goes from
 * earlier to later in the result. Throws CycleError if the graph contains a
 * cycle.
 */
export function topoSort(nodes: string[], edges: DagEdge[]): string[] {
  const adj = buildAdjacency(edges);
  const indeg = new Map<string, number>();
  for (const n of nodes) indeg.set(n, 0);
  for (const e of edges) indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);

  const queue: string[] = [];
  for (const [n, d] of indeg) if (d === 0) queue.push(n);

  const result: string[] = [];
  while (queue.length > 0) {
    const n = queue.shift() as string;
    result.push(n);
    for (const m of adj.get(n) ?? []) {
      const next = (indeg.get(m) ?? 0) - 1;
      indeg.set(m, next);
      if (next === 0) queue.push(m);
    }
  }

  if (result.length !== nodes.length) {
    // Find one cycle for the error message
    const remaining = nodes.filter((n) => !result.includes(n));
    throw new CycleError(findCycle(adj, remaining));
  }
  return result;
}

function buildAdjacency(edges: DagEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const { from, to } of edges) {
    const list = adj.get(from) ?? [];
    list.push(to);
    adj.set(from, list);
  }
  return adj;
}

function reachable(
  adj: Map<string, string[]>,
  start: string,
  target: string,
): boolean {
  const stack = [start];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const node = stack.pop() as string;
    if (node === target) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    const next = adj.get(node);
    if (!next) continue;
    for (const n of next) stack.push(n);
  }
  return false;
}

function findCycle(adj: Map<string, string[]>, nodes: string[]): string[] {
  for (const start of nodes) {
    const path: string[] = [];
    if (dfs(adj, start, new Set(), path)) return path;
  }
  return nodes.slice(0, 1);
}

function dfs(
  adj: Map<string, string[]>,
  node: string,
  seen: Set<string>,
  path: string[],
): boolean {
  if (path.includes(node)) {
    const start = path.indexOf(node);
    path.splice(0, start);
    path.push(node);
    return true;
  }
  if (seen.has(node)) return false;
  seen.add(node);
  path.push(node);
  for (const next of adj.get(node) ?? []) {
    if (dfs(adj, next, seen, path)) return true;
  }
  path.pop();
  return false;
}
