import { StyleSheet, View } from 'react-native';

import { useGameStore } from '../../data/GameStore';
import { useNavigation } from '../../navigation/Navigator';
import { Button } from '../../ui/components/Button';
import { Header } from '../../ui/components/Header';
import { GridIcon, PlayCircleIcon, SlidersIcon } from '../../ui/components/Icons';
import { TabBar } from '../../ui/components/TabBar';
import { Colors } from '../../ui/theme/colors';
import { useColors, useStyles } from '../../ui/theme/useTheme';

export function MenuScreen() {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const navigation = useNavigation();
  const { currentLevelId } = useGameStore();

  return (
    <View style={styles.screen}>
      <Header title="Gyro Labyrinth" bordered />
      <View style={styles.content}>
        <Button
          large
          label="Play"
          icon={<PlayCircleIcon />}
          onPress={() => navigation.push({ name: 'game', levelId: currentLevelId })}
        />
        <Button
          variant="outline"
          label="Levels"
          icon={<GridIcon color={colors.currentText} size={15} />}
          onPress={() => navigation.openTab({ name: 'levels' })}
        />
        <Button
          variant="outline"
          label="Settings"
          icon={<SlidersIcon color={colors.currentText} size={15} />}
          onPress={() => navigation.openTab({ name: 'settings' })}
        />
      </View>
      <TabBar />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
      width: '42%',
      minWidth: 170,
      gap: 12,
    },
  });
