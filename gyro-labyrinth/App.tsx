import { StatusBar } from 'expo-status-bar';

import { BallScreen } from './src/feature/ball/BallScreen';

export default function App() {
  return (
    <>
      <BallScreen />
      <StatusBar hidden />
    </>
  );
}
