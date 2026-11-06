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
const TOP_BAR = 64; // kept clear of the board for the back button

type Box = { left: number; right: number; top: number; bottom: number };

function isInside(box: Box, x: number, y: number) {
  'worklet';
  return x > box.left && x < box.right && y > box.top && y < box.bottom;
}

export function useBall(level: Level, onGoal: (time: number) => void) {
  const { width, height } = useWindowDimensions();
  const tilt = useTilt();

  const cols = level.rows[0].length;
  const rows = level.rows.length;
  const cell = Math.min(width / cols, (height - TOP_BAR) / rows);
  const left = (width - cols * cell) / 2;
  const top = TOP_BAR + (height - TOP_BAR - rows * cell) / 2;
  const radius = cell * BALL_RATIO;

  const place = ({ col, row }: { col: number; row: number }) => ({ left: left + col * cell, top: top + row * cell });
  const wallTiles = findTiles(level, '#').map(place);
  const finishTiles = findTiles(level, 'F').map(place);
  const start = place(findTiles(level, 'S')[0]);

  // Tiles grown by the ball's half width, so the ball can be treated as a point.
  const grow = (tile: { left: number; top: number }): Box => ({
    left: tile.left - radius,
    right: tile.left + cell + radius,
    top: tile.top - radius,
    bottom: tile.top + cell + radius,
  });
  const walls = wallTiles.map(grow);
  const finish = finishTiles.map(grow);

  const x = useSharedValue(start.left + cell / 2);
  const y = useSharedValue(start.top + cell / 2);
  const vx = useSharedValue(0);
  const vy = useSharedValue(0);
  const finished = useSharedValue(false);

  useFrameCallback((frame) => {
    if (finished.value) return;

    const dt = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, 1 / 30);

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

    for (const box of finish) {
      if (isInside(box, x.value, y.value)) {
        finished.value = true;
        scheduleOnRN(onGoal, frame.timeSinceFirstFrame);
        return;
      }
    }
  });

  return { x, y, cell, radius, wallTiles, finishTiles };
}
