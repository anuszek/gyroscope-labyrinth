// '#' wall, '.' floor, 'S' start, 'G' goal.
export const LEVEL_1: readonly string[] = [
  '#########',
  '#S..#...#',
  '###.#.#.#',
  '#...#.#.#',
  '#.###.#.#',
  '#.....#G#',
  '#########',
];

export type Cell = { col: number; row: number };

export type Level = {
  cols: number;
  rows: number;
  /** Row-major flat array, 1 = wall, 0 = open. Flat numbers are cheap to copy into worklets. */
  walls: number[];
  start: Cell;
  goal: Cell;
};

export function parseLevel(grid: readonly string[]): Level {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const walls: number[] = [];
  let start: Cell | null = null;
  let goal: Cell | null = null;

  for (let row = 0; row < rows; row++) {
    const line = grid[row];
    if (line.length !== cols) {
      throw new Error(`Level row ${row} has length ${line.length}, expected ${cols}`);
    }
    for (let col = 0; col < cols; col++) {
      const ch = line[col];
      walls.push(ch === '#' ? 1 : 0);
      if (ch === 'S') start = { col, row };
      else if (ch === 'G') goal = { col, row };
    }
  }

  if (!start || !goal) throw new Error('Level must contain exactly one S and one G');
  return { cols, rows, walls, start, goal };
}
