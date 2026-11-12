import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { useFeedback } from '../../data/feedback';
import { useGameStore } from '../../data/GameStore';
import { findTiles, getLevel } from '../../data/levels';
import { useNavigation } from '../../navigation/Navigator';
import { GlyphIcon } from '../../ui/components/Icons';
import { lightColors } from '../../ui/theme/colors';
import { BallScreen } from '../ball/BallScreen';

// The ball game for one level, plus a back button to return to the menu and a coin counter.
export function GameScreen({ levelId }: { levelId: number }) {
  const navigation = useNavigation();
  const { bestTimes, recordTime } = useGameStore();
  const feedback = useFeedback();
  const [collected, setCollected] = useState(0);
  const bump = useSharedValue(1);
  const level = getLevel(levelId);

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
      <Pressable style={styles.back} hitSlop={12} onPress={navigation.back}>
        <GlyphIcon glyph="←" size={22} color={lightColors.text} />
      </Pressable>
      {totalCoins > 0 && (
        <Animated.View style={[styles.counter, counterStyle]}>
          <Animated.View style={styles.counterCoin} />
          <Text style={styles.counterText}>
            {collected}/{totalCoins}
          </Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 24, left: 20 },
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
