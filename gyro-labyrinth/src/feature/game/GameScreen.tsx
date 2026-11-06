import { Pressable, StyleSheet } from 'react-native';

import { useGameStore } from '../../data/GameStore';
import { getLevel } from '../../data/levels';
import { useNavigation } from '../../navigation/Navigator';
import { GlyphIcon } from '../../ui/components/Icons';
import { lightColors } from '../../ui/theme/colors';
import { BallScreen } from '../ball/BallScreen';

// The ball game for one level, plus a back button to return to the menu.
export function GameScreen({ levelId }: { levelId: number }) {
  const navigation = useNavigation();
  const { bestTimes, recordTime } = useGameStore();
  const level = getLevel(levelId);

  if (!level) return null;

  const finish = (time: number) => {
    recordTime(levelId, time);
    navigation.replace({ name: 'summary', levelId, time, previous: bestTimes[levelId] });
  };

  return (
    <>
      <BallScreen level={level} onGoal={finish} />
      <Pressable style={styles.back} hitSlop={12} onPress={navigation.back}>
        <GlyphIcon glyph="←" size={22} color={lightColors.text} />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 24, left: 20 },
});
