import { useMemo } from 'react';
import { Canvas, Circle, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

import type { Level } from '../levels/level1';

const COLORS = {
  background: '#f4ead5',
  wall: '#5b3a1e',
  goal: '#3fa34d',
  ball: '#c0c4cc',
};

type Props = {
  level: Level;
  width: number;
  height: number;
  cellSize: number;
  offsetY: number;
  radius: number;
  ballX: SharedValue<number>;
  ballY: SharedValue<number>;
};

export function MazeCanvas({ level, width, height, cellSize, offsetY, radius, ballX, ballY }: Props) {
  const wallsPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    for (let row = 0; row < level.rows; row++) {
      for (let col = 0; col < level.cols; col++) {
        if (level.walls[row * level.cols + col] === 1) {
          builder.addRect(Skia.XYWHRect(col * cellSize, row * cellSize, cellSize, cellSize));
        }
      }
    }
    return builder.detach();
  }, [level, cellSize]);

  return (
    <Canvas style={{ width, height }}>
      <Rect x={0} y={0} width={width} height={height} color={COLORS.background} />
      <Group transform={[{ translateY: offsetY }]}>
        <Rect
          x={level.goal.col * cellSize}
          y={level.goal.row * cellSize}
          width={cellSize}
          height={cellSize}
          color={COLORS.goal}
        />
        <Path path={wallsPath} color={COLORS.wall} />
        <Circle cx={ballX} cy={ballY} r={radius} color={COLORS.ball} />
      </Group>
    </Canvas>
  );
}
