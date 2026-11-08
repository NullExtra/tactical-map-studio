import { TILE } from '../types/map';
import type { TileType, GridCoordinate, GeneratorType } from '../types/map';

export class GridEngine {
  public static createEmptyGrid(
    width: number,
    height: number,
    fill: TileType = TILE.FLOOR
  ): TileType[][] {
    return Array.from({ length: height }, () => Array(width).fill(fill));
  }

  public static cloneGrid(grid: TileType[][]): TileType[][] {
    return grid.map(row => [...row]);
  }

  public static calculateWalkableRatio(grid: TileType[][]): number {
    let walkable = 0;
    const total = grid.length * grid[0].length;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] !== TILE.WALL && grid[y][x] !== TILE.VOID) {
          walkable++;
        }
      }
    }
    return Number(((walkable / total) * 100).toFixed(1));
  }

  public static generateMap(
    width: number,
    height: number,
    type: GeneratorType
  ): { grid: TileType[][]; executionTimeMs: number } {
    const start = performance.now();
    let grid: TileType[][];

    if (type === 'ORGANIC_CAVES') {
      grid = this.generateOrganicCaves(width, height);
    } else if (type === 'BRAIDED_MAZE') {
      grid = this.generateBraidedMaze(width, height);
    } else {
      grid = this.generateTacticalRooms(width, height);
    }

    const end = performance.now();
    return {
      grid,
      executionTimeMs: Number((end - start).toFixed(2)),
    };
  }

  // 1. Ruangan Taktis (Chambers, Corridors, Doors & Water Pools)
  private static generateTacticalRooms(width: number, height: number): TileType[][] {
    const grid = this.createEmptyGrid(width, height, TILE.WALL);
    const rooms: { x: number; y: number; w: number; h: number }[] = [];
    const attempts = 28;

    for (let i = 0; i < attempts; i++) {
      const w = Math.floor(Math.random() * 6) + 5;
      const h = Math.floor(Math.random() * 5) + 4;
      const x = Math.floor(Math.random() * (width - w - 2)) + 1;
      const y = Math.floor(Math.random() * (height - h - 2)) + 1;

      let overlaps = false;
      for (const r of rooms) {
        if (
          x < r.x + r.w + 1 &&
          x + w + 1 > r.x &&
          y < r.y + r.h + 1 &&
          y + h + 1 > r.y
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        rooms.push({ x, y, w, h });
        for (let ry = y; ry < y + h; ry++) {
          for (let rx = x; rx < x + w; rx++) {
            grid[ry][rx] = TILE.FLOOR;
          }
        }
        // Tambahkan kolam medan berat (air) atau pilar taktis di beberapa ruangan besar
        if (w >= 7 && h >= 6 && Math.random() < 0.55) {
          const px = x + Math.floor(w / 2);
          const py = y + Math.floor(h / 2);
          grid[py][px] = TILE.WATER;
          grid[py][px - 1] = TILE.WATER;
          grid[py - 1][px] = TILE.WATER;
        }
      }
    }

    // Hubungkan ruangan dengan lorong ortogonal
    for (let i = 1; i < rooms.length; i++) {
      const prev = rooms[i - 1];
      const curr = rooms[i];
      let cx = Math.floor(prev.x + prev.w / 2);
      let cy = Math.floor(prev.y + prev.h / 2);
      const tx = Math.floor(curr.x + curr.w / 2);
      const ty = Math.floor(curr.y + curr.h / 2);

      while (cx !== tx) {
        grid[cy][cx] = TILE.FLOOR;
        cx += cx < tx ? 1 : -1;
      }
      while (cy !== ty) {
        grid[cy][cx] = TILE.FLOOR;
        cy += cy < ty ? 1 : -1;
      }
    }

    // Tandai Pintu Sempit (Chokepoint)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === TILE.FLOOR) {
          const vWalls = grid[y - 1][x] === TILE.WALL && grid[y + 1][x] === TILE.WALL;
          const hFloors = grid[y][x - 1] !== TILE.WALL && grid[y][x + 1] !== TILE.WALL;
          const hWalls = grid[y][x - 1] === TILE.WALL && grid[y][x + 1] === TILE.WALL;
          const vFloors = grid[y - 1][x] !== TILE.WALL && grid[y + 1][x] !== TILE.WALL;

          if ((vWalls && hFloors) || (hWalls && vFloors)) {
            if (Math.random() < 0.28) grid[y][x] = TILE.CHOKEPOINT;
          }
        }
      }
    }

    return grid;
  }

  // 2. Gua Organik (Cellular Automata + Terrain Pockets)
  private static generateOrganicCaves(width: number, height: number): TileType[][] {
    let grid = this.createEmptyGrid(width, height, TILE.WALL);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        grid[y][x] = Math.random() < 0.42 ? TILE.WALL : TILE.FLOOR;
      }
    }

    for (let step = 0; step < 4; step++) {
      const next = this.cloneGrid(grid);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let walls = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              if (grid[y + dy][x + dx] === TILE.WALL) walls++;
            }
          }
          if (walls > 4) next[y][x] = TILE.WALL;
          else if (walls < 4) next[y][x] = TILE.FLOOR;
        }
      }
      grid = next;
    }

    // Buat jalur tengah aman agar gua selalu terhubung dari kiri ke kanan
    const midY = Math.floor(height / 2);
    for (let x = 2; x < width - 2; x++) {
      grid[midY][x] = TILE.FLOOR;
      grid[midY - 1][x] = TILE.FLOOR;
    }

    // Sebarkan genangan air/medan berat secara alami di cekungan gua
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        if (grid[y][x] === TILE.FLOOR && Math.random() < 0.08) {
          grid[y][x] = TILE.WATER;
          if (grid[y][x + 1] === TILE.FLOOR) grid[y][x + 1] = TILE.WATER;
        }
      }
    }

    return grid;
  }

  // 3. Labirin Koridor Taktis (Braided Maze)
  private static generateBraidedMaze(width: number, height: number): TileType[][] {
    const grid = this.createEmptyGrid(width, height, TILE.WALL);

    const carve = (x: number, y: number) => {
      grid[y][x] = TILE.FLOOR;
      const dirs = [
        { dx: 0, dy: -2 },
        { dx: 2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
      ].sort(() => Math.random() - 0.5);

      for (const { dx, dy } of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && grid[ny][nx] === TILE.WALL) {
          grid[y + dy / 2][x + dx / 2] = TILE.FLOOR;
          carve(nx, ny);
        }
      }
    };

    carve(1, 1);

    // Buka sejumlah jalan buntu (Braiding) agar AI punya alternatif rute
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        if (grid[y][x] === TILE.WALL && Math.random() < 0.18) {
          grid[y][x] = Math.random() < 0.25 ? TILE.CHOKEPOINT : TILE.FLOOR;
        }
      }
    }

    return grid;
  }

  // 2D Raycasting Field of View (Jarak Pandang & Bayangan Dinding)
  public static computeFieldOfView(
    grid: TileType[][],
    center: GridCoordinate,
    radius: number
  ): Set<string> {
    const visible = new Set<string>();
    const height = grid.length;
    const width = grid[0]?.length || 0;

    for (let y = Math.max(0, center.y - radius); y <= Math.min(height - 1, center.y + radius); y++) {
      for (let x = Math.max(0, center.x - radius); x <= Math.min(width - 1, center.x + radius); x++) {
        const distSq = (x - center.x) ** 2 + (y - center.y) ** 2;
        if (distSq <= radius * radius) {
          if (this.hasLineOfSight(grid, center, { x, y })) {
            visible.add(`${x},${y}`);
          }
        }
      }
    }
    return visible;
  }

  private static hasLineOfSight(
    grid: TileType[][],
    start: GridCoordinate,
    end: GridCoordinate
  ): boolean {
    let x0 = start.x;
    let y0 = start.y;
    const x1 = end.x;
    const y1 = end.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (x0 === x1 && y0 === y1) return true;
      if (
        (x0 !== start.x || y0 !== start.y) &&
        grid[y0]?.[x0] === TILE.WALL
      ) {
        return false;
      }
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  public static findFirstWalkable(grid: TileType[][], fromEnd = false): GridCoordinate {
    const h = grid.length;
    const w = grid[0].length;
    if (!fromEnd) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (grid[y][x] === TILE.FLOOR) return { x, y };
        }
      }
    } else {
      for (let y = h - 2; y >= 1; y--) {
        for (let x = w - 2; x >= 1; x--) {
          if (grid[y][x] === TILE.FLOOR) return { x, y };
        }
      }
    }
    return { x: 1, y: 1 };
  }
}