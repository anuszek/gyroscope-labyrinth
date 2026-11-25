import { ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { useGameStore } from '../../data/GameStore';
import { deadZoneSize, MAX_DEAD_ZONE_DEGREES, steering, Tilt, tiltDegrees, tiltGain } from '../../data/tilt';
import { useTilt } from '../../data/useTilt';
import { Header } from '../../ui/components/Header';
import { GlyphIcon, IconBubble, TargetIcon } from '../../ui/components/Icons';
import { Slider } from '../../ui/components/Slider';
import { TabBar } from '../../ui/components/TabBar';
import { Colors } from '../../ui/theme/colors';
import { useColors, useStyles } from '../../ui/theme/useTheme';
import { CalibrationModal } from './CalibrationModal';

const PAD = 148; // size of the live tilt preview
const DOT = 18;
const PAD_RANGE = Math.sin((25 * Math.PI) / 180); // the tilt at the edge of the preview, about 25 degrees
const FULL_PUSH = 0.6; // the push that fills the push bar

export function SettingsScreen() {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const { settings, updateSettings } = useGameStore();
  const { tilt, gravity } = useTilt();
  const { sensitivity, deadZone, calibration } = settings;
  const [reading, setReading] = useState({ degrees: 0, sensor: true });
  const [calibrating, setCalibrating] = useState(false);

  // What the sensor says right now, a few times a second. A phone with no motion sensor (a simulator, or
  // the web) reports all zeros, while a real one always reports about 9.8 m/s^2 of gravity.
  useEffect(() => {
    const id = setInterval(() => {
      const g = gravity.value;
      const t = tilt.value;
      const next = {
        degrees: Math.round(tiltDegrees({ x: t.x - calibration.x, y: t.y - calibration.y }) * 10) / 10,
        sensor: Math.hypot(g.x, g.y, g.z) > 1,
      };
      setReading((prev) => (prev.degrees === next.degrees && prev.sensor === next.sensor ? prev : next));
    }, 120);
    return () => clearInterval(id);
  }, [tilt, gravity, calibration]);

  const gain = tiltGain(sensitivity);
  const zoneDegrees = deadZone * MAX_DEAD_ZONE_DEGREES;
  const calibratedAngle = tiltDegrees(calibration);
  const isCalibrated = calibration.x !== 0 || calibration.y !== 0;

  // What the calibration popup reads: the raw tilt, and whether there is a sensor at all.
  const readSensor = () => {
    const g = gravity.value;
    return { tilt: { x: tilt.value.x, y: tilt.value.y }, sensor: Math.hypot(g.x, g.y, g.z) > 1 };
  };

  return (
    <View style={styles.screen}>
      <Header title="Settings" bordered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MOTION & CONTROLS</Text>
          <Text style={styles.modeBadge}>{gain < 0.8 ? 'Calm Mode' : gain > 1.5 ? 'Fast Mode' : 'Balanced'}</Text>
        </View>

        <View style={styles.card}>
          <Row
            icon={<GlyphIcon glyph="⟲" color={colors.currentText} size={18} />}
            title="Gyroscope Sensitivity"
            subtitle="How hard a tilt pushes the ball"
            right={<Text style={styles.percent}>×{gain.toFixed(1)}</Text>}
          />
          <Slider value={sensitivity} onChange={(value) => updateSettings({ sensitivity: value })} />
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
            title="Dead Zone"
            subtitle="Tilts smaller than this are ignored"
            right={<Text style={styles.percent}>{zoneDegrees.toFixed(1)}°</Text>}
          />
          <Slider value={deadZone} onChange={(value) => updateSettings({ deadZone: value })} />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Off</Text>
            <Text style={styles.sliderLabel}>{MAX_DEAD_ZONE_DEGREES}°</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Row
            icon={<TargetIcon color={colors.textMuted} size={14} />}
            iconColor={colors.divider}
            title="Calibrate Tilt"
            subtitle="Lay the phone flat to set the neutral position"
            right={
              <Pressable style={({ pressed }) => [styles.neutralButton, pressed && styles.pressed]} onPress={() => setCalibrating(true)}>
                <GlyphIcon glyph="⊘" color={colors.infoText} size={14} />
                <Text style={styles.neutralLabel}>Set Neutral</Text>
              </Pressable>
            }
          />
          <View style={styles.calibrationRow}>
            <Text style={styles.calibrationText}>
              {isCalibrated ? `Neutral is ${calibratedAngle.toFixed(1)}° from flat` : 'Neutral is flat on a table'}
            </Text>
            {isCalibrated && (
              <Pressable hitSlop={8} onPress={() => updateSettings({ calibration: { x: 0, y: 0 } })}>
                <Text style={styles.resetLabel}>Reset</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.previewTitle}>Live preview</Text>
          <TiltPad tilt={tilt} calibration={calibration} deadZone={deadZone} sensitivity={sensitivity} />
          <Text style={styles.previewText}>
            {reading.sensor ? `${reading.degrees.toFixed(1)}° from neutral` : 'No motion sensor reading'}
          </Text>
          <Text style={styles.previewHint}>
            The dot follows your tilt. It stays in the middle inside the dashed ring (the dead zone). The bar shows how
            hard the ball is pushed.
          </Text>
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
          <View style={[styles.statusDot, !reading.sensor && styles.statusDotOff]} />
          <Text style={styles.statusText}>
            {reading.sensor
              ? `Sensor ready • Neutral at ${calibratedAngle.toFixed(1)}°`
              : 'No motion sensor found. Steering needs a real phone.'}
          </Text>
        </View>

        <Text style={styles.version}>Gyro Labyrinth v1.0</Text>
      </ScrollView>
      <TabBar />
      <CalibrationModal
        visible={calibrating}
        read={readSensor}
        onCalibrated={(neutral) => updateSettings({ calibration: neutral })}
        onClose={() => setCalibrating(false)}
      />
    </View>
  );
}

// A round pad with a dot that follows the tilt, and a bar for how hard the ball would be pushed.
// It uses the same `steering` the game does, so it shows exactly what the settings do.
function TiltPad({
  tilt,
  calibration,
  deadZone,
  sensitivity,
}: {
  tilt: SharedValue<Tilt>;
  calibration: Tilt;
  deadZone: number;
  sensitivity: number;
}) {
  const styles = useStyles(makeStyles);
  const travel = (PAD - DOT) / 2;
  const zoneSize = Math.min(1, deadZoneSize(deadZone) / PAD_RANGE) * (PAD - DOT);

  const dotStyle = useAnimatedStyle(() => {
    let x = (tilt.value.x - calibration.x) / PAD_RANGE;
    let y = (tilt.value.y - calibration.y) / PAD_RANGE;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    return { transform: [{ translateX: x * travel }, { translateY: y * travel }] };
  });
  const barStyle = useAnimatedStyle(() => {
    const push = steering(tilt.value, calibration, deadZone, sensitivity);
    return { width: `${Math.min(1, Math.hypot(push.x, push.y) / FULL_PUSH) * 100}%` };
  });

  return (
    <View style={styles.previewWrap}>
      <View style={styles.pad}>
        <View style={styles.crossV} />
        <View style={styles.crossH} />
        <View style={[styles.zone, { width: zoneSize, height: zoneSize, borderRadius: zoneSize / 2 }]} />
        <Animated.View style={[styles.dot, dotStyle]} />
      </View>
      <View style={styles.pushRow}>
        <Text style={styles.pushLabel}>Push</Text>
        <View style={styles.pushTrack}>
          <Animated.View style={[styles.pushFill, barStyle]} />
        </View>
      </View>
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
    statusDotOff: { backgroundColor: colors.textFaint },
    calibrationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
    calibrationText: { fontSize: 12, color: colors.textMuted },
    resetLabel: { fontSize: 13, fontWeight: '600', color: colors.currentText },
    previewTitle: { fontSize: 19, color: colors.text, marginBottom: 14 },
    previewWrap: { alignItems: 'center', gap: 14 },
    pad: {
      width: PAD,
      height: PAD,
      borderRadius: PAD / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    crossV: { position: 'absolute', width: 1, height: PAD - 24, backgroundColor: colors.border },
    crossH: { position: 'absolute', height: 1, width: PAD - 24, backgroundColor: colors.border },
    zone: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textFaint },
    dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.primaryStrong },
    pushRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10 },
    pushLabel: { width: 36, fontSize: 12, color: colors.textMuted },
    pushTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.divider },
    pushFill: { height: 6, borderRadius: 3, backgroundColor: colors.primaryStrong },
    previewText: { textAlign: 'center', fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 12 },
    previewHint: { textAlign: 'center', fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: 6 },
    statusText: { fontSize: 12, color: colors.text },
    version: { textAlign: 'center', fontSize: 12, letterSpacing: 0.5, color: colors.textMuted, marginTop: 40 },
  });
