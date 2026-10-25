import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';

export type Route =
  | { name: 'menu' }
  | { name: 'levels' }
  | { name: 'settings' }
  | { name: 'game'; levelId: number }
  | { name: 'summary'; levelId: number; time: number; previous?: number };

type Navigation = {
  route: Route;
  canGoBack: boolean;
  push: (route: Route) => void;
  replace: (route: Route) => void;
  back: () => void;
  // Opens a bottom tab: keeps the menu as the root, drops everything else.
  openTab: (route: Route) => void;
};

const NavigationContext = createContext<Navigation | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'menu' }]);

  const navigation = useMemo<Navigation>(
    () => ({
      route: stack[stack.length - 1],
      canGoBack: stack.length > 1,
      push: (route) => setStack((s) => [...s, route]),
      replace: (route) => setStack((s) => [...s.slice(0, -1), route]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      openTab: (route) => setStack([{ name: 'menu' }, route]),
    }),
    [stack],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.canGoBack) return false;
      navigation.back();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  return <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const navigation = useContext(NavigationContext);
  if (!navigation) throw new Error('useNavigation must be used inside NavigationProvider');
  return navigation;
}
