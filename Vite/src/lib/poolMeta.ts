export interface PoolMeta {
  poolId: number;
  orgName: string;
  department: string;
  chapter: string;
  createdAt: string;
}

const META_KEY = "studylend_pool_meta";
const IDS_KEY = "studylend_pool_ids";

// ── Pool ID registry ──────────────────────────────────────────────────────────
// We store all known pool IDs locally so newly created pools are discoverable.
// Seed with 0,1,2 as baseline — new ones get added on creation.

export function getKnownPoolIds(): number[] {
  try {
    const raw = localStorage.getItem(IDS_KEY);
    const stored: number[] = raw ? JSON.parse(raw) : [];
    // Always include 0,1,2 as defaults
    const merged = Array.from(new Set([0, 1, 2, ...stored])).sort((a, b) => a - b);
    return merged;
  } catch {
    return [0, 1, 2];
  }
}

export function registerPoolId(poolId: number): void {
  const current = getKnownPoolIds();
  if (!current.includes(poolId)) {
    const updated = Array.from(new Set([...current, poolId])).sort((a, b) => a - b);
    localStorage.setItem(IDS_KEY, JSON.stringify(updated));
  }
}

// ── Pool metadata (org name, dept, chapter) ───────────────────────────────────

export function savePoolMeta(meta: PoolMeta): void {
  const all = getAllPoolMeta();
  const idx = all.findIndex((m) => m.poolId === meta.poolId);
  if (idx >= 0) all[idx] = meta;
  else all.push(meta);
  localStorage.setItem(META_KEY, JSON.stringify(all));
}

export function getAllPoolMeta(): PoolMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getPoolMeta(poolId: number): PoolMeta | null {
  return getAllPoolMeta().find((m) => m.poolId === poolId) ?? null;
}