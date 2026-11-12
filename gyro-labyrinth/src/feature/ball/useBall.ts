import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { useFrameCallback, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useGameStore } from '../../data/GameStore';
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
const TOP_BAR = 108; // kept clear of the board for the HUD (level, timer, pause, coins)
const BOARD_PAD = 10; // space between the maze and the edge of the board card
const SCREEN_MARGIN = 12; // space between the board card and the edge of the screen

// The level starts with a 3-2-1 countdown, then "GO!" stays on screen a moment while play begins.
const COUNT_FROM = 3;
const COUNT_STEP_MS = 700;
export const COUNTDOWN_MS = COUNT_FROM * COUNT_STEP_MS;
const GO_MS = 500;

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

// 3, 2, 1 while counting down, 0 for "GO!", -1 once the text is gone.
function countdownStep(elapsed: number) {
  'worklet';
  if (elapsed < COUNTDOWN_MS) return COUNT_FROM - Math.floor(elapsed / COUNT_STEP_MS);
  return elapsed < COUNTDOWN_MS + GO_MS ? 0 : -1;
}

type Callbacks = {
  onGoal: (time: number, coins: number) => void;
  onCoin: (index: number) => void;
  onHit: () => void;
  onCountdown: (step: number) => void;
};

export function useBall(level: Level, { onGoal, onCoin, onHit, onCountdown }: Callbacks, paused: boolean) {
  const { width, height } = useWindowDimensions();
  const { settings } = useGameStore();
  const tilt = useTilt();

  // Sensitivity 0..1 scales how hard a tilt pushes (0.7, the default, is 1x).
  const gain = 0.3 + settings.sensitivity;
  const neutral = settings.calibration;

  const cols = level.rows[0].length;
  const rows = level.rows.length;
  const inset = 2 * (SCREEN_MARGIN + BOARD_PAD);
  const cell = Math.min((width - inset) / cols, (height - TOP_BAR - inset) / rows);
  const left = (width - cols * cell) / 2;
  const top = TOP_BAR + (height - TOP_BAR - rows * cell) / 2;
  const board = { left: left - BOARD_PAD, top: top - BOARD_PAD, width: cols * cell + 2 * BOARD_PAD, height: rows * cell + 2 * BOARD_PAD };
  const radius = cell * BALL_RATIO;
  const coinRadius = cell * COIN_RATIO;
  const enemyRadius = cell * ENEMY_RATIO;

  const place = ({ col, row }: { col: number; row: number }) => ({ left: left + col * cell, top: top + row * cell });
  const center = (tile: { col: number; row: number }) => {
    const { left: l, top: t } = place(tile);
    return { x: l + cell / 2, y: t + cell / 2 };
  };
  // Each wall tile is drawn rounded on the corners that face open floor, so walls look like soft pipes.
  const isWall = (col: number, row: number) => level.rows[row]?.[col] === '#';
  const cornerRadius = cell * 0.4;
  const wallTiles = findTiles(level, '#').map((tile) => {
    const up = isWall(tile.col, tile.row - 1);
    const down = isWall(tile.col, tile.row + 1);
    const side = { left: isWall(tile.col - 1, tile.row), right: isWall(tile.col + 1, tile.row) };
    return {
      ...place(tile),
      topLeft: up || side.left ? 0 : cornerRadius,
      topRight: up || side.right ? 0 : cornerRadius,
      bottomRight: down || side.right ? 0 : cornerRadius,
      bottomLeft: down || side.left ? 0 : cornerRadius,
    };
  });
  const finishTiles = findTiles(level, 'F').map(place);
  const finishCenters = findTiles(level, 'F').map(center);
  // One goal marker in the middle of all the finish tiles.
  const goal = {
    x: finishCenters.reduce((sum, c) => sum + c.x, 0) / finishCenters.length,
    y: finishCenters.reduce((sum, c) => sum + c.y, 0) / finishCenters.length,
  };
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
  const scale = useSharedValue(1); // the ball shrinks when hit and when it drops into the finish
  const flash = useSharedValue(0); // red screen flash after a hit, 0..1
  const finished = useSharedValue(false);
  const respawning = useSharedValue(false);
  // Our own stopwatch. The frame callback's own time restarts whenever the screen re-renders.
  const elapsed = useSharedValue(0); // ms since the screen opened, countdown included
  const clock = useSharedValue(0); // seconds of play, drives the enemies
  const lastStep = useSharedValue(-2);
  const taken = useSharedValue<boolean[]>(coins.map(() => false));
  const isPaused = useSharedValue(false);

  useEffect(() => {
    isPaused.value = paused;
  }, [paused, isPaused]);

  useFrameCallback((frame) => {
    // While paused nothing moves and the stopwatch stands still.
    if (finished.value || isPaused.value) return;

    const delta = frame.timeSincePreviousFrame ?? 0;
    elapsed.value += delta;

    const step = countdownStep(elapsed.value);
    if (step !== lastStep.value) {
      lastStep.value = step;
      scheduleOnRN(onCountdown, step);
    }
    // Ball and enemies hold still until the countdown is over.
    if (step > 0) return;

    clock.value = (elapsed.value - COUNTDOWN_MS) / 1000;
    if (respawning.value) return;

    const dt = Math.min(delta / 1000, 1 / 30);

    vx.value = (vx.value + (tilt.value.x - neutral.x) * gain * ACCEL * dt) * FRICTION;
    vy.value = (vy.value + (tilt.value.y - neutral.y) * gain * ACCEL * dt) * FRICTION;
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
        respawning.value = true;
        vx.value = 0;
        vy.value = 0;
        flash.value = withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: 350 }));
        // Shrink away, reappear at the start, then grow back.
        scale.value = withTiming(0, { duration: 150 }, (done) => {
          if (!done) return;
          x.value = start.x;
          y.value = start.y;
          scale.value = withTiming(1, { duration: 250 }, () => {
            respawning.value = false;
          });
        });
        scheduleOnRN(onHit);
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

    for (let i = 0; i < finish.length; i++) {
      if (isInside(finish[i], x.value, y.value)) {
        finished.value = true;
        const time = elapsed.value - COUNTDOWN_MS;
        const coinCount = taken.value.filter(Boolean).length;
        // The ball rolls into the goal and shrinks, then the level ends.
        x.value = withTiming(goal.x, { duration: 300 });
        y.value = withTiming(goal.y, { duration: 300 });
        scale.value = withTiming(0.3, { duration: 400 }, (done) => {
          if (done) scheduleOnRN(onGoal, time, coinCount);
        });
        return;
      }
    }
  });

  return { x, y, scale, flash, clock, elapsed, taken, cell, radius, board, start, goal, wallTiles, coins, coinRadius, patrols, enemyRadius };
}
