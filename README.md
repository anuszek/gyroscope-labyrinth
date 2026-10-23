# Gyro Labyrinth

A ball rolls on a 2D floor. Tilt the phone to move it.

Built with Expo (SDK 58) and React Native Reanimated.

## Run

```sh
cd gyro-labyrinth
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Files

* `App.tsx` – shows the ball screen.
* `src/data/useTilt.ts` – reads the phone's tilt.
* `src/feature/ball/useBall.ts` – moves the ball.
* `src/feature/ball/BallScreen.tsx` – draws the floor and the ball.
* `src/ui/theme/colors.ts` – colors.
