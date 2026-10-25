import { useMemo } from 'react';

import { useGameStore } from '../../data/GameStore';
import { Colors, darkColors, lightColors } from './colors';

export function useColors(): Colors {
  return useGameStore().settings.darkMode ? darkColors : lightColors;
}

// `make` should be defined at module level so the styles are only rebuilt when the theme changes.
export function useStyles<T>(make: (colors: Colors) => T): T {
  const colors = useColors();
  return useMemo(() => make(colors), [colors, make]);
}
