import { useCallback } from 'react';
import { SensorType, useAnimatedSensor, useSharedValue } from 'react-native-reanimated';

import { DEAD_ZONE, GRAVITY_MS2, TILT_SIGN_X, TILT_SIGN_Y } from '../game/config';

export type Tilt = { x: number; y: number };

function applyDeadZone(value: number): number {
  'worklet';
  const magnitude = Math.abs(value);
  if (magnitude <= DEAD_ZONE) return 0;
  // Rescale so output starts at 0 right outside the dead zone (no jump).
  const scaled = (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE);
  return Math.sign(value) * Math.min(scaled, 1);
}

/**
 * Gravity sensor -> normalized tilt in screen space (x right, y down), each in [-1, 1].
 * The neutral pose is captured from the first valid reading and again whenever
 * `recalibrate()` is called.
 */
export function useTilt() {
  const { sensor, isAvailable } = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });

  const neutralX = useSharedValue(0);
  const neutralY = useSharedValue(0);
  const needsCalibration = useSharedValue(true);

  /** Call from a worklet (e.g. the frame callback) to get the current tilt. */
  const readTilt = useCallback((): Tilt => {
    'worklet';
    const { x, y, z } = sensor.value;
    // Before the first sample arrives the sensor reports all zeros.
    if (x * x + y * y + z * z < 1) return { x: 0, y: 0 };

    if (needsCalibration.value) {
      neutralX.value = x;
      neutralY.value = y;
      needsCalibration.value = false;
    }

    return {
      x: applyDeadZone(((x - neutralX.value) / GRAVITY_MS2) * TILT_SIGN_X),
      y: applyDeadZone(((y - neutralY.value) / GRAVITY_MS2) * TILT_SIGN_Y),
    };
  }, [sensor, neutralX, neutralY, needsCalibration]);

  /** Use the current phone angle as the new neutral on the next frame. */
  const recalibrate = useCallback(() => {
    needsCalibration.value = true;
  }, [needsCalibration]);

  return { readTilt, recalibrate, isAvailable };
}
