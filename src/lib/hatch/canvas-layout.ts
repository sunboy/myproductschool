/**
 * canvas-layout.ts — Pure layout computation for Hatch canvas diagrams.
 *
 * No Excalidraw imports, no React. This module takes a set of boxes and edges
 * and returns absolute (x, y) positions for each box id.
 *
 * Strategies:
 *   - data_modeling / default → grouped layout (connected components, row-packed)
 *   - system_design           → layered layout (T1b will fill this in; delegates to grouped for now)
 */

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface LayoutBox {
  id: string;
  /** Optional display label — used for deterministic sort order */
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  fromId: string;
  toId: string;
}

export interface LayoutInput {
  boxes: LayoutBox[];
  edges: LayoutEdge[];
  /** 'data_modeling' (default) | 'system_design' */
  discipline?: string;
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
}

// ─── Layout constants ─────────────────────────────────────────────────────────

export const LAYOUT = {
  START_X: 80,
  START_Y: 80,
  COL_GAP: 120,
  ROW_GAP: 80,
  MAX_PER_ROW: 4,
} as const;

// ─── Union-Find (path-compressed) ────────────────────────────────────────────

class UnionFind {
  private parent: Map<string, string> = new Map();

  private root(id: string): string {
    if (!this.parent.has(id)) this.parent.set(id, id);
    const p = this.parent.get(id)!;
    if (p !== id) {
      this.parent.set(id, this.root(p)); // path compression
    }
    return this.parent.get(id)!;
  }

  union(a: string, b: string): void {
    const ra = this.root(a);
    const rb = this.root(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }

  group(ids: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const id of ids) {
      const r = this.root(id);
      if (!groups.has(r)) groups.set(r, []);
      groups.get(r)!.push(id);
    }
    return groups;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sort key: label if present, otherwise id. */
function sortKey(box: LayoutBox): string {
  return box.label ?? box.id;
}

/**
 * Lay out a flat list of boxes in a left-to-right, top-to-bottom grid.
 * Returns a partial positions map (relative to the given start cursor).
 *
 * Expected behaviour (sanity):
 *   - 4 boxes of equal size laid out with MAX_PER_ROW=4 → single row
 *   - 5 boxes → 4 on row 1, 1 on row 2
 *   - Next component always starts on a fresh row
 */
function placeGroup(
  boxes: LayoutBox[],
  cursorX: number,
  cursorY: number,
  positions: Map<string, { x: number; y: number }>
): { nextY: number } {
  let col = 0;
  let rowX = cursorX;
  let rowY = cursorY;
  let maxHeightInRow = 0;

  for (const box of boxes) {
    positions.set(box.id, { x: rowX, y: rowY });

    maxHeightInRow = Math.max(maxHeightInRow, box.height);
    rowX += box.width + LAYOUT.COL_GAP;
    col++;

    if (col >= LAYOUT.MAX_PER_ROW) {
      // Wrap to next row
      rowY += maxHeightInRow + LAYOUT.ROW_GAP;
      rowX = cursorX;
      col = 0;
      maxHeightInRow = 0;
    }
  }

  // Advance cursor past the last (possibly partial) row
  const nextY =
    col === 0
      ? rowY // already advanced by the wrap above
      : rowY + maxHeightInRow + LAYOUT.ROW_GAP;

  return { nextY };
}

// ─── Grouped layout (data_modeling / default) ────────────────────────────────

function groupedLayout(input: LayoutInput): LayoutResult {
  const { boxes, edges } = input;
  const positions = new Map<string, { x: number; y: number }>();

  if (boxes.length === 0) return { positions };

  // Build id→box lookup
  const byId = new Map<string, LayoutBox>(boxes.map((b) => [b.id, b]));

  // Union-Find: group connected components
  const uf = new UnionFind();
  for (const { fromId, toId } of edges) {
    uf.union(fromId, toId);
  }

  const rawGroups = uf.group(boxes.map((b) => b.id));

  // Separate multi-node components from singletons
  const multiComponents: string[][] = [];
  const singletons: string[] = [];

  for (const members of rawGroups.values()) {
    if (members.length === 1) {
      singletons.push(members[0]);
    } else {
      multiComponents.push(members);
    }
  }

  // Deterministic sort:
  //   components sorted by their lowest-sort-key member
  //   members within each component sorted by sort key
  const sortedComponents = multiComponents
    .map((members) =>
      members.slice().sort((a, b) => {
        const ka = sortKey(byId.get(a)!);
        const kb = sortKey(byId.get(b)!);
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      })
    )
    .sort((ga, gb) => {
      const ka = sortKey(byId.get(ga[0])!);
      const kb = sortKey(byId.get(gb[0])!);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

  // Singletons sorted by their own sort key
  const sortedSingletons = singletons.slice().sort((a, b) => {
    const ka = sortKey(byId.get(a)!);
    const kb = sortKey(byId.get(b)!);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  let cursorY: number = LAYOUT.START_Y;

  // Place each multi-node component on its own fresh row
  for (const members of sortedComponents) {
    const memberBoxes = members.map((id) => byId.get(id)!);
    const result = placeGroup(memberBoxes, LAYOUT.START_X, cursorY, positions);
    cursorY = result.nextY;
  }

  // Place all singletons together in a trailing band
  if (sortedSingletons.length > 0) {
    const singletonBoxes = sortedSingletons.map((id) => byId.get(id)!);
    placeGroup(singletonBoxes, LAYOUT.START_X, cursorY, positions);
  }

  return { positions };
}

// ─── Layered layout (system_design) ──────────────────────────────────────────

/**
 * Assign tiers via longest-path layering:
 *   - tier(node) = 0 if no inbound edges exist for that node
 *   - tier(node) = max(tier(predecessor)) + 1 otherwise
 * Cycles are broken by ignoring back-edges to nodes currently on the DFS stack.
 */
function assignTiers(
  ids: string[],
  adjIn: Map<string, string[]>
): Map<string, number> {
  const tiers = new Map<string, number>();
  const visiting = new Set<string>(); // nodes on current DFS stack (cycle guard)

  function dfs(id: string): number {
    if (tiers.has(id)) return tiers.get(id)!;
    if (visiting.has(id)) {
      // Back-edge detected — return 0 to avoid infinite recursion
      return 0;
    }

    visiting.add(id);

    const predecessors = adjIn.get(id) ?? [];
    let maxPredTier = -1;
    for (const pred of predecessors) {
      // Skip back-edges (pred currently on stack)
      if (!visiting.has(pred)) {
        const predTier = dfs(pred);
        if (predTier > maxPredTier) maxPredTier = predTier;
      }
    }

    visiting.delete(id);

    const tier = maxPredTier + 1; // 0 if no valid predecessors
    tiers.set(id, tier);
    return tier;
  }

  for (const id of ids) {
    dfs(id);
  }

  return tiers;
}

/**
 * Left-to-right tier-based layout for system_design diagrams.
 *
 * Tiers flow left to right (x-axis). Within each tier, boxes are stacked
 * top to bottom (y-axis). Sort order is deterministic: tiers ascending,
 * members within a tier by label (fallback id) ascending.
 */
function layeredLayout(input: LayoutInput): LayoutResult {
  const { boxes, edges } = input;
  const positions = new Map<string, { x: number; y: number }>();

  if (boxes.length === 0) return { positions };

  // Build id→box lookup
  const byId = new Map<string, LayoutBox>(boxes.map((b) => [b.id, b]));

  // Build inbound adjacency: toId → [fromId, ...]
  const adjIn = new Map<string, string[]>();
  for (const box of boxes) {
    adjIn.set(box.id, []);
  }
  for (const { fromId, toId } of edges) {
    if (!adjIn.has(toId)) adjIn.set(toId, []);
    adjIn.get(toId)!.push(fromId);
  }

  // Assign tiers via longest-path (cycle-safe)
  const tierMap = assignTiers(
    boxes.map((b) => b.id),
    adjIn
  );

  // Group ids by tier number
  const tierGroups = new Map<number, string[]>();
  for (const [id, tier] of tierMap.entries()) {
    if (!tierGroups.has(tier)) tierGroups.set(tier, []);
    tierGroups.get(tier)!.push(id);
  }

  // Sort tiers ascending
  const sortedTiers = Array.from(tierGroups.keys()).sort((a, b) => a - b);

  // Sort members within each tier by label (fallback id) ascending
  for (const tier of sortedTiers) {
    tierGroups.get(tier)!.sort((a, b) => {
      const ka = sortKey(byId.get(a)!);
      const kb = sortKey(byId.get(b)!);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  }

  // Place tiers left to right, accumulating x cursor
  let cursorX = LAYOUT.START_X;

  for (const tier of sortedTiers) {
    const members = tierGroups.get(tier)!;

    // Max width among all boxes in this tier (for advancing x to next tier)
    let maxWidthInTier = 0;
    let cursorY = LAYOUT.START_Y;

    for (const id of members) {
      const box = byId.get(id)!;
      positions.set(id, { x: cursorX, y: cursorY });
      cursorY += box.height + LAYOUT.ROW_GAP;
      if (box.width > maxWidthInTier) maxWidthInTier = box.width;
    }

    // Advance x past this tier
    cursorX += maxWidthInTier + LAYOUT.COL_GAP;
  }

  return { positions };
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Compute absolute positions for all boxes in the given input.
 *
 * @example
 * // Sanity: 5 equal-sized boxes connected in a chain → 4 on row 1, 1 on row 2
 * const result = computeLayout({ boxes, edges, discipline: 'data_modeling' });
 * // result.positions.size === 5
 *
 * @example
 * // Sanity: no edges → all singletons in a trailing band (single row if ≤4)
 * const r2 = computeLayout({ boxes: fourBoxes, edges: [] });
 * // All four in one row starting at (START_X, START_Y)
 */
export function computeLayout(input: LayoutInput): LayoutResult {
  if (input.discipline === 'system_design') {
    return layeredLayout(input);
  }
  return groupedLayout(input);
}
