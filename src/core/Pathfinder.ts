import { TILE } from '../types/map';
import type {
  TileType,
  GridCoordinate,
  AlgorithmType,
  PathfindingResult,
} from '../types/map';

export class Pathfinder {
  private static getMoveCost(
    tile: TileType,
    algorithm: AlgorithmType,
    isDiagonal: boolean
  ): number {
    const base = isDiagonal ? 1.414 : 1;
    if (algorithm === 'BFS') return base;
    if (tile === TILE.CHOKEPOINT) return base * 3;
    if (tile === TILE.WATER) return base * 2;
    return base;
  }

  private static heuristic(
    a: GridCoordinate,
    b: GridCoordinate,
    allowDiagonal: boolean
  ): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    if (allowDiagonal) {
      return dx + dy + (1.414 - 2) * Math.min(dx, dy);
    }
    return dx + dy;
  }

  public static computeCompleteRoute(
    grid: TileType[][],
    start: GridCoordinate,
    goal: GridCoordinate,
    waypoint: GridCoordinate | null,
    algorithm: AlgorithmType,
    allowDiagonal: boolean
  ): PathfindingResult {
    if (!waypoint) {
      return this.findSingleSegment(grid, start, goal, algorithm, allowDiagonal);
    }

    const leg1 = this.findSingleSegment(grid, start, waypoint, algorithm, allowDiagonal);
    const leg2 = this.findSingleSegment(grid, waypoint, goal, algorithm, allowDiagonal);

    if (leg1.path.length === 0 || leg2.path.length === 0) {
      return {
        path: [],
        visited: [...leg1.visited, ...leg2.visited],
        executionTimeMs: Number((leg1.executionTimeMs + leg2.executionTimeMs).toFixed(3)),
        totalCost: 0,
      };
    }

    return {
      path: [...leg1.path, ...leg2.path.slice(1)],
      visited: [...leg1.visited, ...leg2.visited],
      executionTimeMs: Number((leg1.executionTimeMs + leg2.executionTimeMs).toFixed(3)),
      totalCost: Number((leg1.totalCost + leg2.totalCost).toFixed(1)),
    };
  }

  private static findSingleSegment(
    grid: TileType[][],
    start: GridCoordinate,
    goal: GridCoordinate,
    algorithm: AlgorithmType,
    allowDiagonal: boolean
  ): PathfindingResult {
    const startTime = performance.now();
    const height = grid.length;
    const width = grid[0].length;

    const visited: GridCoordinate[] = [];
    const visitedSet = new Set<string>();
    const cameFrom = new Map<string, GridCoordinate>();
    const costSoFar = new Map<string, number>();

    const key = (c: GridCoordinate) => `${c.x},${c.y}`;
    const startKey = key(start);
    const goalKey = key(goal);

    const frontier: { coord: GridCoordinate; priority: number }[] = [
      { coord: start, priority: 0 },
    ];
    costSoFar.set(startKey, 0);

    const dirs = [
      { x: 0, y: -1, diag: false },
      { x: 1, y: 0, diag: false },
      { x: 0, y: 1, diag: false },
      { x: -1, y: 0, diag: false },
    ];

    if (allowDiagonal) {
      dirs.push(
        { x: 1, y: -1, diag: true },
        { x: 1, y: 1, diag: true },
        { x: -1, y: 1, diag: true },
        { x: -1, y: -1, diag: true }
      );
    }

    let found = false;

    while (frontier.length > 0) {
      if (algorithm !== 'BFS') {
        frontier.sort((a, b) => a.priority - b.priority);
      }

      const current = frontier.shift()!.coord;
      const currentKey = key(current);

      if (!visitedSet.has(currentKey)) {
        visitedSet.add(currentKey);
        visited.push(current);
      }

      if (currentKey === goalKey) {
        found = true;
        break;
      }

      for (const d of dirs) {
        const next: GridCoordinate = { x: current.x + d.x, y: current.y + d.y };
        if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) {
          continue;
        }

        const nextTile = grid[next.y][next.x];
        if (nextTile === TILE.WALL || nextTile === TILE.VOID) {
          continue;
        }

        // Cegah agen menembus celah sudut dinding sempit saat gerak diagonal
        if (d.diag) {
          if (
            grid[current.y][next.x] === TILE.WALL &&
            grid[next.y][current.x] === TILE.WALL
          ) {
            continue;
          }
        }

        const nextKey = key(next);
        const stepCost = this.getMoveCost(nextTile, algorithm, d.diag);
        const newCost = (costSoFar.get(currentKey) ?? 0) + stepCost;

        if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)!) {
          costSoFar.set(nextKey, newCost);
          let priority = newCost;
          if (algorithm === 'ASTAR') {
            priority += this.heuristic(next, goal, allowDiagonal) * 1.1;
          }
          frontier.push({ coord: next, priority });
          cameFrom.set(nextKey, current);
        }
      }
    }

    const path: GridCoordinate[] = [];
    if (found) {
      let curr: GridCoordinate | undefined = goal;
      while (curr) {
        path.push(curr);
        if (curr.x === start.x && curr.y === start.y) break;
        curr = cameFrom.get(key(curr));
      }
      path.reverse();
    }

    const endTime = performance.now();
    return {
      path,
      visited,
      executionTimeMs: Number((endTime - startTime).toFixed(3)),
      totalCost: found ? Number((costSoFar.get(goalKey) ?? 0).toFixed(1)) : 0,
    };
  }
}