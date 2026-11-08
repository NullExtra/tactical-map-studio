export type TileType = 0 | 1 | 2 | 3 | 4;

export const TILE = {
  VOID: 0 as TileType,
  WALL: 1 as TileType,
  FLOOR: 2 as TileType,
  CHOKEPOINT: 3 as TileType, // Pintu Sempit (Biaya gerak 3x)
  WATER: 4 as TileType,      // Medan Berat / Air (Biaya gerak 2x)
} as const;

export interface GridCoordinate {
  x: number;
  y: number;
}

export type ActiveTool =
  | 'BRUSH_WALL'
  | 'BRUSH_FLOOR'
  | 'BRUSH_CHOKEPOINT'
  | 'BRUSH_WATER'
  | 'SET_ORIGIN'
  | 'SET_WAYPOINT'
  | 'SET_TARGET';

export type AlgorithmType = 'ASTAR' | 'DIJKSTRA' | 'BFS';

export type GeneratorType = 'TACTICAL_ROOMS' | 'ORGANIC_CAVES' | 'BRAIDED_MAZE';

export type MapSizePreset = 'STANDARD' | 'LARGE' | 'MASSIVE';

export type StudioTheme = 'TACTICAL_COMMAND' | 'ROYAL_PARCHMENT' | 'ARCHITECT_BLUEPRINT';

export interface PathfindingResult {
  path: GridCoordinate[];
  visited: GridCoordinate[];
  executionTimeMs: number;
  totalCost: number;
}