import { StatusBar } from 'expo-status-bar';

import { GameStoreProvider } from './src/data/GameStore';
import { GameScreen } from './src/feature/game/GameScreen';
import { LevelsScreen } from './src/feature/levels/LevelsScreen';
import { MenuScreen } from './src/feature/menu/MenuScreen';
import { SettingsScreen } from './src/feature/settings/SettingsScreen';
import { SummaryScreen } from './src/feature/summary/SummaryScreen';
import { NavigationProvider, useNavigation } from './src/navigation/Navigator';

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
      return <GameScreen />;
    case 'summary':
      return <SummaryScreen levelId={route.levelId} time={route.time} previous={route.previous} />;
  }
}

export default function App() {
  return (
    <GameStoreProvider>
      <NavigationProvider>
        <CurrentScreen />
        <StatusBar hidden />
      </NavigationProvider>
    </GameStoreProvider>
  );
}
