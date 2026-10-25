export type Level = {
  id: number;
  name: string;
};

export const levels: Level[] = [{ id: 1, name: 'Origin' }];

export function getLevel(id: number) {
  return levels.find((level) => level.id === id);
}
