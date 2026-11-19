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

export type Enemy = Patroller | Wanderer;

export function isWanderer(enemy: Enemy): enemy is Wanderer {
  return 'wander' in enemy;
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
];

export function getLevel(id: number) {
  return levels.find((level) => level.id === id);
}

export function findTiles(level: Level, tile: string) {
  return level.rows.flatMap((row, rowIndex) =>
    [...row].flatMap((char, col) => (char === tile ? [{ col, row: rowIndex }] : [])),
  );
}
