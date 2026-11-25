// A level is a grid of square tiles:
//   # wall    . floor    S start    F finish line    C coin (on floor)
// The outer edge must be all walls, so the ball can't leave the board.
export type Tile = { col: number; row: number };

// A patrolling enemy walks back and forth in a straight line between two tiles.
// The line should not cross a wall.
export type Patroller = {
  from: Tile;
  to: Tile;
  speed?: number; // tiles per second
};

// A wandering enemy starts on a tile and heads off in a random direction.
// Each time it runs into a wall it picks a new random direction.
export type Wanderer = {
  wander: Tile;
  speed?: number; // tiles per second
};

// A bouncing enemy flies in a straight line at any angle. Each time it hits a wall it leaves at a
// new random angle, so it is much harder to read than a wanderer.
export type Bouncer = {
  bounce: Tile;
  speed?: number; // tiles per second
};

export type Enemy = Patroller | Wanderer | Bouncer;

export function isWanderer(enemy: Enemy): enemy is Wanderer {
  return 'wander' in enemy;
}

export function isBouncer(enemy: Enemy): enemy is Bouncer {
  return 'bounce' in enemy;
}

// Powerups sit on a floor tile until the ball picks them up:
//   shield  absorbs the next enemy hit
//   freeze  stops every enemy for a few seconds, and makes them harmless
//   speed   makes the ball respond faster for a few seconds
export type PowerupType = 'shield' | 'freeze' | 'speed';

export type Powerup = {
  type: PowerupType;
  at: Tile;
};

export type Level = {
  id: number;
  name: string;
  rows: string[];
  enemies: Enemy[];
  powerups: Powerup[];
};

export const levels: Level[] = [
  {
    id: 1,
    name: 'Origin',
    rows: [
      '###########',
      '#S........#',
      '#.........#',
      '########..#',
      '#.........#',
      '#.........#',
      '#..########',
      '#.........#',
      '#.........#',
      '####..#####',
      '#.........#',
      '#.........#',
      '#..#####..#',
      '#..#####..#',
      '#..#####..#',
      '#..#####..#',
      '#..#F.....#',
      '#..#F.....#',
      '###########',
    ],
    enemies: [],
    powerups: [],
  },
  {
    id: 2,
    name: 'Gold Rush',
    rows: [
      '###########',
      '#S...C....#',
      '#.C.......#',
      '########..#',
      '#.........#',
      '#.......C.#',
      '#..########',
      '#....C....#',
      '#........C#',
      '####..#####',
      '#.....C...#',
      '#.C.......#',
      '#..#####..#',
      '#..#####..#',
      '#C.#####..#',
      '#..#####..#',
      '#..#F..C..#',
      '#..#F.....#',
      '###########',
    ],
    enemies: [
      { from: { col: 1, row: 4 }, to: { col: 9, row: 4 } },
      { from: { col: 1, row: 10 }, to: { col: 9, row: 10 }, speed: 3 },
      { from: { col: 9, row: 12 }, to: { col: 9, row: 15 }, speed: 2 },
    ],
    powerups: [],
  },
  {
    id: 3,
    name: 'Bounce House',
    // Four pillared rooms joined by one-tile gaps. The wanderers bounce around the rooms,
    // so the gaps are the safe places to wait for a clear run.
    rows: [
      '###########',
      '#S....C...#',
      '#.#..#..#.#',
      '#C.......C#',
      '####.###.##',
      '#.C.......#',
      '#..#...#..#',
      '#....C...C#',
      '##.#####.##',
      '#........C#',
      '#.#.....#.#',
      '#.C...C...#',
      '###.###.###',
      '#C........#',
      '#..#...#..#',
      '#.........#',
      '#.##...##.#',
      '#.C..F..C.#',
      '###########',
    ],
    enemies: [
      { wander: { col: 8, row: 1 }, speed: 3 },
      { wander: { col: 6, row: 5 }, speed: 3.5 },
      { wander: { col: 3, row: 9 }, speed: 3 },
      { wander: { col: 6, row: 13 }, speed: 3.5 },
      { from: { col: 1, row: 15 }, to: { col: 9, row: 15 }, speed: 2.5 },
    ],
    powerups: [
      { type: 'shield', at: { col: 5, row: 3 } },
      { type: 'speed', at: { col: 1, row: 7 } },
      { type: 'freeze', at: { col: 9, row: 11 } },
      { type: 'shield', at: { col: 9, row: 13 } },
    ],
  },
  {
    id: 4,
    name: 'Chaos Theory',
    // Wide open rooms and fast bouncers that fly off the walls at any angle. They can slip through the
    // gaps between the rooms too, so there is no place that is safe for long.
    rows: [
      '###########',
      '#S...C....#',
      '#.........#',
      '#C.#...#..#',
      '#.........#',
      '####.#.####',
      '#........C#',
      '#..#...#..#',
      '#....C...C#',
      '#.........#',
      '##.#####.##',
      '#.C.......#',
      '#...###...#',
      '#...###..C#',
      '#.C.......#',
      '#####.#####',
      '#.C.....C.#',
      '#....F....#',
      '###########',
    ],
    enemies: [
      { bounce: { col: 8, row: 2 }, speed: 4.5 },
      { bounce: { col: 5, row: 4 }, speed: 4 },
      { bounce: { col: 3, row: 6 }, speed: 5 },
      { bounce: { col: 8, row: 9 }, speed: 4.5 },
      { bounce: { col: 5, row: 11 }, speed: 5 },
      { bounce: { col: 9, row: 14 }, speed: 4.5 },
      { bounce: { col: 7, row: 16 }, speed: 4 },
    ],
    powerups: [
      { type: 'shield', at: { col: 2, row: 2 } },
      { type: 'freeze', at: { col: 5, row: 9 } },
      { type: 'speed', at: { col: 9, row: 12 } },
      { type: 'shield', at: { col: 5, row: 14 } },
    ],
  },
];

export function getLevel(id: number) {
  return levels.find((level) => level.id === id);
}

export function findTiles(level: Level, tile: string) {
  return level.rows.flatMap((row, rowIndex) =>
    [...row].flatMap((char, col) => (char === tile ? [{ col, row: rowIndex }] : [])),
  );
}
