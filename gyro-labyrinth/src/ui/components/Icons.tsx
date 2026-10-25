import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '../theme/useTheme';

// Simple icons drawn with Views, so the app needs no icon font.

type IconProps = { color?: string; size?: number };

export function GridIcon({ color: colorProp, size = 18 }: IconProps) {
  const colors = useColors();
  const color = colorProp ?? colors.text;
  const cell = size * 0.42;
  const box = { width: cell, height: cell, borderWidth: 1.6, borderColor: color, borderRadius: 2 };
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }}>
      <View style={box} />
      <View style={box} />
      <View style={box} />
      <View style={box} />
    </View>
  );
}

export function SlidersIcon({ color: colorProp, size = 18 }: IconProps) {
  const colors = useColors();
  const color = colorProp ?? colors.text;
  const knobs = [0.65, 0.25, 0.55];
  return (
    <View style={{ width: size, height: size, justifyContent: 'space-around' }}>
      {knobs.map((at, i) => (
        <View key={i} style={{ height: 2, backgroundColor: color, borderRadius: 1 }}>
          <View
            style={{
              position: 'absolute',
              left: at * size - 2,
              top: -3,
              width: 3,
              height: 8,
              borderRadius: 1.5,
              backgroundColor: color,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export function PlayIcon({ color: colorProp, size = 14 }: IconProps) {
  const colors = useColors();
  const color = colorProp ?? colors.text;
  return (
    <View
      style={{
        width: 0,
        height: 0,
        marginLeft: size * 0.15,
        borderTopWidth: size / 2,
        borderBottomWidth: size / 2,
        borderLeftWidth: size * 0.85,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
      }}
    />
  );
}

export function PlayCircleIcon({ color: colorProp, size = 22 }: IconProps) {
  const colors = useColors();
  const color = colorProp ?? colors.primaryText;
  return (
    <View style={[styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <PlayIcon color={colors.primary} size={size * 0.42} />
    </View>
  );
}

export function PauseIcon({ color: colorProp, size = 14 }: IconProps) {
  const colors = useColors();
  const color = colorProp ?? colors.text;
  const bar = { width: size * 0.3, height: size, borderWidth: 1.6, borderColor: color, borderRadius: 2 };
  return (
    <View style={{ flexDirection: 'row', gap: size * 0.2 }}>
      <View style={bar} />
      <View style={bar} />
    </View>
  );
}

export function CheckIcon({ color: colorProp, size = 14 }: IconProps) {
  const colors = useColors();
  const color = colorProp ?? colors.primaryStrong;
  return (
    <View
      style={{
        width: size * 0.45,
        height: size * 0.8,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        marginTop: -size * 0.15,
      }}
    />
  );
}

export function LockIcon({ color: colorProp, size = 16 }: IconProps) {
  const colors = useColors();
  const color = colorProp ?? colors.textFaint;
  return (
    <View style={{ width: size * 0.75, alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.4,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: size * 0.25,
          borderTopRightRadius: size * 0.25,
        }}
      />
      <View style={[styles.center, { width: size * 0.75, height: size * 0.5, borderWidth: 1.6, borderColor: color, borderRadius: 2 }]}>
        <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function TargetIcon({ color: colorProp, size = 16 }: IconProps) {
  const colors = useColors();
  const color = colorProp ?? colors.text;
  return (
    <View style={[styles.center, { width: size, height: size, borderRadius: size / 2, borderWidth: 1.6, borderColor: color }]}>
      <View style={{ width: size * 0.3, height: size * 0.3, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

export function GlyphIcon({ glyph, color: colorProp, size = 18 }: IconProps & { glyph: string }) {
  const colors = useColors();
  const color = colorProp ?? colors.text;
  // U+FE0E asks for the text (non-emoji) form of the glyph.
  return <Text style={{ color, fontSize: size, lineHeight: size * 1.2 }}>{`${glyph}︎`}</Text>;
}

export function IconBubble({ children, color: colorProp, size = 34 }: { children: ReactNode; color?: string; size?: number }) {
  const colors = useColors();
  const color = colorProp ?? colors.secondary;
  return <View style={[styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>{children}</View>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
