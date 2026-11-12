import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  const [collected, setCollected] = useState<number[]>([]);
  const level = getLevel(levelId);

  if (!level) return null;

  const totalCoins = findTiles(level, 'C').length;

  const finish = (time: number, coins: number) => {
    recordTime(levelId, time);
    navigation.replace({ name: 'summary', levelId, time, previous: bestTimes[levelId], coins, totalCoins });
  };

  return (
    <>
      <BallScreen
        level={level}
        collected={collected}
        onCoin={(index) => setCollected((c) => [...c, index])}
        onGoal={finish}
      />
      <Pressable style={styles.back} hitSlop={12} onPress={navigation.back}>
        <GlyphIcon glyph="←" size={22} color={lightColors.text} />
      </Pressable>
      {totalCoins > 0 && (
        <View style={styles.counter}>
          <View style={styles.counterCoin} />
          <Text style={styles.counterText}>
            {collected.length}/{totalCoins}
          </Text>
        </View>
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
