import { ACCEL, FRICTION, MAX_SPEED, MAX_SUBSTEP_RATIO } from './config';
import { resolveWallCollisions, type Ball, type WallGrid } from './collisions';

/**
 * Advances the ball by `dt` seconds. Mutates `ball`.
 * Tilt components are normalized to [-1, 1]; positions are in pixels.
 */
export function stepBall(
  ball: Ball,
  tiltX: number,
  tiltY: number,
  dt: number,
  radius: number,
  cellSize: number,
  grid: WallGrid,
): void {
  'worklet';
  const accel = ACCEL * cellSize;
  const maxSpeed = MAX_SPEED * cellSize;
  // FRICTION is defined per 60 Hz frame; raise it to dt*60 to stay frame-rate independent.
  const friction = Math.pow(FRICTION, dt * 60);

  ball.vx = (ball.vx + tiltX * accel * dt) * friction;
  ball.vy = (ball.vy + tiltY * accel * dt) * friction;

  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed > maxSpeed) {
    const k = maxSpeed / speed;
    ball.vx *= k;
    ball.vy *= k;
  }

  const travel = Math.min(speed, maxSpeed) * dt;
  const steps = Math.max(1, Math.ceil(travel / (radius * MAX_SUBSTEP_RATIO)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;
    resolveWallCollisions(ball, radius, grid, cellSize);
  }
}

/** True when the ball center lies inside the given cell. */
export function isInCell(ball: Ball, col: number, row: number, cellSize: number): boolean {
  'worklet';
  return Math.floor(ball.x / cellSize) === col && Math.floor(ball.y / cellSize) === row;
}
