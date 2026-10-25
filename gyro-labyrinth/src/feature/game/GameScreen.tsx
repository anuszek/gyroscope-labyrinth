import { Pressable, StyleSheet } from 'react-native';

import { useNavigation } from '../../navigation/Navigator';
import { GlyphIcon } from '../../ui/components/Icons';
import { lightColors } from '../../ui/theme/colors';
import { BallScreen } from '../ball/BallScreen';

// The original ball game, plus a back button to return to the menu.
export function GameScreen() {
  const navigation = useNavigation();

  return (
    <>
      <BallScreen />
      <Pressable style={styles.back} hitSlop={12} onPress={navigation.back}>
        <GlyphIcon glyph="←" size={22} color={lightColors.text} />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 24, left: 20 },
});
