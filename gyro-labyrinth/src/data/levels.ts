// A level is a grid of square tiles:
//   # wall    . floor    S start    F finish line
// The outer edge must be all walls, so the ball can't leave the board.
export type Level = {
  id: number;
  name: string;
  rows: string[];
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
