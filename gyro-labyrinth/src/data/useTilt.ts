import { SensorType, useAnimatedSensor, useDerivedValue } from 'react-native-reanimated';

// Reads the phone's tilt. Reanimated reports gravity in m/s^2 in the same directions on iOS and Android:
// x grows when the right edge goes down and y grows when the top edge goes down.
//
// `tilt` is the raw tilt (see tilt.ts). Calibration and sensitivity are applied later, by `steering`.
// `gravity` is the sensor's raw reading. It is all zeros when the phone has no motion sensor.
export function useTilt() {
  const { sensor } = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });

  const tilt = useDerivedValue(() => ({
    x: sensor.value.x / 9.81,
    y: -sensor.value.y / 9.81,
  }));

  return { tilt, gravity: sensor };
}
