import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';

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

// The enemy's spiky body. It is drawn apart from the face, so the body can spin and the face stay upright.
export function EnemyBody({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="enemy-body" cx="40" cy="35" r="45" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#c4b5fd" />
          <Stop offset="0.6" stopColor="#8b5cf6" />
          <Stop offset="1" stopColor="#6d28d9" />
        </RadialGradient>
      </Defs>
      <G>
        {Array.from({ length: SPIKES }, (_, i) => (
          <Polygon key={i} points={spike((i * 2 * Math.PI) / SPIKES)} fill="#5b21b6" />
        ))}
      </G>
      <Circle cx="50" cy="50" r="32" fill="url(#enemy-body)" stroke="#4c1d95" strokeWidth="2.5" />
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
