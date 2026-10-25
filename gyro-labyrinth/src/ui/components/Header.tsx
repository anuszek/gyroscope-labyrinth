import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '../../navigation/Navigator';
import { Colors } from '../theme/colors';
import { useStyles } from '../theme/useTheme';
import { GlyphIcon } from './Icons';

type Props = {
  title: string;
  showSettings?: boolean;
  bordered?: boolean;
};

export function Header({ title, showSettings = true, bordered = false }: Props) {
  const styles = useStyles(makeStyles);
  const navigation = useNavigation();

  return (
    <View style={[styles.header, bordered && styles.bordered]}>
      <View style={styles.side}>
        {navigation.canGoBack && (
          <Pressable hitSlop={12} onPress={navigation.back}>
            <GlyphIcon glyph="←" size={22} />
          </Pressable>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.side, styles.right]}>
        {showSettings && navigation.route.name !== 'settings' && (
          <Pressable hitSlop={12} onPress={() => navigation.push({ name: 'settings' })}>
            <GlyphIcon glyph="⚙" size={22} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 14,
    },
    bordered: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    side: { width: 40 },
    right: { alignItems: 'flex-end' },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
    },
  });
