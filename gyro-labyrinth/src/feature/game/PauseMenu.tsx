import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { Button } from '../../ui/components/Button';
import { Colors } from '../../ui/theme/colors';
import { useStyles } from '../../ui/theme/useTheme';

type Props = { onResume: () => void; onRestart: () => void; onQuit: () => void };

// Dims the board and offers the ways out of a paused level.
export function PauseMenu({ onResume, onRestart, onQuit }: Props) {
  const styles = useStyles(makeStyles);

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
      <Animated.View entering={ZoomIn.duration(220)} style={styles.card}>
        <Text style={styles.title}>Paused</Text>
        <Button label="Resume" onPress={onResume} />
        <Button variant="secondary" label="Restart" onPress={onRestart} />
        <Button variant="link" label="Quit to levels" onPress={onQuit} />
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      backgroundColor: colors.overlay,
    },
    card: {
      alignSelf: 'stretch',
      maxWidth: 360,
      gap: 10,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: {
      textAlign: 'center',
      fontSize: 26,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
  });
