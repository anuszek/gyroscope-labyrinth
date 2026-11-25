import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Assessment, assess, FLAT_LIMIT_DEGREES, Sample } from '../../data/calibration';
import { useFeedback } from '../../data/feedback';
import { Tilt, tiltDegrees } from '../../data/tilt';
import { Button } from '../../ui/components/Button';
import { CheckIcon } from '../../ui/components/Icons';
import { Colors } from '../../ui/theme/colors';
import { useColors, useStyles } from '../../ui/theme/useTheme';

const RING = 176; // size of the progress ring
const RING_STROKE = 8;
const LEVEL = 128; // size of the bubble level inside the ring
const DOT = 18;
const LEVEL_RANGE = Math.sin((20 * Math.PI) / 180); // the tilt at the edge of the bubble level, 20 degrees
const POLL_MS = 50;
const CLOSE_DELAY_MS = 1100; // how long "Calibrated" stays up before the popup closes

type Reading = { tilt: Tilt; sensor: boolean };

type Props = {
  visible: boolean;
  // The phone's raw tilt right now, and whether it has a motion sensor at all.
  read: () => Reading;
  onCalibrated: (neutral: Tilt) => void;
  onClose: () => void;
};

// Asks the player to lay the phone flat. A bubble level shows how level the phone is, and a ring fills up while it
// stays flat and still. When the ring is full the average tilt over that time becomes the new neutral.
export function CalibrationModal({ visible, read, onCalibrated, onClose }: Props) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const feedback = useFeedback();

  // The timer below is set up once per opening, so it reaches the latest props through a ref.
  const latest = useRef({ read, onCalibrated, onClose, feedback });
  latest.current = { read, onCalibrated, onClose, feedback };

  const samples = useRef<Sample[]>([]);
  const finished = useRef(false);
  const [view, setView] = useState<{ tilt: Tilt; sensor: boolean; assessment: Assessment | null }>({
    tilt: { x: 0, y: 0 },
    sensor: true,
    assessment: null,
  });
  const [neutral, setNeutral] = useState<Tilt | null>(null);

  // Takes the neutral, shows "Calibrated" for a moment, then closes.
  const finish = (value: Tilt) => {
    if (finished.current) return;
    finished.current = true;
    setNeutral(value);
    latest.current.onCalibrated(value);
    latest.current.feedback.goal();
  };

  useEffect(() => {
    if (!visible) return;
    samples.current = [];
    finished.current = false;
    setNeutral(null);
    setView({ tilt: { x: 0, y: 0 }, sensor: true, assessment: null });

    const poll = setInterval(() => {
      if (finished.current) return;
      const { tilt, sensor } = latest.current.read();
      if (!sensor) {
        setView({ tilt, sensor: false, assessment: null });
        return;
      }

      samples.current.push({ x: tilt.x, y: tilt.y, time: Date.now() });
      const assessment = assess(samples.current);
      if (assessment.restart) samples.current = samples.current.slice(-1);
      setView({ tilt, sensor: true, assessment });
      if (assessment.progress >= 1) finish(assessment.mean);
    }, POLL_MS);

    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Once calibrated, the popup closes by itself.
  useEffect(() => {
    if (!neutral) return;
    const id = setTimeout(() => latest.current.onClose(), CLOSE_DELAY_MS);
    return () => clearTimeout(id);
  }, [neutral]);

  const { assessment, sensor } = view;
  const flat = assessment !== null && assessment.status !== 'tilted';
  const holding = assessment !== null && assessment.status === 'hold' && assessment.progress > 0;
  const progress = assessment?.progress ?? 0;

  let headline = 'Lay your phone flat';
  let hint = 'Put it face up on a table and let go.';
  if (!sensor) {
    headline = 'No motion sensor';
    hint = 'Calibration needs a real phone. Simulators and browsers have no gyroscope.';
  } else if (assessment?.status === 'tilted') {
    headline = 'Lay your phone flat';
    hint = `It is tilted by ${assessment.degrees.toFixed(0)}°. Put it face up on a table.`;
  } else if (assessment?.status === 'moving') {
    headline = 'Hold still';
    hint = 'The phone is moving. Rest it on a table and let go.';
  } else if (holding) {
    headline = 'Hold still…';
    hint = 'Reading the sensor.';
  }

  const radius = (RING - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const levelTravel = (LEVEL - DOT) / 2;
  const flatZone = (Math.sin((FLAT_LIMIT_DEGREES * Math.PI) / 180) / LEVEL_RANGE) * (LEVEL - DOT);
  let dotX = view.tilt.x / LEVEL_RANGE;
  let dotY = view.tilt.y / LEVEL_RANGE;
  const dotLength = Math.hypot(dotX, dotY);
  if (dotLength > 1) {
    dotX /= dotLength;
    dotY /= dotLength;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Calibrate tilt</Text>

          {neutral ? (
            <Animated.View entering={ZoomIn.duration(220)} style={styles.doneWrap}>
              <View style={styles.doneBubble}>
                <CheckIcon color={colors.primaryText} size={30} />
              </View>
              <Text style={styles.headline}>Calibrated</Text>
              <Text style={styles.hint}>Neutral is {tiltDegrees(neutral).toFixed(1)}° from flat.</Text>
            </Animated.View>
          ) : (
            <>
              <View style={styles.ringWrap}>
                <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
                  <Circle cx={RING / 2} cy={RING / 2} r={radius} stroke={colors.divider} strokeWidth={RING_STROKE} fill="none" />
                  <Circle
                    cx={RING / 2}
                    cy={RING / 2}
                    r={radius}
                    stroke={colors.primaryStrong}
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${circumference * progress} ${circumference}`}
                    rotation={-90}
                    origin={`${RING / 2}, ${RING / 2}`}
                  />
                </Svg>
                <View style={styles.level}>
                  <View style={styles.crossV} />
                  <View style={styles.crossH} />
                  <View
                    style={[
                      styles.flatZone,
                      { width: flatZone, height: flatZone, borderRadius: flatZone / 2 },
                      flat && sensor && styles.flatZoneOn,
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      { transform: [{ translateX: dotX * levelTravel }, { translateY: dotY * levelTravel }] },
                      flat && sensor && styles.dotOn,
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.headline}>{headline}</Text>
              <Text style={styles.hint}>{hint}</Text>
              <View style={styles.actions}>
                {sensor && (
                  <Button
                    variant="secondary"
                    label="Use current angle instead"
                    onPress={() => finish(latest.current.read().tilt)}
                  />
                )}
                <Button variant="link" label="Cancel" onPress={onClose} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      backgroundColor: colors.overlay,
    },
    card: {
      alignSelf: 'stretch',
      maxWidth: 380,
      alignItems: 'center',
      gap: 8,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: { fontSize: 13, fontWeight: '600', letterSpacing: 0.8, color: colors.textMuted, marginBottom: 8 },
    ringWrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    level: {
      width: LEVEL,
      height: LEVEL,
      borderRadius: LEVEL / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    crossV: { position: 'absolute', width: 1, height: LEVEL - 24, backgroundColor: colors.border },
    crossH: { position: 'absolute', height: 1, width: LEVEL - 24, backgroundColor: colors.border },
    flatZone: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textFaint },
    flatZoneOn: { borderColor: colors.primaryStrong },
    dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.textFaint },
    dotOn: { backgroundColor: colors.primaryStrong },
    headline: { fontSize: 22, fontWeight: '600', color: colors.text, textAlign: 'center' },
    hint: { fontSize: 13, lineHeight: 18, color: colors.textMuted, textAlign: 'center', minHeight: 36 },
    actions: { alignSelf: 'stretch', gap: 6, marginTop: 10 },
    doneWrap: { alignItems: 'center', gap: 8, paddingVertical: 18 },
    doneBubble: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginBottom: 8,
    },
  });
