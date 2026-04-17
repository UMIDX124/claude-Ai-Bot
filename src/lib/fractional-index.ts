import { Prisma } from "@prisma/client";

const D = Prisma.Decimal;
type Decimal = Prisma.Decimal;

const ZERO = new D(0);
const ONE = new D(1);
const GAP = new D(65536);

/**
 * Compute a new Decimal position between `prev` and `next`.
 *
 * Rules:
 * - `prev == null` and `next == null`: start list → return `0`.
 * - `prev` present, `next == null`: append → `prev + 65536`.
 * - `prev == null`, `next` present: prepend → `next - 65536` (or `next / 2` if > 0).
 * - both present: midpoint = `(prev + next) / 2`.
 *
 * Using Decimal(19, 10) gives ~2^32 insertion points between any two adjacent
 * rows before precision is exhausted. Callers can rebalance if repeated
 * midpoints exceed the 10-decimal guard.
 */
export function positionBetween(
  prev: Decimal | string | number | null | undefined,
  next: Decimal | string | number | null | undefined,
): Decimal {
  const p = prev != null ? new D(prev) : null;
  const n = next != null ? new D(next) : null;

  if (p === null && n === null) return ZERO;

  if (p !== null && n === null) {
    return p.add(GAP);
  }

  if (p === null && n !== null) {
    if (n.gt(ZERO)) return n.div(2);
    return n.sub(GAP);
  }

  // both present
  const sum = (p as Decimal).add(n as Decimal);
  const mid = sum.div(2);
  // Cap precision at 10 decimals to match Prisma column
  return new D(mid.toFixed(10)).sub(0); // normalize
}

export function firstPosition(): Decimal {
  return ZERO;
}

export function appendAfter(last: Decimal | string | number | null): Decimal {
  return positionBetween(last, null);
}

export function prependBefore(first: Decimal | string | number | null): Decimal {
  return positionBetween(null, first);
}

/**
 * Assign evenly-spaced positions to an ordered list of IDs. Use this when you
 * need a bulk rebalance of a column (e.g. after many inserts compress precision).
 */
export function spacedPositions(count: number): Decimal[] {
  const out: Decimal[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(new D(i).mul(GAP));
  }
  return out;
}

/**
 * Precision guard: returns true if positionBetween(prev, next) would produce a
 * Decimal with more than 10 significant fractional digits (i.e. rebalancing is
 * due). Exported for callers that want to pre-emptively rebalance.
 */
export function needsRebalance(
  prev: Decimal | string | number | null | undefined,
  next: Decimal | string | number | null | undefined,
): boolean {
  if (prev == null || next == null) return false;
  const p = new D(prev);
  const n = new D(next);
  const diff = n.sub(p).abs();
  // 1e-10 is the smallest representable step in Decimal(19, 10).
  return diff.lt(new D("0.0000000002"));
}

export { ONE };
