import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { useFeedback } from '../../data/feedback';
import { useGameStore } from '../../data/GameStore';
import { findTiles, getLevel } from '../../data/levels';
import { useBackInterceptor, useNavigation } from '../../navigation/Navigator';
import { lightColors } from '../../ui/theme/colors';
import { BallScreen } from '../ball/BallScreen';
import { PauseMenu } from './PauseMenu';

// Restarting a level mounts a fresh game, so the ball, coins and timer all start over.
export function GameScreen({ levelId }: { levelId: number }) {
  const [attempt, setAttempt] = useState(0);

  return <Game key={attempt} levelId={levelId} onRestart={() => setAttempt((a) => a + 1)} />;
}

// The ball game for one level, plus a pause button, a coin counter and the pause menu.
function Game({ levelId, onRestart }: { levelId: number; onRestart: () => void }) {
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
    if (collected > 0) bump.value = withSequence(withTiming(1.35, { duration: 90 }), withTiming(1, { duration: 160 }));
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
      <Pressable style={styles.pause} hitSlop={12} onPress={() => setPaused(true)}>
        <View style={styles.bar} />
        <View style={styles.bar} />
      </Pressable>
      {totalCoins > 0 && (
        <Animated.View style={[styles.counter, counterStyle]}>
          <View style={styles.counterCoin} />
          <Text style={styles.counterText}>
            {collected}/{totalCoins}
          </Text>
        </Animated.View>
      )}
      {paused && (
        <PauseMenu
          onResume={() => setPaused(false)}
          onRestart={onRestart}
          onQuit={navigation.back}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pause: { position: 'absolute', top: 24, left: 20, flexDirection: 'row', gap: 5, paddingVertical: 2 },
  bar: { width: 5, height: 18, borderRadius: 2, backgroundColor: lightColors.text },
  counter: { position: 'absolute', top: 24, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  counterCoin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: lightColors.coin,
    borderWidth: 2,
    borderColor: lightColors.coinEdge,
  },
  counterText: { fontSize: 18, fontWeight: '600', color: lightColors.text, fontVariant: ['tabular-nums'] },
});
