import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
  type FrameInfo,
} from 'react-native-reanimated';

import { BALL_RADIUS_RATIO, MAX_DT } from '../src/game/config';
import type { Ball } from '../src/game/collisions';
import { isInCell, stepBall } from '../src/game/physics';
import { LEVEL_1, parseLevel } from '../src/levels/level1';
import { MazeCanvas } from '../src/render/MazeCanvas';
import { useTilt } from '../src/sensors/useTilt';

const level = parseLevel(LEVEL_1);

type Layout = { width: number; height: number; cellSize: number; offsetY: number; radius: number };

function computeLayout(width: number, height: number): Layout {
  const cellSize = width / level.cols;
  return {
    width,
    height,
    cellSize,
    offsetY: (height - level.rows * cellSize) / 2,
    radius: cellSize * BALL_RADIUS_RATIO,
  };
}

export default function Game() {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [won, setWon] = useState(false);
  const { readTilt, recalibrate, isAvailable } = useTilt();

  // Ball state in maze-local pixels, owned by the UI thread.
  const ballX = useSharedValue(0);
  const ballY = useSharedValue(0);
  const velX = useSharedValue(0);
  const velY = useSharedValue(0);
  const running = useSharedValue(false);

  const resetBall = useCallback(() => {
    if (!layout) return;
    ballX.value = (level.start.col + 0.5) * layout.cellSize;
    ballY.value = (level.start.row + 0.5) * layout.cellSize;
    velX.value = 0;
    velY.value = 0;
    running.value = true;
    setWon(false);
  }, [layout, ballX, ballY, velX, velY, running]);

  useEffect(() => {
    resetBall();
  }, [resetBall]);

  const onFrame = useCallback(
    (frame: FrameInfo) => {
      'worklet';
      // Read every frame so the first valid sample becomes the neutral pose.
      const tilt = readTilt();
      if (!layout || !running.value || frame.timeSincePreviousFrame === null) return;

      const dt = Math.min(frame.timeSincePreviousFrame / 1000, MAX_DT);
      const ball: Ball = { x: ballX.value, y: ballY.value, vx: velX.value, vy: velY.value };
      stepBall(ball, tilt.x, tilt.y, dt, layout.radius, layout.cellSize, level);

      ballX.value = ball.x;
      ballY.value = ball.y;
      velX.value = ball.vx;
      velY.value = ball.vy;

      if (isInCell(ball, level.goal.col, level.goal.row, layout.cellSize)) {
        running.value = false;
        runOnJS(setWon)(true);
      }
    },
    [layout, readTilt, ballX, ballY, velX, velY, running],
  );

  useFrameCallback(onFrame);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (layout && layout.width === width && layout.height === height) return;
    setLayout(computeLayout(width, height));
  };

  const onPress = () => {
    if (won) resetBall();
    else recalibrate();
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress}>
        {layout && (
          <MazeCanvas
            level={level}
            width={layout.width}
            height={layout.height}
            cellSize={layout.cellSize}
            offsetY={layout.offsetY}
            radius={layout.radius}
            ballX={ballX}
            ballY={ballY}
          />
        )}
        {won && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.overlayTitle}>Meta!</Text>
            <Text style={styles.overlayHint}>Dotknij, aby zagrać ponownie</Text>
          </View>
        )}
        {!isAvailable && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.overlayHint}>Gravity sensor not available on this device</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4ead5',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 56,
    fontWeight: 'bold',
  },
  overlayHint: {
    color: '#fff',
    fontSize: 18,
    marginTop: 12,
  },
});
