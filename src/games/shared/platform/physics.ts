/**
 * Tile-map platform physics shared by #181 and #182: axis-aligned bodies moving through a grid of
 * 16-pixel tiles, resolved one axis at a time in sub-steps of at most half a pixel so nothing
 * tunnels. `#` and other solid letters block from every side; `=` is a one-way ledge that only
 * holds a body falling onto it from above; everything else is open. The map's sides are walls, its
 * top is open sky, and below its bottom row is a fatal drop.
 */

export const TILE = 16;

export interface TileMap {
  /** Rows of characters, top to bottom, all the same length. */
  rows: readonly string[];
  /** Characters that block from every side. */
  solid: string;
}

export interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

export interface Contacts {
  ground: boolean;
  ceiling: boolean;
  /** -1 / 1 when pressed against a wall on that side. */
  wall: -1 | 0 | 1;
}

export const mapWidth = (m: TileMap) => m.rows[0]!.length * TILE;
export const mapHeight = (m: TileMap) => m.rows.length * TILE;

export function tileAt(m: TileMap, tx: number, ty: number): string {
  if (tx < 0 || tx >= m.rows[0]!.length) return '#';
  if (ty < 0 || ty >= m.rows.length) return '.';
  return m.rows[ty]![tx]!;
}

const blocks = (m: TileMap, c: string) => m.solid.includes(c);

/** Whether a box overlaps any solid tile. */
export function hitsSolid(m: TileMap, x: number, y: number, w: number, h: number): boolean {
  const x0 = Math.floor(x / TILE);
  const x1 = Math.floor((x + w - 0.001) / TILE);
  const y0 = Math.floor(y / TILE);
  const y1 = Math.floor((y + h - 0.001) / TILE);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) if (blocks(m, tileAt(m, tx, ty))) return true;
  return false;
}

/** Whether a box's bottom edge rests exactly on a one-way ledge's top. */
function onLedge(m: TileMap, x: number, bottom: number, w: number): boolean {
  if (bottom % TILE !== 0) return false;
  const ty = bottom / TILE;
  for (let tx = Math.floor(x / TILE); tx <= Math.floor((x + w - 0.001) / TILE); tx++)
    if (tileAt(m, tx, ty) === '=') return true;
  return false;
}

/** Tiles of a kind a box overlaps (for spikes, coins, goals). */
export function touching(
  m: TileMap,
  x: number,
  y: number,
  w: number,
  h: number,
  kinds: string,
): { tx: number; ty: number; c: string }[] {
  const out: { tx: number; ty: number; c: string }[] = [];
  for (let ty = Math.floor(y / TILE); ty <= Math.floor((y + h - 0.001) / TILE); ty++)
    for (let tx = Math.floor(x / TILE); tx <= Math.floor((x + w - 0.001) / TILE); tx++) {
      const c = tileAt(m, tx, ty);
      if (kinds.includes(c)) out.push({ tx, ty, c });
    }
  return out;
}

/**
 * Moves a body by its velocity, stopping it against solid tiles (and one-way ledges when falling),
 * and reports what it touched. `dropThrough` lets it fall through ledges.
 */
export function move(m: TileMap, b0: Body, dropThrough = false): [Body, Contacts] {
  const b = { ...b0 };
  const c: Contacts = { ground: false, ceiling: false, wall: 0 };
  // Horizontal.
  let left = b.vx;
  while (left !== 0) {
    const d = Math.abs(left) > 0.5 ? Math.sign(left) * 0.5 : left;
    if (hitsSolid(m, b.x + d, b.y, b.w, b.h)) {
      c.wall = d > 0 ? 1 : -1;
      b.vx = 0;
      break;
    }
    b.x += d;
    left -= d;
  }
  // Vertical.
  left = b.vy;
  while (left !== 0) {
    const d = Math.abs(left) > 0.5 ? Math.sign(left) * 0.5 : left;
    const bottom = b.y + b.h;
    // Falling past the top of a one-way ledge lands on it.
    const line = Math.floor((bottom + d) / TILE) * TILE;
    if (
      d > 0 &&
      !dropThrough &&
      bottom <= line &&
      bottom + d > line &&
      onLedge(m, b.x, line, b.w)
    ) {
      b.y = line - b.h;
      c.ground = true;
      b.vy = 0;
      break;
    }
    if (hitsSolid(m, b.x, b.y + d, b.w, b.h)) {
      if (d > 0) c.ground = true;
      else c.ceiling = true;
      b.vy = 0;
      break;
    }
    b.y += d;
    left -= d;
  }
  // Standing still on something counts as ground too.
  if (
    !c.ground &&
    b.vy >= 0 &&
    (hitsSolid(m, b.x, b.y + 0.5, b.w, b.h) || (!dropThrough && onLedge(m, b.x, b.y + b.h, b.w)))
  )
    c.ground = true;
  if (c.wall === 0) {
    if (hitsSolid(m, b.x + 0.5, b.y, b.w, b.h)) c.wall = 1;
    else if (hitsSolid(m, b.x - 0.5, b.y, b.w, b.h)) c.wall = -1;
  }
  return [b, c];
}

/** Breadth-first tile distances to the target tiles through open tiles (a guide for planners). */
export function flowField(m: TileMap, targets: [number, number][]): Int16Array {
  const W = m.rows[0]!.length;
  const H = m.rows.length;
  const dist = new Int16Array(W * H).fill(-1);
  const q: number[] = [];
  for (const [tx, ty] of targets) {
    dist[ty * W + tx] = 0;
    q.push(ty * W + tx);
  }
  for (let i = 0; i < q.length; i++) {
    const k = q[i]!;
    const x = k % W;
    const y = Math.floor(k / W);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (dist[n] !== -1 || blocks(m, tileAt(m, nx, ny))) continue;
      dist[n] = dist[k]! + 1;
      q.push(n);
    }
  }
  return dist;
}
