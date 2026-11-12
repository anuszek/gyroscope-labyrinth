import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeOut,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Level } from '../../data/levels';
import { BallSprite, CoinSprite, EnemyBody, EnemyFace, GoalSprite, StartMarker } from '../../ui/game/Sprites';
import { Colors } from '../../ui/theme/colors';
import { useColors, useStyles } from '../../ui/theme/useTheme';
import { COUNTDOWN_MS, Patrol, patrolAt, useBall } from './useBall';

type Props = {
  level: Level;
  onCoin: (index: number) => void;
  onHit: () => void;
  onCountdown: (step: number) => void;
  onGoal: (time: number, coins: number) => void;
  paused: boolean;
};

export function BallScreen({ level, onCoin, onHit, onCountdown, onGoal, paused }: Props) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  // 3, 2, 1, then 0 for "GO!", then -1 once the text has gone.
  const [step, setStep] = useState(3);
  const { x, y, scale, flash, clock, elapsed, taken, cell, radius, board, start, goal, wallTiles, coins, coinRadius, patrols, enemyRadius } =
    useBall(
      level,
      {
        onGoal,
        onCoin,
        onHit,
        onCountdown: (next) => {
          setStep(next);
          onCountdown(next);
        },
      },
      paused,
    );

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - radius }, { translateY: y.value - radius }, { scale: scale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.35 }));

  // The goal swells and settles, to catch the eye.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const goalSize = cell * 1.7;
  const startSize = cell * 0.95;

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.board,
          { left: board.left, top: board.top, width: board.width, height: board.height, borderRadius: cell * 0.4 + 12 },
        ]}
      />
      <View style={{ position: 'absolute', left: start.x - startSize / 2, top: start.y - startSize / 2 }}>
        <StartMarker size={startSize} color={colors.textFaint} />
      </View>
      {wallTiles.map((tile) => (
        <View
          key={`${tile.left},${tile.top}`}
          style={{
            position: 'absolute',
            left: tile.left,
            top: tile.top,
            // A hair larger than the tile, so neighbouring walls never show a seam.
            width: cell + 0.75,
            height: cell + 0.75,
            backgroundColor: colors.wall,
            borderTopLeftRadius: tile.topLeft,
            borderTopRightRadius: tile.topRight,
            borderBottomRightRadius: tile.bottomRight,
            borderBottomLeftRadius: tile.bottomLeft,
          }}
        />
      ))}
      <Animated.View
        style={[{ position: 'absolute', left: goal.x - goalSize / 2, top: goal.y - goalSize / 2 }, pulseStyle]}
      >
        <GoalSprite size={goalSize} />
      </Animated.View>
      {coins.map((coin, index) => (
        <Coin key={`coin-${index}`} index={index} x={coin.x} y={coin.y} radius={coinRadius} taken={taken} />
      ))}
      {patrols.map((patrol, index) => (
        <Enemy key={`enemy-${index}`} patrol={patrol} clock={clock} radius={enemyRadius} />
      ))}
      <Animated.View style={[{ position: 'absolute', width: radius * 2, height: radius * 2 }, ballStyle]}>
        <BallSprite size={radius * 2} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
      <Timer elapsed={elapsed} />
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

const pad = (n: number) => String(n).padStart(2, '0');

// 83400 ms -> "01:23.4"
function formatClock(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor(ms / 1000) % 60;
  const tenths = Math.floor(ms / 100) % 10;
  return `${pad(minutes)}:${pad(seconds)}.${tenths}`;
}

// Shows the play time so far. It only re-renders itself, a few times a second.
function Timer({ elapsed }: { elapsed: SharedValue<number> }) {
  const styles = useStyles(makeStyles);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, elapsed.value - COUNTDOWN_MS)), 100);
    return () => clearInterval(id);
  }, [elapsed]);

  return (
    <View style={styles.timer}>
      <Text style={styles.timerValue}>{formatClock(ms)}</Text>
      <Text style={styles.timerCaption}>ELAPSED</Text>
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
    <Animated.View style={[{ position: 'absolute', left: x - radius, top: y - radius }, style]}>
      <CoinSprite size={radius * 2} />
    </Animated.View>
  );
}

// Walks its route, with the spiky body turning slowly behind a face that stays upright.
function Enemy({ patrol, clock, radius }: { patrol: Patrol; clock: SharedValue<number>; radius: number }) {
  const size = radius * 2;
  const style = useAnimatedStyle(() => {
    const { x, y } = patrolAt(patrol, clock.value);
    return { transform: [{ translateX: x - radius }, { translateY: y - radius }] };
  });
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${(clock.value * 60) % 360}deg` }] }));

  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Animated.View style={spin}>
        <EnemyBody size={size} />
      </Animated.View>
      <EnemyFace size={size} />
    </Animated.View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    board: {
      position: 'absolute',
      backgroundColor: colors.floor,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    flash: {
      backgroundColor: colors.hitFlash,
    },
    timer: {
      position: 'absolute',
      top: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
      pointerEvents: 'none',
    },
    timerValue: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
      fontVariant: ['tabular-nums'],
    },
    timerCaption: {
      fontSize: 10,
      letterSpacing: 1,
      color: colors.textMuted,
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
