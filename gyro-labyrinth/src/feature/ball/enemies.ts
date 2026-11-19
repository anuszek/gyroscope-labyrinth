// How the enemies move. Plain functions with no React in them, so they run on the UI thread
// and can be tested on their own.

export type Box = { left: number; right: number; top: number; bottom: number };

// An enemy's route in pixels. It walks from (x1, y1) to (x2, y2) and back.
export type Patrol = { x1: number; y1: number; x2: number; y2: number; length: number; speed: number };

// Where an enemy is right now, and which way a wanderer is heading (dx and dy are -1, 0 or 1).
export type EnemyState = { x: number; y: number; dx: number; dy: number };

export function isInside(box: Box, x: number, y: number) {
  'worklet';
  return x > box.left && x < box.right && y > box.top && y < box.bottom;
}

export function isBlocked(boxes: Box[], x: number, y: number) {
  'worklet';
  for (const box of boxes) {
    if (isInside(box, x, y)) return true;
  }
  return false;
}

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

// A random one of the four directions that isn't blocked by a wall right away.
export function pickDirection(boxes: Box[], x: number, y: number) {
  'worklet';
  const options = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ].filter((d) => !isBlocked(boxes, x + d.dx * 2, y + d.dy * 2));
  if (options.length === 0) return { dx: 0, dy: 0 };
  return options[Math.floor(Math.random() * options.length)];
}

// Moves a wanderer one frame. When it runs into a wall it stops at the wall and picks a new direction.
// `boxes` are the walls grown by the enemy's radius, so the enemy can be treated as a point.
export function stepWanderer(enemy: EnemyState, speed: number, dt: number, boxes: Box[]): EnemyState {
  'worklet';
  let { x, y, dx, dy } = enemy;
  if (dx === 0 && dy === 0) {
    const first = pickDirection(boxes, x, y);
    dx = first.dx;
    dy = first.dy;
  }

  x += dx * speed * dt;
  y += dy * speed * dt;

  for (const box of boxes) {
    if (isInside(box, x, y)) {
      if (dx > 0) x = box.left;
      else if (dx < 0) x = box.right;
      if (dy > 0) y = box.top;
      else if (dy < 0) y = box.bottom;
      const next = pickDirection(boxes, x, y);
      dx = next.dx;
      dy = next.dy;
      break;
    }
  }

  return { x, y, dx, dy };
}
