import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import { levels } from './levels';

export type Settings = {
  sensitivity: number; // 0..1
  sound: boolean;
  haptics: boolean;
  darkMode: boolean;
  calibration: { x: number; y: number };
};

type GameStore = {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  bestTimes: Record<number, number>;
  recordTime: (levelId: number, time: number) => void;
  isCompleted: (levelId: number) => boolean;
  isUnlocked: (levelId: number) => boolean;
  currentLevelId: number;
};

const GameStoreContext = createContext<GameStore | null>(null);

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    sensitivity: 0.7,
    sound: true,
    haptics: true,
    darkMode: Appearance.getColorScheme() === 'dark',
    calibration: { x: 0, y: 0 },
  });
  const [bestTimes, setBestTimes] = useState<Record<number, number>>({});

  const store = useMemo<GameStore>(() => {
    const isCompleted = (id: number) => bestTimes[id] !== undefined;
    const isUnlocked = (id: number) => {
      const index = levels.findIndex((level) => level.id === id);
      return index <= 0 || isCompleted(levels[index - 1].id);
    };
    const current = levels.find((level) => !isCompleted(level.id)) ?? levels[levels.length - 1];

    return {
      settings,
      updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),
      bestTimes,
      recordTime: (id, time) =>
        setBestTimes((b) => (b[id] === undefined || time < b[id] ? { ...b, [id]: time } : b)),
      isCompleted,
      isUnlocked,
      currentLevelId: current.id,
    };
  }, [settings, bestTimes]);

  return <GameStoreContext.Provider value={store}>{children}</GameStoreContext.Provider>;
}

export function useGameStore() {
  const store = useContext(GameStoreContext);
  if (!store) throw new Error('useGameStore must be used inside GameStoreProvider');
  return store;
}

export function formatSeconds(ms: number, digits = 1) {
  return `${(ms / 1000).toFixed(digits)}s`;
}
