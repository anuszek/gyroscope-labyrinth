import { useWindowDimensions } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { useTilt } from '../../data/useTilt';

export const RADIUS = 24;
const ACCEL = 1000;
const FRICTION = 0.98;

export function useBall() {
  const { width, height } = useWindowDimensions();
  const tilt = useTilt();
  const x = useSharedValue(width / 2);
  const y = useSharedValue(height / 2);
  const vx = useSharedValue(0);
  const vy = useSharedValue(0);

  useFrameCallback((frame) => {
    const dt = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, 1 / 30);

    vx.value = (vx.value + tilt.value.x * ACCEL * dt) * FRICTION;
    vy.value = (vy.value + tilt.value.y * ACCEL * dt) * FRICTION;
    x.value += vx.value * dt;
    y.value += vy.value * dt;

    if (x.value < RADIUS || x.value > width - RADIUS) {
      x.value = Math.min(Math.max(x.value, RADIUS), width - RADIUS);
      vx.value = 0;
    }
    if (y.value < RADIUS || y.value > height - RADIUS) {
      y.value = Math.min(Math.max(y.value, RADIUS), height - RADIUS);
      vy.value = 0;
    }
  });

  return { x, y };
}
