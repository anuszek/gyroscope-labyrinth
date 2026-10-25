import { StyleSheet, Text, View } from 'react-native';

import { formatSeconds } from '../../data/GameStore';
import { getLevel, levels } from '../../data/levels';
import { useNavigation } from '../../navigation/Navigator';
import { Button } from '../../ui/components/Button';
import { Header } from '../../ui/components/Header';
import { CheckIcon } from '../../ui/components/Icons';
import { Colors } from '../../ui/theme/colors';
import { useColors, useStyles } from '../../ui/theme/useTheme';

type Props = { levelId: number; time: number; previous?: number };

export function SummaryScreen({ levelId, time, previous }: Props) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const navigation = useNavigation();
  const level = getLevel(levelId);
  const next = levels[levels.findIndex((l) => l.id === levelId) + 1];
  const newBest = previous === undefined || time < previous;

  return (
    <View style={styles.screen}>
      <Header title="Gyro Labyrinth" />
      <View style={styles.content}>
        <Text style={styles.stage}>STAGE {String(levelId).padStart(2, '0')}</Text>
        <Text style={styles.title}>Level Complete!</Text>
        {level && <Text style={styles.levelName}>{level.name}</Text>}

        <View style={styles.card}>
          <View style={styles.checkBubble}>
            <CheckIcon color={colors.currentText} size={16} />
          </View>
          {newBest && <Text style={styles.badge}>New Best!</Text>}
          <View style={styles.timeRow}>
            <Text style={styles.time}>{(time / 1000).toFixed(2)}</Text>
            <Text style={styles.unit}>s</Text>
          </View>
          <Text style={styles.caption}>Completion Time</Text>
          <View style={styles.divider} />
          <Text style={styles.previous}>
            Previous: <Text style={styles.previousValue}>{previous === undefined ? '--.-' : formatSeconds(previous, 2)}</Text>
          </Text>
        </View>

        {next && (
          <Button label="Next Level" onPress={() => navigation.replace({ name: 'game', levelId: next.id })} />
        )}
        <Button variant="secondary" label="Play Again" onPress={() => navigation.replace({ name: 'game', levelId })} />
        <Button variant="link" label="All Levels" onPress={() => navigation.openTab({ name: 'levels' })} />
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 24, gap: 10 },
    stage: { textAlign: 'center', fontSize: 13, letterSpacing: 0.8, color: colors.textMuted },
    title: { textAlign: 'center', fontSize: 30, fontWeight: '600', color: colors.text },
    levelName: { textAlign: 'center', fontSize: 14, color: colors.textMuted, marginTop: -4 },
    card: {
      alignItems: 'center',
      marginVertical: 12,
      paddingTop: 24,
      paddingBottom: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    checkBubble: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.current,
      marginBottom: 16,
    },
    badge: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.primaryText,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    timeRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 },
    time: { fontSize: 56, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
    unit: { fontSize: 20, color: colors.textMuted, marginBottom: 10, marginLeft: 3 },
    caption: { fontSize: 12, color: colors.text },
    divider: { alignSelf: 'stretch', height: 1, backgroundColor: colors.divider, marginVertical: 14 },
    previous: { fontSize: 14, color: colors.textMuted },
    previousValue: { color: colors.text, fontWeight: '600' },
  });
