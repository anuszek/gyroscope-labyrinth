import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { useFeedback } from '../../data/feedback';
import { useGameStore } from '../../data/GameStore';
import { findTiles, getLevel } from '../../data/levels';
import { useBackInterceptor, useNavigation } from '../../navigation/Navigator';
import { CoinSprite } from '../../ui/game/Sprites';
import { Colors } from '../../ui/theme/colors';
import { useStyles } from '../../ui/theme/useTheme';
import { BallScreen } from '../ball/BallScreen';
import { PauseMenu } from './PauseMenu';

// Restarting a level mounts a fresh game, so the ball, coins and timer all start over.
export function GameScreen({ levelId }: { levelId: number }) {
  const [attempt, setAttempt] = useState(0);

  return <Game key={attempt} levelId={levelId} onRestart={() => setAttempt((a) => a + 1)} />;
}

// The ball game for one level, with the HUD (level name, pause button, coin counter) and the pause menu.
function Game({ levelId, onRestart }: { levelId: number; onRestart: () => void }) {
  const styles = useStyles(makeStyles);
  const navigation = useNavigation();
  const { bestTimes, recordTime } = useGameStore();
  const feedback = useFeedback();
  const [collected, setCollected] = useState(0);
  const [paused, setPaused] = useState(false);
  const bump = useSharedValue(1);
  const level = getLevel(levelId);

  // The hardware back button pauses the game, and resumes it when already paused.
  useBackInterceptor(
    useCallback(() => {
      setPaused((p) => !p);
      return true;
    }, []),
  );

  // Leaving the app pauses too, so the clock doesn't run while the player is away.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setPaused(true);
    });
    return () => sub.remove();
  }, []);

  // The counter gives a little pop each time a coin is picked up.
  useEffect(() => {
    if (collected > 0) bump.value = withSequence(withTiming(1.2, { duration: 90 }), withTiming(1, { duration: 160 }));
  }, [collected, bump]);
  const counterStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  if (!level) return null;

  const totalCoins = findTiles(level, 'C').length;

  const finish = (time: number, coins: number) => {
    feedback.goal();
    recordTime(levelId, time);
    navigation.replace({ name: 'summary', levelId, time, previous: bestTimes[levelId], coins, totalCoins });
  };

  return (
    <>
      <BallScreen
        level={level}
        paused={paused}
        onCoin={() => {
          feedback.coin();
          setCollected((c) => c + 1);
        }}
        onHit={feedback.hit}
        onCountdown={(step) => {
          if (step >= 0) feedback.tick();
        }}
        onGoal={finish}
      />
      <View style={styles.levelPill}>
        <View style={styles.levelDot} />
        <Text style={styles.levelText}>Level {levelId}</Text>
      </View>
      <Pressable style={({ pressed }) => [styles.pause, pressed && styles.pressed]} hitSlop={8} onPress={() => setPaused(true)}>
        <View style={styles.bar} />
        <View style={styles.bar} />
      </Pressable>
      {totalCoins > 0 && (
        <Animated.View style={[styles.counter, counterStyle]}>
          <CoinSprite size={18} />
          <Text style={styles.counterText}>
            {collected}/{totalCoins}
          </Text>
        </Animated.View>
      )}
      {paused && <PauseMenu onResume={() => setPaused(false)} onRestart={onRestart} onQuit={navigation.back} />}
    </>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    levelPill: {
      position: 'absolute',
      top: 22,
      left: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    levelDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
    levelText: { fontSize: 14, color: colors.text },
    pause: {
      position: 'absolute',
      top: 18,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    pressed: { opacity: 0.7 },
    bar: { width: 4, height: 15, borderRadius: 2, backgroundColor: colors.text },
    counter: {
      position: 'absolute',
      top: 68,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    counterText: { fontSize: 15, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  });
