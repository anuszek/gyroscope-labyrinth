import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Level } from '../../data/levels';
import { colors } from '../../ui/theme/colors';
import { useBall } from './useBall';

type Props = { level: Level; onGoal: (time: number) => void };

export function BallScreen({ level, onGoal }: Props) {
  const { x, y, cell, radius, wallTiles, finishTiles } = useBall(level, onGoal);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - radius }, { translateY: y.value - radius }],
  }));

  return (
    <View style={styles.floor}>
      {finishTiles.map((tile) => (
        <View key={`${tile.left},${tile.top}`} style={[styles.finish, tile, { width: cell, height: cell }]}>
          <View style={[styles.check, { width: cell / 2, height: cell / 2 }]} />
          <View style={[styles.check, { left: cell / 2, top: cell / 2, width: cell / 2, height: cell / 2 }]} />
        </View>
      ))}
      {wallTiles.map((tile) => (
        <View key={`${tile.left},${tile.top}`} style={[styles.wall, tile, { width: cell, height: cell }]} />
      ))}
      <Animated.View style={[styles.ball, { width: radius * 2, height: radius * 2, borderRadius: radius }, ballStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  floor: {
    flex: 1,
    backgroundColor: colors.floor,
  },
  wall: {
    position: 'absolute',
    backgroundColor: colors.wall,
    borderWidth: 2,
    borderColor: colors.wallEdge,
  },
  finish: {
    position: 'absolute',
    backgroundColor: colors.surface,
  },
  check: {
    position: 'absolute',
    backgroundColor: colors.text,
  },
  ball: {
    position: 'absolute',
    backgroundColor: colors.ball,
  },
});
