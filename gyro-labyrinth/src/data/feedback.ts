import * as Haptics from 'expo-haptics';

import { useGameStore } from './GameStore';

// Vibration cues for the game. They do nothing when haptics are switched off in Settings.
export function useFeedback() {
  const { haptics } = useGameStore().settings;

  return {
    tick: () => {
      if (haptics) void Haptics.selectionAsync();
    },
    coin: () => {
      if (haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    hit: () => {
      if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    goal: () => {
      if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  };
}
