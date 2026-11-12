import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { GameStoreProvider } from './src/data/GameStore';
import { GameScreen } from './src/feature/game/GameScreen';
import { LevelsScreen } from './src/feature/levels/LevelsScreen';
import { MenuScreen } from './src/feature/menu/MenuScreen';
import { SettingsScreen } from './src/feature/settings/SettingsScreen';
import { SummaryScreen } from './src/feature/summary/SummaryScreen';
import { NavigationProvider, useNavigation } from './src/navigation/Navigator';
import { useColors } from './src/ui/theme/useTheme';

function CurrentScreen() {
  const { route } = useNavigation();

  switch (route.name) {
    case 'menu':
      return <MenuScreen />;
    case 'levels':
      return <LevelsScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'game':
      return <GameScreen levelId={route.levelId} />;
    case 'summary':
      return (
        <SummaryScreen
          levelId={route.levelId}
          time={route.time}
          previous={route.previous}
          coins={route.coins}
          totalCoins={route.totalCoins}
        />
      );
  }
}

// Each screen fades in over the plain app background when the route changes.
function Screens() {
  const colors = useColors();
  const { route } = useNavigation();
  const key = 'levelId' in route ? `${route.name}-${route.levelId}` : route.name;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View key={key} entering={FadeIn.duration(250)} style={{ flex: 1 }}>
        <CurrentScreen />
      </Animated.View>
    </View>
  );
}

export default function App() {
  return (
    <GameStoreProvider>
      <NavigationProvider>
        <Screens />
        <StatusBar hidden />
      </NavigationProvider>
    </GameStoreProvider>
  );
}
