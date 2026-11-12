import { useWindowDimensions } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { findTiles, Level } from '../../data/levels';
import { useTilt } from '../../data/useTilt';

const ACCEL = 1000;
const FRICTION = 0.98;
// Keeps each frame's move shorter than a wall is thick, so the ball can't jump through.
const MAX_SPEED = 1200;
const BALL_RATIO = 0.4; // half the ball's width, in tiles
const COIN_RATIO = 0.22; // coin radius, in tiles
const ENEMY_RATIO = 0.32; // enemy radius, in tiles
const ENEMY_SPEED = 2.5; // tiles per second, when a level doesn't say
const TOP_BAR = 64; // kept clear of the board for the back button

type Box = { left: number; right: number; top: number; bottom: number };

// An enemy's route in pixels. It walks from (x1, y1) to (x2, y2) and back.
export type Patrol = { x1: number; y1: number; x2: number; y2: number; length: number; speed: number };

function isInside(box: Box, x: number, y: number) {
  'worklet';
  return x > box.left && x < box.right && y > box.top && y < box.bottom;
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

type Callbacks = {
  onGoal: (time: number, coins: number) => void;
  onCoin: (index: number) => void;
};

export function useBall(level: Level, { onGoal, onCoin }: Callbacks) {
  const { width, height } = useWindowDimensions();
  const tilt = useTilt();

  const cols = level.rows[0].length;
  const rows = level.rows.length;
  const cell = Math.min(width / cols, (height - TOP_BAR) / rows);
  const left = (width - cols * cell) / 2;
  const top = TOP_BAR + (height - TOP_BAR - rows * cell) / 2;
  const radius = cell * BALL_RATIO;
  const coinRadius = cell * COIN_RATIO;
  const enemyRadius = cell * ENEMY_RATIO;

  const place = ({ col, row }: { col: number; row: number }) => ({ left: left + col * cell, top: top + row * cell });
  const center = (tile: { col: number; row: number }) => {
    const { left: l, top: t } = place(tile);
    return { x: l + cell / 2, y: t + cell / 2 };
  };
  const wallTiles = findTiles(level, '#').map(place);
  const finishTiles = findTiles(level, 'F').map(place);
  const start = center(findTiles(level, 'S')[0]);
  const coins = findTiles(level, 'C').map(center);
  const patrols = level.enemies.map<Patrol>((enemy) => {
    const a = center(enemy.from);
    const b = center(enemy.to);
    return {
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      length: Math.hypot(b.x - a.x, b.y - a.y),
      speed: (enemy.speed ?? ENEMY_SPEED) * cell,
    };
  });

  // Tiles grown by the ball's half width, so the ball can be treated as a point.
  const grow = (tile: { left: number; top: number }): Box => ({
    left: tile.left - radius,
    right: tile.left + cell + radius,
    top: tile.top - radius,
    bottom: tile.top + cell + radius,
  });
  const walls = wallTiles.map(grow);
  const finish = finishTiles.map(grow);

  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const vx = useSharedValue(0);
  const vy = useSharedValue(0);
  const finished = useSharedValue(false);
  const clock = useSharedValue(0); // seconds since the level began, drives the enemies
  const taken = useSharedValue<boolean[]>(coins.map(() => false));

  useFrameCallback((frame) => {
    if (finished.value) return;

    const dt = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, 1 / 30);
    clock.value = frame.timeSinceFirstFrame / 1000;

    vx.value = (vx.value + tilt.value.x * ACCEL * dt) * FRICTION;
    vy.value = (vy.value + tilt.value.y * ACCEL * dt) * FRICTION;
    vx.value = Math.min(Math.max(vx.value, -MAX_SPEED), MAX_SPEED);
    vy.value = Math.min(Math.max(vy.value, -MAX_SPEED), MAX_SPEED);

    // Move one axis at a time, so the ball slides along walls it hits.
    x.value += vx.value * dt;
    for (const wall of walls) {
      if (isInside(wall, x.value, y.value)) {
        x.value = vx.value > 0 ? wall.left : wall.right;
        vx.value = 0;
      }
    }

    y.value += vy.value * dt;
    for (const wall of walls) {
      if (isInside(wall, x.value, y.value)) {
        y.value = vy.value > 0 ? wall.top : wall.bottom;
        vy.value = 0;
      }
    }

    // An enemy sends the ball back to the start. Coins and time are kept.
    const reach = radius + enemyRadius;
    for (const patrol of patrols) {
      const enemy = patrolAt(patrol, clock.value);
      if (Math.hypot(x.value - enemy.x, y.value - enemy.y) < reach) {
        x.value = start.x;
        y.value = start.y;
        vx.value = 0;
        vy.value = 0;
        return;
      }
    }

    const reachCoin = radius + coinRadius;
    for (let i = 0; i < coins.length; i++) {
      if (taken.value[i]) continue;
      if (Math.hypot(x.value - coins[i].x, y.value - coins[i].y) < reachCoin) {
        const next = [...taken.value];
        next[i] = true;
        taken.value = next;
        scheduleOnRN(onCoin, i);
      }
    }

    for (const box of finish) {
      if (isInside(box, x.value, y.value)) {
        finished.value = true;
        scheduleOnRN(onGoal, frame.timeSinceFirstFrame, taken.value.filter(Boolean).length);
        return;
      }
    }
  });

  return { x, y, clock, cell, radius, wallTiles, finishTiles, coins, coinRadius, patrols, enemyRadius };
}
