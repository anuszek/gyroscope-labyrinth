import { SensorType, useAnimatedSensor, useDerivedValue } from 'react-native-reanimated';

export function useTilt() {
  const { sensor } = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });

  return useDerivedValue(() => ({
    x: sensor.value.x / 9.81,
    y: -sensor.value.y / 9.81,
  }));
}
