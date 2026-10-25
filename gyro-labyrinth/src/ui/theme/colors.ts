export const lightColors = {
  background: '#f6f7f9',
  surface: '#ffffff',
  border: '#e2e4e8',
  divider: '#eceef1',
  text: '#1c1f24',
  textMuted: '#5f646d',
  textFaint: '#a9adb4',

  primary: '#86efac',
  primarySoft: '#d1fae0',
  primaryText: '#14532d',
  primaryStrong: '#166534',

  secondary: '#dfeafb',
  secondaryText: '#1e3a6e',
  info: '#bae6fd',
  infoText: '#0c4a6e',

  current: '#eaf3fd',
  currentBorder: '#bcd7f5',
  currentText: '#2f5f8f',

  floor: '#f4ead5',
  ball: '#c0c4cc',

  overlay: 'rgba(20, 24, 30, 0.35)',
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  background: '#121418',
  surface: '#1b1e24',
  border: '#2e333b',
  divider: '#252930',
  text: '#eceef1',
  textMuted: '#9ba1aa',
  textFaint: '#5d636d',

  primary: '#86efac',
  primarySoft: '#1d3a28',
  primaryText: '#14532d',
  primaryStrong: '#4ade80',

  secondary: '#223249',
  secondaryText: '#c2d6f3',
  info: '#1d4157',
  infoText: '#bae6fd',

  current: '#1a2636',
  currentBorder: '#2f4a6b',
  currentText: '#8fb8e6',

  floor: '#2a2621',
  ball: '#c0c4cc',

  overlay: 'rgba(0, 0, 0, 0.55)',
};

// The original ball game always uses the light palette.
export const colors = lightColors;
