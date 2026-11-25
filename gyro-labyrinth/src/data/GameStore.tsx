import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import { levels } from './levels';

export type Settings = {
  sensitivity: number; // 0..1, see tiltGain
  deadZone: number; // 0..1, see deadZoneSize
  sound: boolean;
  haptics: boolean;
  darkMode: boolean;
  calibration: { x: number; y: number }; // the tilt that counts as "flat", see tilt.ts
};

type GameStore = {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  bestTimes: Record<number, number>;
  recordTime: (levelId: number, time: number) => void;
  isCompleted: (levelId: number) => boolean;
  currentLevelId: number;
};

const GameStoreContext = createContext<GameStore | null>(null);

// Settings and best times are kept on the phone between launches.
const STORAGE_KEY = 'gyro-labyrinth/save-v1';

type Saved = { settings?: Partial<Settings>; bestTimes?: Record<number, number> };

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    sensitivity: 0.5,
    deadZone: 0.25,
    sound: true,
    haptics: true,
    darkMode: Appearance.getColorScheme() === 'dark',
    calibration: { x: 0, y: 0 },
  });
  const [bestTimes, setBestTimes] = useState<Record<number, number>>({});
  const [loaded, setLoaded] = useState(false);

  // Load what was saved last time. Anything missing from an older save keeps its default.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: Saved = JSON.parse(raw);
        if (saved.settings) setSettings((s) => ({ ...s, ...saved.settings }));
        if (saved.bestTimes) setBestTimes(saved.bestTimes);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Save after every change, a moment late so dragging a slider doesn't write on every move.
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, bestTimes })).catch(() => {});
    }, 300);
    return () => clearTimeout(id);
  }, [loaded, settings, bestTimes]);

  const store = useMemo<GameStore>(() => {
    const isCompleted = (id: number) => bestTimes[id] !== undefined;
    const current = levels.find((level) => !isCompleted(level.id)) ?? levels[levels.length - 1];

    return {
      settings,
      updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),
      bestTimes,
      recordTime: (id, time) =>
        setBestTimes((b) => (b[id] === undefined || time < b[id] ? { ...b, [id]: time } : b)),
      isCompleted,
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
