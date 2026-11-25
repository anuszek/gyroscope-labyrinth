// Decides when the phone is lying flat and still, so calibration can take the reading.
// Plain functions with no React in them, so they can be tested on their own.
import { Tilt, tiltDegrees } from './tilt';

// How long the phone has to stay flat and still, in ms.
export const HOLD_MS = 1500;
// The phone counts as flat when it is tilted by less than this, in degrees. A table is rarely perfectly level.
export const FLAT_LIMIT_DEGREES = 12;
// The phone counts as still when its tilt stays within this range (about 0.7 degrees). A phone on a table is
// well inside it, and a phone in a hand is not.
export const STILL_LIMIT = 0.012;

export type Sample = Tilt & { time: number };

export type Assessment = {
  // 'tilted': not flat yet. 'moving': flat but not still. 'hold': flat and still, keep holding.
  status: 'tilted' | 'moving' | 'hold';
  progress: number; // 0..1, how much of HOLD_MS has been held
  mean: Tilt; // the average tilt of the samples
  degrees: number; // how far the average is from flat
  restart: boolean; // true when the samples so far are no use and counting should start over
};

// Looks at the samples taken since counting began, oldest first.
export function assess(samples: Sample[]): Assessment {
  const count = samples.length;
  const mean = {
    x: samples.reduce((sum, s) => sum + s.x, 0) / count,
    y: samples.reduce((sum, s) => sum + s.y, 0) / count,
  };
  const degrees = tiltDegrees(mean);
  const latest = samples[count - 1];

  if (tiltDegrees(latest) > FLAT_LIMIT_DEGREES) {
    return { status: 'tilted', progress: 0, mean, degrees: tiltDegrees(latest), restart: true };
  }

  const xs = samples.map((s) => s.x);
  const ys = samples.map((s) => s.y);
  const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  if (spread > STILL_LIMIT) return { status: 'moving', progress: 0, mean, degrees, restart: true };

  const progress = Math.min(1, (latest.time - samples[0].time) / HOLD_MS);
  return { status: 'hold', progress, mean, degrees, restart: false };
}
