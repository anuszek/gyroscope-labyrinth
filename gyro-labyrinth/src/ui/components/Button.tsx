import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { Colors } from '../theme/colors';
import { useStyles } from '../theme/useTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'link';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, large = false, style }: Props) {
  const styles = useStyles(makeStyles);
  const textStyles = useStyles(makeTextStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], large && styles.large, pressed && styles.pressed, style]}
    >
      {icon}
      <Text style={[styles.label, textStyles[variant], large && styles.largeLabel]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 48,
      paddingHorizontal: 20,
      borderRadius: 24,
    },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },
    link: { backgroundColor: 'transparent' },
    large: {
      height: 56,
      borderRadius: 14,
      shadowColor: colors.primaryStrong,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    pressed: { opacity: 0.75 },
    label: { fontSize: 15, fontWeight: '500' },
    largeLabel: { fontSize: 21, fontWeight: '600' },
  });

const makeTextStyles = (colors: Colors) =>
  StyleSheet.create({
    primary: { color: colors.primaryText },
    secondary: { color: colors.secondaryText },
    outline: { color: colors.text },
    link: { color: colors.textMuted, fontSize: 14 },
  });
