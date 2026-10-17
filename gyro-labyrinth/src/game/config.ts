// All tunable game constants live here.
// Distances and speeds are expressed in cell sizes so the feel is the same on
// every screen; physics converts them to pixels at runtime.

/** Standard gravity in m/s², used to normalize gravity sensor readings to [-1, 1]. */
export const GRAVITY_MS2 = 9.81;

/** Sign applied to the sensor X axis. Set from on-device testing: +1 makes tilting right move the ball right. */
export const TILT_SIGN_X = 1;

/** Sign applied to the sensor Y axis. Set from on-device testing: -1 makes tilting the top edge away move the ball up. */
export const TILT_SIGN_Y = -1;

/** Normalized tilt below which input is ignored (~0.03 ≈ 1.7°), filters hand tremor. */
export const DEAD_ZONE = 0.03;

/** Acceleration at full tilt (tilt = 1), in cells per second². */
export const ACCEL = 25;

/** Velocity multiplier per 1/60 s; scaled by dt so it is frame-rate independent. */
export const FRICTION = 0.985;

/** Maximum ball speed, in cells per second. */
export const MAX_SPEED = 8;

/** Fraction of normal velocity kept (and reversed) on wall impact. */
export const RESTITUTION = 0.4;

/** Fraction of tangential velocity kept on wall impact. */
export const TANGENTIAL_DAMPING = 0.9;

/** Ball radius as a fraction of the cell size. */
export const BALL_RADIUS_RATIO = 0.35;

/** Max distance per physics substep, as a fraction of the ball radius (anti-tunneling). */
export const MAX_SUBSTEP_RATIO = 0.5;

/** Upper bound for frame dt in seconds, so a hitch or resume does not teleport the ball. */
export const MAX_DT = 1 / 30;
