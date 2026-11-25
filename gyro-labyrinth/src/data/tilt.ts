// How the phone's tilt becomes a push on the ball. The game and the Settings preview both use these,
// so what the preview shows is what the ball feels.
//
// A tilt is the sideways part of gravity as a fraction of full gravity: x grows when the right edge of the
// phone goes down, y grows when the top edge goes down. It is about sin(angle), so 0.5 is a tilt of 30 degrees.

export type Tilt = { x: number; y: number };

// The dead zone slider (0..1) covers 0 to this many degrees.
export const MAX_DEAD_ZONE_DEGREES = 6;

// Sensitivity (0..1) as a multiplier on the push: 0 is 0.35x, 0.5 is 1x, 1 is about 2.8x.
export function tiltGain(sensitivity: number) {
  'worklet';
  return Math.pow(2, (sensitivity - 0.5) * 3);
}

// The size of the dead zone as a tilt, so it can be compared with tilts directly.
export function deadZoneSize(deadZone: number) {
  'worklet';
  return Math.sin((deadZone * MAX_DEAD_ZONE_DEGREES * Math.PI) / 180);
}

// The push on the ball for a raw tilt. The neutral tilt is taken off first, then anything inside the dead zone
// counts as nothing. Past the dead zone the push grows smoothly from zero, with no jump at its edge.
export function steering(raw: Tilt, neutral: Tilt, deadZone: number, sensitivity: number): Tilt {
  'worklet';
  const x = raw.x - neutral.x;
  const y = raw.y - neutral.y;
  const size = Math.hypot(x, y);
  const zone = deadZoneSize(deadZone);
  if (size <= zone) return { x: 0, y: 0 };
  const scale = ((size - zone) / size) * tiltGain(sensitivity);
  return { x: x * scale, y: y * scale };
}

// A tilt as an angle in degrees.
export function tiltDegrees(tilt: Tilt) {
  return (Math.asin(Math.min(1, Math.hypot(tilt.x, tilt.y))) * 180) / Math.PI;
}
