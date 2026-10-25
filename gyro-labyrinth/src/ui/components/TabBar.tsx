import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '../../navigation/Navigator';
import { Colors } from '../theme/colors';
import { useColors, useStyles } from '../theme/useTheme';
import { GridIcon, SlidersIcon } from './Icons';

const tabs = [
  { name: 'levels', label: 'Levels', Icon: GridIcon },
  { name: 'settings', label: 'Settings', Icon: SlidersIcon },
] as const;

export function TabBar() {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const navigation = useNavigation();

  return (
    <View style={styles.bar}>
      {tabs.map(({ name, label, Icon }) => {
        const active = navigation.route.name === name;
        const color = active ? colors.primaryText : colors.textMuted;
        return (
          <Pressable key={name} style={styles.tab} onPress={() => !active && navigation.openTab({ name })}>
            <View style={[styles.pill, active && styles.pillActive]}>
              <Icon color={color} size={16} />
              <Text style={[styles.label, { color }]}>{label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 10,
      paddingBottom: 18,
    },
    tab: { flex: 1, alignItems: 'center' },
    pill: {
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 18,
      paddingVertical: 6,
      borderRadius: 20,
    },
    pillActive: { backgroundColor: colors.primary },
    label: { fontSize: 12, fontWeight: '500' },
  });
