import { useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useFrameCallback, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useGameStore } from '../../data/GameStore';
import { findTiles, isBouncer, isWanderer, Level, PowerupType } from '../../data/levels';
import { steering } from '../../data/tilt';
import { useTilt } from '../../data/useTilt';
import { EnemyState, Patrol, patrolAt, stepBouncer, stepWanderer } from './enemies';
import { Grid, moveBall, Wall } from './walls';

const ACCEL = 1000; // pixels per second per second, for a push of 1
// How fast the ball slows down when it isn't pushed. It is the same as losing 2% of its speed
// each frame at 60 frames a second, but it doesn't depend on the frame rate.
const DAMPING = 1.212;
const MAX_SPEED = 1200;
const BALL_RATIO = 0.4; // half the ball's width, in tiles
const COIN_RATIO = 0.22; // coin radius, in tiles
const ENEMY_RATIO = 0.32; // enemy radius, in tiles
const POWERUP_RATIO = 0.3; // powerup radius, in tiles
const GOAL_RATIO = 0.6; // the ball is home when its centre is this close to a finish tile's centre, in tiles
const WALL_ROUNDING = 0.4; // corner radius of a wall tile, in tiles
const ENEMY_SPEED = 2.5; // tiles per second, when a level doesn't say
const TOP_BAR = 108; // kept clear of the board for the HUD (level, timer, pause, coins), below the notch
const BOARD_PAD = 10; // space between the maze and the edge of the board card
const SCREEN_MARGIN = 12; // space between the board card and the edge of the screen

// How long the timed powerups last, in seconds of play.
export const FREEZE_SECONDS = 4;
export const SPEED_SECONDS = 5;
const SPEED_PUSH = 1.7; // how much harder a tilt pushes the ball while boosted
const SPEED_CAP = 1.25; // how much faster the ball may go while boosted
const SAFE_SECONDS = 1; // enemies can't hurt the ball for a moment after a shield breaks or it respawns

// The level starts with a 3-2-1 countdown, then "GO!" stays on screen a moment while play begins.
const COUNT_FROM = 3;
const COUNT_STEP_MS = 700;
export const COUNTDOWN_MS = COUNT_FROM * COUNT_STEP_MS;
const GO_MS = 500;

export type EnemyKind = 'patrol' | 'wander' | 'bounce';

type EnemyDef = { kind: EnemyKind; patrol: Patrol | null; speed: number };

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
  onPowerup: (type: PowerupType) => void;
  onShieldBreak: () => void;
  onCountdown: (step: number) => void;
};

// Works out where everything on the board goes on this screen. All of it is in pixels.
function layout(level: Level, width: number, height: number, insets: { top: number; bottom: number }) {
  const cols = level.rows[0].length;
  const rows = level.rows.length;
  const inset = 2 * (SCREEN_MARGIN + BOARD_PAD);
  const areaTop = insets.top + TOP_BAR;
  const areaHeight = height - areaTop - insets.bottom;
  const cell = Math.min((width - inset) / cols, (areaHeight - inset) / rows);
  const left = (width - cols * cell) / 2;
  const top = areaTop + (areaHeight - rows * cell) / 2;
  const board = { left: left - BOARD_PAD, top: top - BOARD_PAD, width: cols * cell + 2 * BOARD_PAD, height: rows * cell + 2 * BOARD_PAD };

  const place = ({ col, row }: { col: number; row: number }) => ({ left: left + col * cell, top: top + row * cell });
  const center = (tile: { col: number; row: number }) => {
    const { left: l, top: t } = place(tile);
    return { x: l + cell / 2, y: t + cell / 2 };
  };

  // Each wall tile is rounded on the corners that face open floor, so walls look like soft pipes. The ball and
  // the enemies collide with these same shapes. A tile that touches another wall also remembers which side it
  // touches on, so the drawing can overlap there and leave no seam.
  const isWall = (col: number, row: number) => level.rows[row]?.[col] === '#';
  const rounding = cell * WALL_ROUNDING;
  const wallTiles = findTiles(level, '#').map((tile) => {
    const up = isWall(tile.col, tile.row - 1);
    const down = isWall(tile.col, tile.row + 1);
    const leftSide = isWall(tile.col - 1, tile.row);
    const rightSide = isWall(tile.col + 1, tile.row);
    return {
      tile,
      ...place(tile),
      joinsUp: up,
      joinsDown: down,
      joinsLeft: leftSide,
      joinsRight: rightSide,
      tl: up || leftSide ? 0 : rounding,
      tr: up || rightSide ? 0 : rounding,
      br: down || rightSide ? 0 : rounding,
      bl: down || leftSide ? 0 : rounding,
    };
  });
  const grid: Grid = { walls: Array(cols * rows).fill(null), cols, rows, left, top, cell };
  for (const wall of wallTiles) {
    const shape: Wall = { x: wall.left, y: wall.top, tl: wall.tl, tr: wall.tr, br: wall.br, bl: wall.bl };
    grid.walls[wall.tile.row * cols + wall.tile.col] = shape;
  }

  const finishCenters = findTiles(level, 'F').map(center);
  const enemyDefs = level.enemies.map<EnemyDef>((enemy) => {
    if (isWanderer(enemy)) return { kind: 'wander', patrol: null, speed: (enemy.speed ?? ENEMY_SPEED) * cell };
    if (isBouncer(enemy)) return { kind: 'bounce', patrol: null, speed: (enemy.speed ?? ENEMY_SPEED) * cell };
    const a = center(enemy.from);
    const b = center(enemy.to);
    const speed = (enemy.speed ?? ENEMY_SPEED) * cell;
    return { kind: 'patrol', patrol: { x1: a.x, y1: a.y, x2: b.x, y2: b.y, length: Math.hypot(b.x - a.x, b.y - a.y), speed }, speed };
  });

  return {
    cell,
    board,
    grid,
    wallTiles,
    start: center(findTiles(level, 'S')[0]),
    finishCenters,
    // One goal marker in the middle of all the finish tiles.
    goal: {
      x: finishCenters.reduce((sum, c) => sum + c.x, 0) / finishCenters.length,
      y: finishCenters.reduce((sum, c) => sum + c.y, 0) / finishCenters.length,
    },
    coins: findTiles(level, 'C').map(center),
    powerups: level.powerups.map((powerup) => ({ ...center(powerup.at), type: powerup.type })),
    enemyDefs,
    enemyKinds: enemyDefs.map((def) => def.kind),
    enemyStarts: level.enemies.map<EnemyState>((enemy) => ({
      ...center(isWanderer(enemy) ? enemy.wander : isBouncer(enemy) ? enemy.bounce : enemy.from),
      dx: 0,
      dy: 0,
    })),
  };
}

export function useBall(
  level: Level,
  { onGoal, onCoin, onHit, onPowerup, onShieldBreak, onCountdown }: Callbacks,
  paused: boolean,
) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { settings } = useGameStore();
  const { tilt } = useTilt();

  const { sensitivity, deadZone, calibration } = settings;
  const { top: insetTop, bottom: insetBottom } = insets;
  const { cell, board, grid, wallTiles, start, finishCenters, goal, coins, powerups, enemyDefs, enemyKinds, enemyStarts } = useMemo(
    () => layout(level, width, height, { top: insetTop, bottom: insetBottom }),
    [level, width, height, insetTop, insetBottom],
  );
  const radius = cell * BALL_RATIO;
  const coinRadius = cell * COIN_RATIO;
  const enemyRadius = cell * ENEMY_RATIO;
  const powerupRadius = cell * POWERUP_RATIO;
  const goalReach = cell * GOAL_RATIO;

  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const vx = useSharedValue(0);
  const vy = useSharedValue(0);
  const scale = useSharedValue(1); // the ball shrinks when hit and when it drops into the finish
  const flash = useSharedValue(0); // red screen flash after a hit, 0..1
  const pop = useSharedValue(1); // a ring that bursts out of the ball when its shield breaks, 0..1
  const finished = useSharedValue(false);
  const respawning = useSharedValue(false);
  // Our own stopwatch. The frame callback's own time restarts whenever the screen re-renders.
  const elapsed = useSharedValue(0); // ms since the screen opened, countdown included
  const clock = useSharedValue(0); // seconds of play
  const enemyTime = useSharedValue(0); // seconds the enemies have moved, so patrols stop while frozen
  const enemies = useSharedValue<EnemyState[]>(enemyStarts);
  const lastStep = useSharedValue(-2);
  const taken = useSharedValue<boolean[]>(coins.map(() => false));
  const powerupTaken = useSharedValue<boolean[]>(powerups.map(() => false));
  // Powerup effects. The timed ones hold the play time (clock) at which they run out.
  const shield = useSharedValue(false);
  const freezeUntil = useSharedValue(0);
  const speedUntil = useSharedValue(0);
  const safeUntil = useSharedValue(0);
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
    const dt = Math.min(delta / 1000, 1 / 30);

    // Enemies keep moving while the ball respawns, but not while they are frozen.
    const frozen = clock.value < freezeUntil.value;
    if (!frozen) enemyTime.value += dt;
    const before = enemies.value;
    const now: EnemyState[] = [];
    for (let i = 0; i < enemyDefs.length; i++) {
      const def = enemyDefs[i];
      if (def.patrol) {
        const at = patrolAt(def.patrol, enemyTime.value);
        now.push({ x: at.x, y: at.y, dx: 0, dy: 0 });
      } else if (frozen) {
        now.push(before[i]);
      } else if (def.kind === 'bounce') {
        now.push(stepBouncer(before[i], def.speed, dt, grid, enemyRadius));
      } else {
        now.push(stepWanderer(before[i], def.speed, dt, grid, enemyRadius));
      }
    }
    enemies.value = now;

    if (respawning.value) return;

    // Tilt, less the calibration and the dead zone, scaled by sensitivity, pushes the ball. Friction is
    // worked out per second, so the ball feels the same at 60 and at 120 frames a second.
    const boosted = clock.value < speedUntil.value;
    const push = steering(tilt.value, calibration, deadZone, sensitivity);
    const pushScale = (boosted ? SPEED_PUSH : 1) * ACCEL * dt;
    const damping = Math.exp(-DAMPING * dt);
    const cap = boosted ? MAX_SPEED * SPEED_CAP : MAX_SPEED;
    let vxNext = (vx.value + push.x * pushScale) * damping;
    let vyNext = (vy.value + push.y * pushScale) * damping;
    const speed = Math.hypot(vxNext, vyNext);
    if (speed > cap) {
      vxNext = (vxNext / speed) * cap;
      vyNext = (vyNext / speed) * cap;
    }

    // The ball slides along walls and around their rounded corners.
    const moved = moveBall(grid, radius, x.value, y.value, vxNext, vyNext, dt);
    x.value = moved.x;
    y.value = moved.y;
    vx.value = moved.vx;
    vy.value = moved.vy;

    // An enemy sends the ball back to the start (coins and time are kept), unless the enemy is
    // frozen, the ball is still safe from a moment ago, or a shield takes the hit.
    if (!frozen && clock.value >= safeUntil.value) {
      const reach = radius + enemyRadius;
      for (let i = 0; i < now.length; i++) {
        if (Math.hypot(x.value - now[i].x, y.value - now[i].y) >= reach) continue;

        safeUntil.value = clock.value + SAFE_SECONDS;
        if (shield.value) {
          shield.value = false;
          pop.value = 0;
          pop.value = withTiming(1, { duration: 450 });
          scheduleOnRN(onShieldBreak);
          break;
        }

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

    const reachPowerup = radius + powerupRadius;
    for (let i = 0; i < powerups.length; i++) {
      if (powerupTaken.value[i]) continue;
      if (Math.hypot(x.value - powerups[i].x, y.value - powerups[i].y) < reachPowerup) {
        const next = [...powerupTaken.value];
        next[i] = true;
        powerupTaken.value = next;

        const type = powerups[i].type;
        if (type === 'shield') shield.value = true;
        else if (type === 'freeze') freezeUntil.value = clock.value + FREEZE_SECONDS;
        else speedUntil.value = clock.value + SPEED_SECONDS;
        scheduleOnRN(onPowerup, type);
      }
    }

    for (let i = 0; i < finishCenters.length; i++) {
      if (Math.hypot(x.value - finishCenters[i].x, y.value - finishCenters[i].y) < goalReach) {
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

  return {
    x,
    y,
    scale,
    flash,
    pop,
    clock,
    elapsed,
    enemyTime,
    enemies,
    taken,
    powerupTaken,
    shield,
    freezeUntil,
    speedUntil,
    cell,
    radius,
    board,
    start,
    goal,
    wallTiles,
    coins,
    coinRadius,
    powerups,
    powerupRadius,
    enemyKinds,
    enemyRadius,
  };
}
