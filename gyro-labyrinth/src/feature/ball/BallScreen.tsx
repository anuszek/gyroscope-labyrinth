import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, SharedValue, useAnimatedStyle, withTiming, ZoomIn } from 'react-native-reanimated';

import { Level } from '../../data/levels';
import { colors } from '../../ui/theme/colors';
import { Patrol, patrolAt, useBall } from './useBall';

type Props = {
  level: Level;
  onCoin: (index: number) => void;
  onHit: () => void;
  onCountdown: (step: number) => void;
  onGoal: (time: number, coins: number) => void;
};

export function BallScreen({ level, onCoin, onHit, onCountdown, onGoal }: Props) {
  // 3, 2, 1, then 0 for "GO!", then -1 once the text has gone.
  const [step, setStep] = useState(3);
  const { x, y, scale, flash, clock, taken, cell, radius, wallTiles, finishTiles, coins, coinRadius, patrols, enemyRadius } =
    useBall(level, {
      onGoal,
      onCoin,
      onHit,
      onCountdown: (next) => {
        setStep(next);
        onCountdown(next);
      },
    });

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - radius }, { translateY: y.value - radius }, { scale: scale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.35 }));

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
      {coins.map((coin, index) => (
        <Coin key={`coin-${index}`} index={index} x={coin.x} y={coin.y} radius={coinRadius} taken={taken} />
      ))}
      {patrols.map((patrol, index) => (
        <Enemy key={`enemy-${index}`} patrol={patrol} clock={clock} radius={enemyRadius} />
      ))}
      <Animated.View style={[styles.ball, { width: radius * 2, height: radius * 2, borderRadius: radius }, ballStyle]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
      {step >= 0 && (
        <View pointerEvents="none" style={styles.countWrap}>
          <Animated.View
            key={step}
            entering={ZoomIn.duration(250)}
            exiting={FadeOut.duration(200)}
            style={styles.countBadge}
          >
            <Animated.Text style={styles.countText}>{step > 0 ? step : 'GO!'}</Animated.Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// Fades and swells when the ball picks it up.
function Coin({
  index,
  x,
  y,
  radius,
  taken,
}: {
  index: number;
  x: number;
  y: number;
  radius: number;
  taken: SharedValue<boolean[]>;
}) {
  const style = useAnimatedStyle(() => {
    const got = taken.value[index];
    return {
      opacity: withTiming(got ? 0 : 1, { duration: 220 }),
      transform: [{ scale: withTiming(got ? 1.8 : 1, { duration: 220 }) }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.coin,
        { left: x - radius, top: y - radius, width: radius * 2, height: radius * 2, borderRadius: radius },
        style,
      ]}
    />
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
  flash: {
    backgroundColor: colors.hitFlash,
  },
  countWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 128,
    height: 128,
    paddingHorizontal: 20,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
  },
  countText: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.text,
  },
});
