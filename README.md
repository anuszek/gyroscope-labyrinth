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
#### Main Menu
The central navigation hub providing quick access to gameplay modes, the editor, and settings.

<br>
<p align="center">
  <img src="assets/menu.png" alt="Main Menu">
</p>
<br>

#### Level Selection
A browsable list of available levels, categorized by pre-made, generated, and user-created. This screen displays the player's saved personal best time next to each level.

<br>
<p align="center">
  <img src="assets/level_selection.png" alt="Level Selection">
</p>
<br>

#### Gameplay Screen
The active game interface where players tilt their device to move the ball. Includes the labyrinth top-down view, a live timer, and a pause button.

<br>
<p align="center">
  <img src="assets/gameplay.png" alt="Gameplay">
</p>
<br>

#### Post-Level Summary
A results screen shown upon reaching the goal. It displays the completion time, indicates if a new record was set, and offers options to replay or return to the menu.

<br>
<p align="center">
  <img src="assets/level_summary.png" alt="Level Summary">
</p>
<br>

#### Settings
A configuration screen to adjust gyroscope sensitivity, toggle audio, and manage application preferences.

<br>
<p align="center">
  <img src="assets/settings.png" alt="Settings">
</p>
<br>
