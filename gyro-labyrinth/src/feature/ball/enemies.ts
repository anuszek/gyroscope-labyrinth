// How the enemies move. Plain functions with no React in them, so they run on the UI thread
// and can be tested on their own.
import { deepestHit, Grid } from './walls';

// Pushes an enemy out of the walls it overlaps. In a corner, pushing out of one wall can push into the other,
// so it looks again a few times. Returns the new place and the way the enemy was pushed (a unit vector), which is
// the direction that points away from the walls. That is (0, 0) when it wasn't touching a wall.
function pushOut(grid: Grid, x: number, y: number, radius: number) {
  'worklet';
  const startX = x;
  const startY = y;
  for (let pass = 0; pass < 4; pass++) {
    const hit = deepestHit(grid, x, y, radius);
    if (!hit) break;
    x += hit.nx * hit.depth;
    y += hit.ny * hit.depth;
  }
  const length = Math.hypot(x - startX, y - startY);
  if (length < 1e-6) return { x, y, nx: 0, ny: 0 };
  return { x, y, nx: (x - startX) / length, ny: (y - startY) / length };
}

// An enemy's route in pixels. It walks from (x1, y1) to (x2, y2) and back.
export type Patrol = { x1: number; y1: number; x2: number; y2: number; length: number; speed: number };

// Where an enemy is right now and which way it is heading. (dx, dy) is a unit vector for a bouncer, and
// one of the four straight directions for a wanderer. Patrols don't use it.
export type EnemyState = { x: number; y: number; dx: number; dy: number };

// A bouncer leaves a wall within this angle of the wall's normal (70 degrees to either side).
// Leaving at a flatter angle would have it scrape along the wall.
const BOUNCE_SPREAD = (70 * Math.PI) / 180;

// Where an enemy is after `seconds` of walking its route.
export function patrolAt(patrol: Patrol, seconds: number) {
  'worklet';
  if (patrol.length === 0) return { x: patrol.x1, y: patrol.y1 };
  const cycle = patrol.length * 2;
  const walked = (patrol.speed * seconds) % cycle;
  const along = (walked < patrol.length ? walked : cycle - walked) / patrol.length;
  return {
    x: patrol.x1 + (patrol.x2 - patrol.x1) * along,
    y: patrol.y1 + (patrol.y2 - patrol.y1) * along,
  };
}

// A random one of the four straight directions that isn't blocked by a wall right away.
export function pickDirection(grid: Grid, x: number, y: number, radius: number) {
  'worklet';
  const options = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ].filter((d) => deepestHit(grid, x + d.dx * 2, y + d.dy * 2, radius) === null);
  if (options.length === 0) return { dx: 0, dy: 0 };
  return options[Math.floor(Math.random() * options.length)];
}

// Moves a wanderer one frame. It goes straight up, down, left or right. When it runs into a wall it stops
// at the wall and picks a new straight direction.
export function stepWanderer(enemy: EnemyState, speed: number, dt: number, grid: Grid, radius: number): EnemyState {
  'worklet';
  let { x, y, dx, dy } = enemy;
  if (dx === 0 && dy === 0) {
    const first = pickDirection(grid, x, y, radius);
    dx = first.dx;
    dy = first.dy;
  }

  x += dx * speed * dt;
  y += dy * speed * dt;

  const out = pushOut(grid, x, y, radius);
  x = out.x;
  y = out.y;
  if (out.nx !== 0 || out.ny !== 0) {
    const next = pickDirection(grid, x, y, radius);
    dx = next.dx;
    dy = next.dy;
  }

  return { x, y, dx, dy };
}

// Moves a bouncer one frame. It goes in a straight line at any angle. When it runs into a wall it is pushed back
// out and leaves at a new random angle, somewhere in the half of the circle that points away from the wall.
export function stepBouncer(enemy: EnemyState, speed: number, dt: number, grid: Grid, radius: number): EnemyState {
  'worklet';
  let { x, y, dx, dy } = enemy;
  if (dx === 0 && dy === 0) {
    const angle = Math.random() * 2 * Math.PI;
    dx = Math.cos(angle);
    dy = Math.sin(angle);
  }

  x += dx * speed * dt;
  y += dy * speed * dt;

  const out = pushOut(grid, x, y, radius);
  x = out.x;
  y = out.y;
  if (out.nx !== 0 || out.ny !== 0) {
    const angle = Math.atan2(out.ny, out.nx) + (Math.random() * 2 - 1) * BOUNCE_SPREAD;
    dx = Math.cos(angle);
    dy = Math.sin(angle);
  }

  return { x, y, dx, dy };
}
