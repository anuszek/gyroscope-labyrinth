import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatSeconds, useGameStore } from '../../data/GameStore';
import { Level, levels } from '../../data/levels';
import { useNavigation } from '../../navigation/Navigator';
import { Header } from '../../ui/components/Header';
import { CheckIcon, LockIcon, PlayIcon } from '../../ui/components/Icons';
import { TabBar } from '../../ui/components/TabBar';
import { Colors } from '../../ui/theme/colors';
import { useColors, useStyles } from '../../ui/theme/useTheme';

type Source = 'built-in' | 'custom';

const pad = (n: number) => String(n).padStart(2, '0');

export function LevelsScreen() {
  const styles = useStyles(makeStyles);
  const [source, setSource] = useState<Source>('built-in');
  const { isCompleted } = useGameStore();
  const completed = levels.filter((level) => isCompleted(level.id)).length;

  return (
    <View style={styles.screen}>
      <Header title="Levels" />

      <View style={styles.segmented}>
        {(['built-in', 'custom'] as const).map((s) => (
          <Pressable key={s} style={[styles.segment, source === s && styles.segmentActive]} onPress={() => setSource(s)}>
            <Text style={[styles.segmentLabel, source === s && styles.segmentLabelActive]}>
              {s === 'built-in' ? 'Built-in' : 'Custom'}
            </Text>
          </Pressable>
        ))}
      </View>

      {source === 'built-in' ? (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.listHeader}>
            <Text style={styles.caption}>STAGES</Text>
            <Text style={styles.count}>
              {completed} of {levels.length} Completed
            </Text>
          </View>
          {levels.map((level) => (
            <LevelCard key={level.id} level={level} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No custom levels yet</Text>
          <Text style={styles.emptyText}>Levels you build in the editor will show up here.</Text>
        </View>
      )}

      <TabBar />
    </View>
  );
}

function LevelCard({ level }: { level: Level }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const navigation = useNavigation();
  const { bestTimes, isCompleted, isUnlocked, currentLevelId } = useGameStore();
  const play = () => navigation.push({ name: 'game', levelId: level.id });

  if (!isUnlocked(level.id)) {
    return (
      <View style={[styles.card, styles.cardLocked]}>
        <Text style={[styles.number, styles.faint]}>{pad(level.id)}</Text>
        <View style={styles.info}>
          <Text style={[styles.name, styles.faint]}>{level.name}</Text>
          <Text style={[styles.sub, styles.faint]}>Complete Level {pad(level.id - 1)} to unlock</Text>
        </View>
        <LockIcon />
      </View>
    );
  }

  const current = level.id === currentLevelId && !isCompleted(level.id);
  const best = bestTimes[level.id];

  return (
    <Pressable onPress={play} style={({ pressed }) => [styles.card, current && styles.cardCurrent, pressed && styles.pressed]}>
      <Text style={[styles.number, current && styles.currentText]}>{pad(level.id)}</Text>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{level.name}</Text>
          {current && <Text style={styles.badge}>Current</Text>}
        </View>
        <Text style={styles.sub}>Best: {best === undefined ? '--.-' : formatSeconds(best)}</Text>
      </View>
      {current ? (
        <Pressable onPress={play} style={styles.playButton}>
          <Text style={styles.playLabel}>Play</Text>
          <PlayIcon color={colors.text} size={9} />
        </Pressable>
      ) : (
        <View style={styles.check}>
          <CheckIcon size={12} />
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    segmented: {
      flexDirection: 'row',
      alignSelf: 'center',
      padding: 4,
      borderRadius: 20,
      backgroundColor: colors.divider,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segment: { paddingHorizontal: 22, paddingVertical: 7, borderRadius: 16 },
    segmentActive: { backgroundColor: colors.surface },
    segmentLabel: { fontSize: 14, color: colors.textMuted },
    segmentLabelActive: { color: colors.text, fontWeight: '500' },
    list: { padding: 22, gap: 12 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    caption: { fontSize: 11, letterSpacing: 0.6, color: colors.textMuted },
    count: { fontSize: 11, color: colors.textMuted },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    cardCurrent: { backgroundColor: colors.current, borderColor: colors.currentBorder },
    cardLocked: { backgroundColor: colors.background, borderColor: colors.divider },
    pressed: { opacity: 0.8 },
    number: { fontSize: 19, color: colors.textMuted, width: 26 },
    currentText: { color: colors.currentText, fontWeight: '600' },
    faint: { color: colors.textFaint },
    info: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    name: { fontSize: 19, color: colors.text },
    badge: {
      fontSize: 11,
      color: colors.currentText,
      backgroundColor: colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      overflow: 'hidden',
    },
    sub: { fontSize: 11, color: colors.text, marginTop: 2 },
    check: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    playButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.primary,
    },
    playLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  });
