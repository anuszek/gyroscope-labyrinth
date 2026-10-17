import { RESTITUTION, TANGENTIAL_DAMPING } from './config';

export type Ball = { x: number; y: number; vx: number; vy: number };

export type WallGrid = { cols: number; rows: number; walls: number[] };

/** Cells outside the grid count as walls, so the ball can never leave the maze. */
export function isWall(grid: WallGrid, col: number, row: number): boolean {
  'worklet';
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return true;
  return grid.walls[row * grid.cols + col] === 1;
}

/**
 * Circle vs. AABB against every wall cell overlapping the ball's bounding box.
 * Mutates `ball`: pushes it out along the penetration normal, reflects the normal
 * velocity with RESTITUTION and damps the tangential part.
 */
export function resolveWallCollisions(
  ball: Ball,
  radius: number,
  grid: WallGrid,
  cellSize: number,
): void {
  'worklet';
  const minCol = Math.floor((ball.x - radius) / cellSize);
  const maxCol = Math.floor((ball.x + radius) / cellSize);
  const minRow = Math.floor((ball.y - radius) / cellSize);
  const maxRow = Math.floor((ball.y + radius) / cellSize);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!isWall(grid, col, row)) continue;

      const left = col * cellSize;
      const top = row * cellSize;
      const right = left + cellSize;
      const bottom = top + cellSize;

      const closestX = Math.min(Math.max(ball.x, left), right);
      const closestY = Math.min(Math.max(ball.y, top), bottom);
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq >= radius * radius) continue;

      let nx: number;
      let ny: number;
      let penetration: number;
      if (distSq > 1e-9) {
        const dist = Math.sqrt(distSq);
        nx = dx / dist;
        ny = dy / dist;
        penetration = radius - dist;
      } else {
        // Center is inside the box: exit through the nearest face.
        const toLeft = ball.x - left;
        const toRight = right - ball.x;
        const toTop = ball.y - top;
        const toBottom = bottom - ball.y;
        const minDist = Math.min(toLeft, toRight, toTop, toBottom);
        nx = minDist === toLeft ? -1 : minDist === toRight ? 1 : 0;
        ny = nx !== 0 ? 0 : minDist === toTop ? -1 : 1;
        penetration = minDist + radius;
      }

      ball.x += nx * penetration;
      ball.y += ny * penetration;

      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        const tx = ball.vx - vn * nx;
        const ty = ball.vy - vn * ny;
        ball.vx = tx * TANGENTIAL_DAMPING - vn * RESTITUTION * nx;
        ball.vy = ty * TANGENTIAL_DAMPING - vn * RESTITUTION * ny;
      }
    }
  }
}
