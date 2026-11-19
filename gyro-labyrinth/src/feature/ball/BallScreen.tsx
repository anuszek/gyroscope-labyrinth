import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Level, PowerupType } from '../../data/levels';
import {
  BallSprite,
  CoinSprite,
  EnemyBody,
  EnemyFace,
  EnemyTone,
  GoalSprite,
  POWERUP_GLOW,
  PowerupSprite,
  StartMarker,
} from '../../ui/game/Sprites';
import { Colors } from '../../ui/theme/colors';
import { useColors, useStyles } from '../../ui/theme/useTheme';
import { EnemyState } from './enemies';
import { COUNTDOWN_MS, useBall } from './useBall';

type Props = {
  level: Level;
  onCoin: (index: number) => void;
  onHit: () => void;
  onPowerup: (type: PowerupType) => void;
  onShieldBreak: () => void;
  onCountdown: (step: number) => void;
  onGoal: (time: number, coins: number) => void;
  paused: boolean;
};

export function BallScreen({ level, onCoin, onHit, onPowerup, onShieldBreak, onCountdown, onGoal, paused }: Props) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  // 3, 2, 1, then 0 for "GO!", then -1 once the text has gone.
  const [step, setStep] = useState(3);
  const ball = useBall(
    level,
    {
      onGoal,
      onCoin,
      onHit,
      onPowerup,
      onShieldBreak,
      onCountdown: (next) => {
        setStep(next);
        onCountdown(next);
      },
    },
    paused,
  );
  const { x, y, scale, flash, pop, clock, elapsed, enemies, enemyTime, taken, powerupTaken } = ball;
  const { shield, freezeUntil, speedUntil, cell, radius, board, start, goal, wallTiles } = ball;

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - radius }, { translateY: y.value - radius }, { scale: scale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.35 }));

  // The goal swells and settles, to catch the eye. The shield bubble breathes with it.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  // Effects around the ball: a bubble while shielded, a glow while boosted, a ring when the shield breaks.
  const shieldStyle = useAnimatedStyle(() => ({
    opacity: withTiming(shield.value ? 1 : 0, { duration: 200 }),
    transform: [{ scale: withTiming(shield.value ? 1 : 0.6, { duration: 200 }) }, { scale: pulse.value }],
  }));
  const speedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(clock.value < speedUntil.value ? 1 : 0, { duration: 200 }),
    transform: [{ scale: pulse.value }],
  }));
  const popStyle = useAnimatedStyle(() => ({
    opacity: 1 - pop.value,
    transform: [{ scale: 1 + pop.value * 0.9 }],
  }));
  // A pale blue tint over the whole board while the enemies are frozen.
  const freezeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(clock.value < freezeUntil.value ? 0.16 : 0, { duration: 250 }),
  }));

  const goalSize = cell * 1.7;
  const startSize = cell * 0.95;
  const ballSize = radius * 2;
  const shieldSize = ballSize * 1.7;
  const glowSize = ballSize * 1.5;

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
        pointerEvents="none"
        style={[
          styles.freezeTint,
          { left: board.left, top: board.top, width: board.width, height: board.height, borderRadius: cell * 0.4 + 12 },
          freezeStyle,
        ]}
      />
      <Animated.View
        style={[{ position: 'absolute', left: goal.x - goalSize / 2, top: goal.y - goalSize / 2 }, pulseStyle]}
      >
        <GoalSprite size={goalSize} />
      </Animated.View>
      {ball.coins.map((coin, index) => (
        <Coin key={`coin-${index}`} index={index} x={coin.x} y={coin.y} radius={ball.coinRadius} taken={taken} />
      ))}
      {ball.powerups.map((powerup, index) => (
        <PowerupItem
          key={`powerup-${index}`}
          index={index}
          type={powerup.type}
          x={powerup.x}
          y={powerup.y}
          radius={ball.powerupRadius}
          taken={powerupTaken}
        />
      ))}
      {ball.enemyKinds.map((tone, index) => (
        <Enemy
          key={`enemy-${index}`}
          index={index}
          tone={tone}
          enemies={enemies}
          enemyTime={enemyTime}
          clock={clock}
          freezeUntil={freezeUntil}
          radius={ball.enemyRadius}
        />
      ))}
      <Animated.View style={[{ position: 'absolute', width: ballSize, height: ballSize }, ballStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.speedGlow,
            { width: glowSize, height: glowSize, borderRadius: glowSize / 2, left: (ballSize - glowSize) / 2, top: (ballSize - glowSize) / 2 },
            speedStyle,
          ]}
        />
        <BallSprite size={ballSize} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bubble,
            { width: shieldSize, height: shieldSize, borderRadius: shieldSize / 2, left: (ballSize - shieldSize) / 2, top: (ballSize - shieldSize) / 2 },
            shieldStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.popRing,
            { width: shieldSize, height: shieldSize, borderRadius: shieldSize / 2, left: (ballSize - shieldSize) / 2, top: (ballSize - shieldSize) / 2 },
            popStyle,
          ]}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
      <Timer elapsed={elapsed} />
      <EffectsHud shield={shield} freezeUntil={freezeUntil} speedUntil={speedUntil} clock={clock} />
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

type Effects = { shield: boolean; freeze: number; speed: number };

// Small chips for the powerups that are working right now, with the seconds left on the timed ones.
function EffectsHud({
  shield,
  freezeUntil,
  speedUntil,
  clock,
}: {
  shield: SharedValue<boolean>;
  freezeUntil: SharedValue<number>;
  speedUntil: SharedValue<number>;
  clock: SharedValue<number>;
}) {
  const styles = useStyles(makeStyles);
  const [fx, setFx] = useState<Effects>({ shield: false, freeze: 0, speed: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      const next = {
        shield: shield.value,
        freeze: Math.max(0, Math.round((freezeUntil.value - clock.value) * 10) / 10),
        speed: Math.max(0, Math.round((speedUntil.value - clock.value) * 10) / 10),
      };
      setFx((prev) => (prev.shield === next.shield && prev.freeze === next.freeze && prev.speed === next.speed ? prev : next));
    }, 100);
    return () => clearInterval(id);
  }, [shield, freezeUntil, speedUntil, clock]);

  const chips: { type: PowerupType; label: string }[] = [];
  if (fx.shield) chips.push({ type: 'shield', label: 'Shield' });
  if (fx.freeze > 0) chips.push({ type: 'freeze', label: `${fx.freeze.toFixed(1)}s` });
  if (fx.speed > 0) chips.push({ type: 'speed', label: `${fx.speed.toFixed(1)}s` });

  return (
    <View pointerEvents="none" style={styles.effects}>
      {chips.map((chip) => (
        <Animated.View
          key={chip.type}
          entering={ZoomIn.duration(220)}
          exiting={FadeOut.duration(180)}
          style={[styles.chip, { borderColor: POWERUP_GLOW[chip.type] }]}
        >
          <PowerupSprite type={chip.type} size={20} />
          <Text style={styles.chipText}>{chip.label}</Text>
        </Animated.View>
      ))}
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

// Floats gently over a softly glowing halo. When the ball takes it, it swells and fades while a ring bursts outward.
function PowerupItem({
  index,
  type,
  x,
  y,
  radius,
  taken,
}: {
  index: number;
  type: PowerupType;
  x: number;
  y: number;
  radius: number;
  taken: SharedValue<boolean[]>;
}) {
  const size = radius * 2;
  const haloSize = size * 1.9;
  const glow = POWERUP_GLOW[type];

  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [float]);
  // 0 while it waits, then 0 -> 1 over half a second once it has been taken.
  const burst = useDerivedValue(() => withTiming(taken.value[index] ? 1 : 0, { duration: 500 }));

  const bodyStyle = useAnimatedStyle(() => {
    const got = taken.value[index];
    return {
      opacity: withTiming(got ? 0 : 1, { duration: 260 }),
      transform: [{ translateY: (float.value - 0.5) * 6 }, { scale: withTiming(got ? 2 : 1, { duration: 260 }) }],
    };
  });
  const haloStyle = useAnimatedStyle(() => ({
    opacity: taken.value[index] ? 0 : 0.16 + float.value * 0.22,
    transform: [{ scale: 0.9 + float.value * 0.25 }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: burst.value > 0 ? 1 - burst.value : 0,
    transform: [{ scale: 0.6 + burst.value * 2.4 }],
  }));

  const spot = { position: 'absolute' as const, left: x - size / 2, top: y - size / 2, width: size, height: size };
  const centered = (d: number) => ({ position: 'absolute' as const, width: d, height: d, borderRadius: d / 2, left: (size - d) / 2, top: (size - d) / 2 });

  return (
    <View pointerEvents="none" style={spot}>
      <Animated.View style={[centered(haloSize), { backgroundColor: glow }, haloStyle]} />
      <Animated.View style={[centered(size * 1.4), { borderWidth: 3, borderColor: glow }, ringStyle]} />
      <Animated.View style={bodyStyle}>
        <PowerupSprite type={type} size={size} />
      </Animated.View>
    </View>
  );
}

// Reads its place from the shared list of enemies. The spiky body turns slowly behind a face that stays upright;
// when the enemies are frozen it stops turning and ice forms over it.
function Enemy({
  index,
  tone,
  enemies,
  enemyTime,
  clock,
  freezeUntil,
  radius,
}: {
  index: number;
  tone: EnemyTone;
  enemies: SharedValue<EnemyState[]>;
  enemyTime: SharedValue<number>;
  clock: SharedValue<number>;
  freezeUntil: SharedValue<number>;
  radius: number;
}) {
  const size = radius * 2;
  const style = useAnimatedStyle(() => {
    const enemy = enemies.value[index];
    return { transform: [{ translateX: enemy.x - radius }, { translateY: enemy.y - radius }] };
  });
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${(enemyTime.value * 60) % 360}deg` }] }));
  const ice = useAnimatedStyle(() => ({ opacity: withTiming(clock.value < freezeUntil.value ? 0.6 : 0, { duration: 200 }) }));

  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Animated.View style={spin}>
        <EnemyBody size={size} tone={tone} />
      </Animated.View>
      <EnemyFace size={size} />
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: radius, backgroundColor: '#bae6fd', borderWidth: 2, borderColor: '#e0f2fe' },
          ice,
        ]}
      />
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
    freezeTint: {
      position: 'absolute',
      backgroundColor: '#67e8f9',
    },
    bubble: {
      position: 'absolute',
      borderWidth: 2.5,
      borderColor: 'rgba(96, 165, 250, 0.95)',
      backgroundColor: 'rgba(147, 197, 253, 0.22)',
    },
    popRing: {
      position: 'absolute',
      borderWidth: 3,
      borderColor: '#60a5fa',
    },
    speedGlow: {
      position: 'absolute',
      backgroundColor: 'rgba(251, 191, 36, 0.4)',
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
    effects: {
      position: 'absolute',
      top: 66,
      left: 16,
      flexDirection: 'row',
      gap: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingLeft: 6,
      paddingRight: 12,
      borderRadius: 16,
      borderWidth: 1.5,
      backgroundColor: colors.surface,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
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
