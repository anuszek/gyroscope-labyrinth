// Walls as the ball and the enemies feel them: the same rounded shapes that are drawn on screen.
// Plain functions with no React in them, so they run on the UI thread and can be tested on their own.

// One wall tile. (x, y) is its top-left corner in pixels. Each corner has a radius, which is 0 where the wall
// continues into a neighbouring wall and the corner stays square.
export type Wall = { x: number; y: number; tl: number; tr: number; br: number; bl: number };

// Every tile of the board, in rows. A tile is a Wall, or null where there is floor.
export type Grid = { walls: (Wall | null)[]; cols: number; rows: number; left: number; top: number; cell: number };

// A circle overlapping a wall: how deep, and the direction (a unit vector) that pushes the circle back out.
export type Hit = { depth: number; nx: number; ny: number };

// How far the circle at (px, py) overlaps one rounded wall tile, or null when it doesn't touch it.
// This is the signed distance to a rounded box, which also tells us which way is out.
function wallHit(wall: Wall, cell: number, px: number, py: number, radius: number): Hit | null {
  'worklet';
  const half = cell / 2;
  const rx = px - (wall.x + half);
  const ry = py - (wall.y + half);
  const corner = rx < 0 ? (ry < 0 ? wall.tl : wall.bl) : ry < 0 ? wall.tr : wall.br;
  const qx = Math.abs(rx) - (half - corner);
  const qy = Math.abs(ry) - (half - corner);

  let distance: number;
  let nx: number;
  let ny: number;
  if (qx > 0 && qy > 0) {
    // Over a corner: the nearest point is on the corner's arc, so the way out points away from its centre.
    const length = Math.hypot(qx, qy);
    distance = length - corner;
    nx = (qx / length) * (rx < 0 ? -1 : 1);
    ny = (qy / length) * (ry < 0 ? -1 : 1);
  } else if (qx > qy) {
    distance = qx - corner;
    nx = rx < 0 ? -1 : 1;
    ny = 0;
  } else {
    distance = qy - corner;
    nx = 0;
    ny = ry < 0 ? -1 : 1;
  }

  const depth = radius - distance;
  return depth > 0 ? { depth, nx, ny } : null;
}

// The deepest overlap between a circle and the walls, or null when it touches none.
// Only the tile the circle is in and its eight neighbours can be reached, so only those are checked.
export function deepestHit(grid: Grid, px: number, py: number, radius: number): Hit | null {
  'worklet';
  const col = Math.floor((px - grid.left) / grid.cell);
  const row = Math.floor((py - grid.top) / grid.cell);
  let best: Hit | null = null;
  for (let r = row - 1; r <= row + 1; r++) {
    if (r < 0 || r >= grid.rows) continue;
    for (let c = col - 1; c <= col + 1; c++) {
      if (c < 0 || c >= grid.cols) continue;
      const wall = grid.walls[r * grid.cols + c];
      if (!wall) continue;
      const hit = wallHit(wall, grid.cell, px, py, radius);
      if (hit && (best === null || hit.depth > best.depth)) best = hit;
    }
  }
  return best;
}

// Moves the ball for one frame. The move is cut into small steps, each shorter than half the ball's radius,
// so a fast ball can't jump through a wall. After each step the ball is pushed out of any wall it overlaps and
// loses the part of its speed that pointed into the wall, so it slides along walls and around their rounded corners.
export function moveBall(grid: Grid, radius: number, x: number, y: number, vx: number, vy: number, dt: number) {
  'worklet';
  const steps = Math.max(1, Math.ceil((Math.hypot(vx, vy) * dt) / (radius * 0.5)));
  for (let i = 0; i < steps; i++) {
    x += (vx * dt) / steps;
    y += (vy * dt) / steps;
    // Pushing out of one wall can push into another in a corner, so look again a few times.
    for (let pass = 0; pass < 4; pass++) {
      const hit = deepestHit(grid, x, y, radius);
      if (!hit) break;
      x += hit.nx * hit.depth;
      y += hit.ny * hit.depth;
      const into = vx * hit.nx + vy * hit.ny;
      if (into < 0) {
        vx -= into * hit.nx;
        vy -= into * hit.ny;
      }
    }
  }
  return { x, y, vx, vy };
}
