// A level is a grid of square tiles:
//   # wall    . floor    S start    F finish line    C coin (on floor)
// The outer edge must be all walls, so the ball can't leave the board.
export type Tile = { col: number; row: number };

// An enemy walks back and forth in a straight line between two tiles.
// The line should not cross a wall.
export type Enemy = {
  from: Tile;
  to: Tile;
  speed?: number; // tiles per second
};

export type Level = {
  id: number;
  name: string;
  rows: string[];
  enemies: Enemy[];
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
