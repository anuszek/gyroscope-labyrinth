import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { Level } from '../../data/levels';
import { colors } from '../../ui/theme/colors';
import { Patrol, patrolAt, useBall } from './useBall';

type Props = {
  level: Level;
  collected: number[]; // indexes of the coins already picked up
  onCoin: (index: number) => void;
  onGoal: (time: number, coins: number) => void;
};

export function BallScreen({ level, collected, onCoin, onGoal }: Props) {
  const { x, y, clock, cell, radius, wallTiles, finishTiles, coins, coinRadius, patrols, enemyRadius } = useBall(
    level,
    { onGoal, onCoin },
  );

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
      {coins.map((coin, index) =>
        collected.includes(index) ? null : (
          <View
            key={`coin-${index}`}
            style={[
              styles.coin,
              {
                left: coin.x - coinRadius,
                top: coin.y - coinRadius,
                width: coinRadius * 2,
                height: coinRadius * 2,
                borderRadius: coinRadius,
              },
            ]}
          />
        ),
      )}
      {patrols.map((patrol, index) => (
        <Enemy key={`enemy-${index}`} patrol={patrol} clock={clock} radius={enemyRadius} />
      ))}
      <Animated.View style={[styles.ball, { width: radius * 2, height: radius * 2, borderRadius: radius }, ballStyle]} />
    </View>
  );
}

function Enemy({ patrol, clock, radius }: { patrol: Patrol; clock: SharedValue<number>; radius: number }) {
  const style = useAnimatedStyle(() => {
    const { x, y } = patrolAt(patrol, clock.value);
    return { transform: [{ translateX: x - radius }, { translateY: y - radius }] };
  });

  return <Animated.View style={[styles.enemy, { width: radius * 2, height: radius * 2, borderRadius: radius }, style]} />;
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
  coin: {
    position: 'absolute',
    backgroundColor: colors.coin,
    borderWidth: 2,
    borderColor: colors.coinEdge,
  },
  enemy: {
    position: 'absolute',
    backgroundColor: colors.enemy,
    borderWidth: 2,
    borderColor: colors.enemyEdge,
  },
  ball: {
    position: 'absolute',
    backgroundColor: colors.ball,
  },
});
