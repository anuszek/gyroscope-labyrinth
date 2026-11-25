import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';

import type { PowerupType } from '../../data/levels';

// The game's pictures, drawn in code so they stay sharp at any size and need no image files.
// Every sprite is square and `size` is its diameter in pixels.

// A glossy glass marble with a soft shadow. The shadow reaches past the ball's own size.
export function BallSprite({ size }: { size: number }) {
  return (
    <Svg
      width={size * 1.5}
      height={size * 1.5}
      viewBox="-25 -25 150 150"
      style={{ position: 'absolute', left: -size * 0.25, top: -size * 0.25 }}
    >
      <Defs>
        <RadialGradient id="ball-shadow" cx="54" cy="66" r="48" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.28" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="ball-base" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#93c5fd" />
          <Stop offset="1" stopColor="#6ee7b7" />
        </LinearGradient>
        <RadialGradient id="ball-shade" cx="38" cy="32" r="70" gradientUnits="userSpaceOnUse">
          <Stop offset="0.55" stopColor="#000000" stopOpacity="0" />
          <Stop offset="1" stopColor="#0f3a5f" stopOpacity="0.3" />
        </RadialGradient>
      </Defs>
      <Circle cx="54" cy="66" r="48" fill="url(#ball-shadow)" />
      <Circle cx="50" cy="50" r="50" fill="url(#ball-base)" />
      <Circle cx="50" cy="50" r="50" fill="url(#ball-shade)" />
      <Ellipse cx="36" cy="28" rx="17" ry="10" fill="#ffffff" opacity="0.8" transform="rotate(-35 36 28)" />
      <Circle cx="68" cy="72" r="6" fill="#ffffff" opacity="0.25" />
    </Svg>
  );
}

export function CoinSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="coin-rim" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#fcd34d" />
          <Stop offset="1" stopColor="#d99a00" />
        </LinearGradient>
        <RadialGradient id="coin-face" cx="40" cy="35" r="50" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#fef3a6" />
          <Stop offset="1" stopColor="#f5c518" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill="url(#coin-rim)" />
      <Circle cx="50" cy="50" r="36" fill="url(#coin-face)" stroke="#b88a00" strokeOpacity="0.5" strokeWidth="2.5" />
      <Path d="M50 34 V66" stroke="#b88a00" strokeOpacity="0.55" strokeWidth="8" strokeLinecap="round" />
      <Ellipse cx="36" cy="30" rx="12" ry="6" fill="#ffffff" opacity="0.55" transform="rotate(-35 36 30)" />
    </Svg>
  );
}

const SPIKES = 8;

// A triangle sticking out of the enemy's body at `angle` (radians).
function spike(angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const point = (along: number, across: number) => `${50 + along * cos - across * sin},${50 + along * sin + across * cos}`;
  return `${point(24, -10)} ${point(48, 0)} ${point(24, 10)}`;
}

// Patrolling enemies are purple, wandering ones orange and bouncing ones red, so the player can tell them apart at a glance.
export type EnemyTone = 'patrol' | 'wander' | 'bounce';

const ENEMY_COLORS = {
  patrol: { light: '#c4b5fd', mid: '#8b5cf6', dark: '#6d28d9', spikes: '#5b21b6', edge: '#4c1d95' },
  wander: { light: '#fed7aa', mid: '#fb923c', dark: '#ea580c', spikes: '#9a3412', edge: '#7c2d12' },
  bounce: { light: '#fecaca', mid: '#f87171', dark: '#dc2626', spikes: '#991b1b', edge: '#7f1d1d' },
};

// The enemy's spiky body. It is drawn apart from the face, so the body can spin and the face stay upright.
export function EnemyBody({ size, tone = 'patrol' }: { size: number; tone?: EnemyTone }) {
  const color = ENEMY_COLORS[tone];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={`enemy-body-${tone}`} cx="40" cy="35" r="45" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color.light} />
          <Stop offset="0.6" stopColor={color.mid} />
          <Stop offset="1" stopColor={color.dark} />
        </RadialGradient>
      </Defs>
      <G>
        {Array.from({ length: SPIKES }, (_, i) => (
          <Polygon key={i} points={spike((i * 2 * Math.PI) / SPIKES)} fill={color.spikes} />
        ))}
      </G>
      <Circle cx="50" cy="50" r="32" fill={`url(#enemy-body-${tone})`} stroke={color.edge} strokeWidth="2.5" />
    </Svg>
  );
}

export function EnemyFace({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
      <Ellipse cx="40" cy="48" rx="7" ry="8" fill="#ffffff" />
      <Ellipse cx="60" cy="48" rx="7" ry="8" fill="#ffffff" />
      <Circle cx="41" cy="50" r="3.5" fill="#2e1065" />
      <Circle cx="59" cy="50" r="3.5" fill="#2e1065" />
      <Path d="M31 37 L46 43 M69 37 L54 43" stroke="#2e1065" strokeWidth="3.5" strokeLinecap="round" />
    </Svg>
  );
}

// The finish: a pale green disc with a ring and a dot in the middle.
export function GoalSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="48" fill="#86efac" opacity="0.45" />
      <Circle cx="50" cy="50" r="30" fill="#dcfce7" stroke="#22c55e" strokeWidth="5" />
      <Circle cx="50" cy="50" r="10" fill="#16a34a" />
    </Svg>
  );
}

// A dashed circle that marks where the ball starts.
export function StartMarker({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="4" strokeDasharray="7 7" />
    </Svg>
  );
}

const POWERUP_COLORS = {
  shield: { light: '#93c5fd', dark: '#2563eb' },
  freeze: { light: '#a5f3fc', dark: '#0ea5e9' },
  speed: { light: '#fde047', dark: '#f59e0b' },
};

// The glow colour of each powerup, for halos and the HUD.
export const POWERUP_GLOW: Record<PowerupType, string> = {
  shield: '#60a5fa',
  freeze: '#22d3ee',
  speed: '#fbbf24',
};

// One arm of the snowflake, as a line through the middle at `degrees`.
function snowflakeArm(degrees: number) {
  const a = (degrees * Math.PI) / 180;
  const dx = 28 * Math.cos(a);
  const dy = 28 * Math.sin(a);
  return `M${50 - dx} ${50 - dy} L${50 + dx} ${50 + dy}`;
}

// A round badge with a white symbol on it: a shield, a snowflake or a lightning bolt.
export function PowerupSprite({ type, size }: { type: PowerupType; size: number }) {
  const color = POWERUP_COLORS[type];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`powerup-${type}`} x1="20" y1="10" x2="80" y2="92" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color.light} />
          <Stop offset="1" stopColor={color.dark} />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="46" fill={`url(#powerup-${type})`} />
      <Circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2.5" />
      {type === 'shield' && (
        <>
          <Path d="M50 21 L73 30 V50 C73 65 63 75 50 80 C37 75 27 65 27 50 V30 Z" fill="#ffffff" />
          <Path d="M50 30 L64 36 V50 C64 59 58 66 50 70 Z" fill={color.dark} opacity="0.35" />
        </>
      )}
      {type === 'freeze' && (
        <>
          <Path d={`${snowflakeArm(0)} ${snowflakeArm(60)} ${snowflakeArm(120)}`} stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
          <Circle cx="50" cy="50" r="6" fill="#ffffff" />
        </>
      )}
      {type === 'speed' && <Path d="M58 16 L30 55 H47 L41 84 L70 44 H53 Z" fill="#ffffff" stroke={color.dark} strokeWidth="2" strokeLinejoin="round" />}
    </Svg>
  );
}
