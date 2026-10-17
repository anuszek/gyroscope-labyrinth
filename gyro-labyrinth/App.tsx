import { StatusBar } from 'expo-status-bar';

import Game from './app/Game';

export default function App() {
  return (
    <>
      <Game />
      <StatusBar hidden />
    </>
  );
}
