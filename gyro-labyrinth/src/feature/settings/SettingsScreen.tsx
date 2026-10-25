import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useGameStore } from '../../data/GameStore';
import { useTilt } from '../../data/useTilt';
import { Header } from '../../ui/components/Header';
import { GlyphIcon, IconBubble, TargetIcon } from '../../ui/components/Icons';
import { Slider } from '../../ui/components/Slider';
import { TabBar } from '../../ui/components/TabBar';
import { Colors } from '../../ui/theme/colors';
import { useColors, useStyles } from '../../ui/theme/useTheme';

export function SettingsScreen() {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const { settings, updateSettings } = useGameStore();
  const tilt = useTilt();
  const { x, y } = settings.calibration;
  const calibratedAngle = (Math.atan(Math.hypot(x, y)) * 180) / Math.PI;

  const setNeutral = () => {
    const { x, y } = tilt.value;
    updateSettings({ calibration: { x, y } });
  };

  return (
    <View style={styles.screen}>
      <Header title="Settings" bordered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MOTION & CONTROLS</Text>
          <Text style={styles.modeBadge}>{settings.sensitivity < 0.8 ? 'Calm Mode' : 'Fast Mode'}</Text>
        </View>

        <View style={styles.card}>
          <Row
            icon={<GlyphIcon glyph="⟲" color={colors.currentText} size={18} />}
            title="Gyroscope Sensitivity"
            subtitle="Response balance"
            right={<Text style={styles.percent}>{Math.round(settings.sensitivity * 100)}%</Text>}
          />
          <Slider value={settings.sensitivity} onChange={(sensitivity) => updateSettings({ sensitivity })} />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Slow</Text>
            <Text style={styles.sliderLabel}>Balanced</Text>
            <Text style={styles.sliderLabel}>Fast</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Row
            icon={<TargetIcon color={colors.textMuted} size={14} />}
            iconColor={colors.divider}
            title="Calibrate Tilt"
            subtitle="Rest on flat resting position"
            right={
              <Pressable style={({ pressed }) => [styles.neutralButton, pressed && styles.pressed]} onPress={setNeutral}>
                <GlyphIcon glyph="⊘" color={colors.infoText} size={14} />
                <Text style={styles.neutralLabel}>Set Neutral</Text>
              </Pressable>
            }
          />
        </View>

        <Text style={[styles.sectionTitle, styles.feedbackTitle]}>APPEARANCE</Text>
        <View style={[styles.card, styles.cardFlush]}>
          <View style={styles.flushRow}>
            <Row
              icon={<GlyphIcon glyph="☾" color={colors.currentText} size={16} />}
              title="Dark Mode"
              subtitle="Easier on the eyes in low light"
              right={<Toggle value={settings.darkMode} onChange={(darkMode) => updateSettings({ darkMode })} />}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.feedbackTitle]}>FEEDBACK</Text>
        <View style={[styles.card, styles.cardFlush]}>
          <View style={styles.flushRow}>
            <Row
              icon={<GlyphIcon glyph="♪" color={colors.primaryStrong} size={16} />}
              iconColor={colors.primarySoft}
              title="Sound"
              subtitle="Subtle ambient roll and impact echoes"
              right={<Toggle value={settings.sound} onChange={(sound) => updateSettings({ sound })} />}
            />
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.flushRow}>
            <Row
              icon={<GlyphIcon glyph="▯" color={colors.primaryStrong} size={16} />}
              iconColor={colors.primarySoft}
              title="Haptics / Vibration"
              subtitle="Soft tactile marble friction"
              right={<Toggle value={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />}
            />
          </View>
        </View>

        <View style={styles.status}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Sensor ready • Calibrated at {calibratedAngle.toFixed(1)}°</Text>
        </View>

        <Text style={styles.version}>Gyro Labyrinth v1.0</Text>
      </ScrollView>
      <TabBar />
    </View>
  );
}

type RowProps = {
  icon: ReactNode;
  iconColor?: string;
  title: string;
  subtitle: string;
  right: ReactNode;
};

function Row({ icon, iconColor, title, subtitle, right }: RowProps) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.row}>
      <IconBubble color={iconColor}>{icon}</IconBubble>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {right}
    </View>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  const colors = useColors();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.border}
    />
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 22, gap: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    sectionTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 0.8, color: colors.textMuted },
    feedbackTitle: { marginTop: 4, marginBottom: -6 },
    modeBadge: {
      fontSize: 11,
      color: colors.currentText,
      backgroundColor: colors.secondary,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    card: {
      padding: 18,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    cardFlush: { padding: 0 },
    flushRow: { paddingHorizontal: 18, paddingVertical: 14 },
    rowDivider: { height: 1, backgroundColor: colors.divider },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 19, color: colors.text },
    rowSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    percent: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryText,
      backgroundColor: colors.primary,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 12,
      overflow: 'hidden',
    },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
    sliderLabel: { fontSize: 11, color: colors.textMuted },
    neutralButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 22,
      backgroundColor: colors.info,
    },
    neutralLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
    pressed: { opacity: 0.7 },
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: colors.divider,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primaryStrong },
    statusText: { fontSize: 12, color: colors.text },
    version: { textAlign: 'center', fontSize: 12, letterSpacing: 0.5, color: colors.textMuted, marginTop: 40 },
  });
