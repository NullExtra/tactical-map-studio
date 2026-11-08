import React, { useRef, useEffect, useState, useMemo } from 'react';
import { TILE } from '../types/map';
import type {
  TileType,
  GridCoordinate,
  ActiveTool,
  StudioTheme,
} from '../types/map';
import { GridEngine } from '../core/GridEngine';

interface ViewportCanvasProps {
  grid: TileType[][];
  origin: GridCoordinate;
  waypoint: GridCoordinate | null;
  target: GridCoordinate;
  agentPos: GridCoordinate;
  isSimulating: boolean;
  path: GridCoordinate[];
  visited: GridCoordinate[];
  activeTool: ActiveTool;
  theme: StudioTheme;
  showVisited: boolean;
  showFogOfWar: boolean;
  fovRadius: number;
  showCoordinates: boolean;
  cellSize: number;
  onCellInteract: (x: number, y: number) => void;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
}

const THEME_PALETTES: Record<
  StudioTheme,
  {
    wallTop: string;
    wallFront: string;
    wallHighlight: string;
    floorEven: string;
    floorOdd: string;
    gridLine: string;
    visitedFill: string;
    chokepointFill: string;
    chokepointBorder: string;
    waterFill: string;
    waterWave: string;
    pathStroke: string;
    pathGlow: string;
    fogColor: string;
  }
> = {
  TACTICAL_COMMAND: {
    wallTop: '#334155',
    wallFront: '#1e293b',
    wallHighlight: '#475569',
    floorEven: '#f8fafc',
    floorOdd: '#f1f5f9',
    gridLine: '#e2e8f0',
    visitedFill: 'rgba(14, 165, 233, 0.18)',
    chokepointFill: '#fef3c7',
    chokepointBorder: '#d97706',
    waterFill: '#bae6fd',
    waterWave: '#0284c7',
    pathStroke: '#0284c7',
    pathGlow: 'rgba(2, 132, 199, 0.25)',
    fogColor: 'rgba(15, 23, 42, 0.72)',
  },
  ROYAL_PARCHMENT: {
    wallTop: '#574c41',
    wallFront: '#383028',
    wallHighlight: '#786a5c',
    floorEven: '#fbf7ef',
    floorOdd: '#f4ede0',
    gridLine: '#e6decb',
    visitedFill: 'rgba(180, 83, 9, 0.16)',
    chokepointFill: '#fde68a',
    chokepointBorder: '#b45309',
    waterFill: '#a7f3d0',
    waterWave: '#0d9488',
    pathStroke: '#b91c1c',
    pathGlow: 'rgba(185, 28, 28, 0.22)',
    fogColor: 'rgba(41, 37, 36, 0.72)',
  },
  ARCHITECT_BLUEPRINT: {
    wallTop: '#1e3a8a',
    wallFront: '#172554',
    wallHighlight: '#3b82f6',
    floorEven: '#eff6ff',
    floorOdd: '#e0f2fe',
    gridLine: '#bae6fd',
    visitedFill: 'rgba(37, 99, 235, 0.15)',
    chokepointFill: '#fef08a',
    chokepointBorder: '#ca8a04',
    waterFill: '#93c5fd',
    waterWave: '#1d4ed8',
    pathStroke: '#dc2626',
    pathGlow: 'rgba(220, 38, 38, 0.22)',
    fogColor: 'rgba(23, 37, 84, 0.72)',
  },
};

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  grid,
  origin,
  waypoint,
  target,
  agentPos,
  isSimulating,
  path,
  visited,
  theme,
  showVisited,
  showFogOfWar,
  fovRadius,
  showCoordinates,
  cellSize,
  onCellInteract,
  onToggleSimulation,
  onResetSimulation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hoverCoord, setHoverCoord] = useState<GridCoordinate | null>(null);

  const height = grid.length;
  const width = grid[0]?.length || 0;
  const palette = THEME_PALETTES[theme];

  // Kalkulasi Field of View dari posisi agen saat ini
  const visibleCells = useMemo(() => {
    if (!showFogOfWar) return null;
    return GridEngine.computeFieldOfView(grid, agentPos, fovRadius);
  }, [grid, agentPos, showFogOfWar, fovRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Render Lantai Dasar & Medan Taktis
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = grid[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        if (tile !== TILE.WALL) {
          const isEven = (x + y) % 2 === 0;
          ctx.fillStyle = isEven ? palette.floorEven : palette.floorOdd;
          ctx.fillRect(px, py, cellSize, cellSize);

          // Bayangan jatuh (Drop Shadow) jika kotak di atasnya adalah dinding
          if (y > 0 && grid[y - 1][x] === TILE.WALL) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
            ctx.fillRect(px, py, cellSize, Math.max(3, Math.floor(cellSize * 0.22)));
          }

          if (tile === TILE.WATER) {
            ctx.fillStyle = palette.waterFill;
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = palette.waterWave;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(px + 4, py + cellSize * 0.4);
            ctx.lineTo(px + cellSize - 4, py + cellSize * 0.4);
            ctx.moveTo(px + 6, py + cellSize * 0.68);
            ctx.lineTo(px + cellSize - 6, py + cellSize * 0.68);
            ctx.stroke();
          } else if (tile === TILE.CHOKEPOINT) {
            ctx.fillStyle = palette.chokepointFill;
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = palette.chokepointBorder;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 3, py + 3, cellSize - 6, cellSize - 6);
          }

          ctx.strokeStyle = palette.gridLine;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }
      }
    }

    // 2. Render Area Eksplorasi AI (Visited Nodes)
    if (showVisited && visited.length > 0) {
      ctx.fillStyle = palette.visitedFill;
      for (const v of visited) {
        if (grid[v.y]?.[v.x] !== TILE.WALL) {
          ctx.fillRect(
            v.x * cellSize + 1,
            v.y * cellSize + 1,
            cellSize - 2,
            cellSize - 2
          );
        }
      }
    }

    // 3. Render Blok Dinding 2.5D dengan Bevel Atas
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === TILE.WALL) {
          const px = x * cellSize;
          const py = y * cellSize;
          const depth = Math.max(3, Math.floor(cellSize * 0.22));

          ctx.fillStyle = palette.wallFront;
          ctx.fillRect(px, py, cellSize, cellSize);

          ctx.fillStyle = palette.wallTop;
          ctx.fillRect(px, py, cellSize, cellSize - depth);

          ctx.fillStyle = palette.wallHighlight;
          ctx.fillRect(px, py, cellSize, 1.5);
        }
      }
    }

    // 4. Render Garis Rute Taktis dengan Efek Glow
    if (path.length > 1) {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const cx = path[i].x * cellSize + cellSize / 2;
        const cy = path[i].y * cellSize + cellSize / 2;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = palette.pathGlow;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = palette.pathStroke;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Titik langkah di sepanjang garis rute
      for (let i = 1; i < path.length - 1; i++) {
        const cx = path[i].x * cellSize + cellSize / 2;
        const cy = path[i].y * cellSize + cellSize / 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = palette.pathStroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // 5. Render Kabut Pandangan (2D Raycasting Fog of War)
    if (showFogOfWar && visibleCells) {
      ctx.fillStyle = palette.fogColor;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!visibleCells.has(`${x},${y}`)) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
      // Lingkaran batas radar pandangan
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(
        agentPos.x * cellSize + cellSize / 2,
        agentPos.y * cellSize + cellSize / 2,
        fovRadius * cellSize,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();
    }

    // 6. Fungsi Penggambar Token Unit Game (A, P, B)
    const drawUnitToken = (
      coord: GridCoordinate,
      label: string,
      bgColor: string,
      ringColor: string
    ) => {
      const cx = coord.x * cellSize + cellSize / 2;
      const cy = coord.y * cellSize + cellSize / 2;
      const r = Math.max(7, cellSize * 0.38);

      ctx.fillStyle = ringColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(9, Math.floor(cellSize * 0.46))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy + 0.5);
    };

    // Gambar posisi awal A (transparan jika agen sedang berjalan)
    if (agentPos.x !== origin.x || agentPos.y !== origin.y) {
      drawUnitToken(origin, 'A', 'rgba(2, 132, 199, 0.45)', 'rgba(56, 189, 248, 0.2)');
    }
    if (waypoint) {
      drawUnitToken(waypoint, 'P', '#d97706', 'rgba(251, 191, 36, 0.35)');
    }
    drawUnitToken(target, 'B', '#e11d48', 'rgba(251, 113, 133, 0.35)');
    drawUnitToken(agentPos, 'A', '#0284c7', 'rgba(56, 189, 248, 0.45)');

    // 7. Indikator Hover Kursor
    if (hoverCoord) {
      const hx = hoverCoord.x * cellSize;
      const hy = hoverCoord.y * cellSize;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
    }

    // 8. Angka Koordinat
    if (showCoordinates) {
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          if (grid[y][x] !== TILE.WALL) {
            ctx.fillText(`${x},${y}`, x * cellSize + 2, y * cellSize + 2);
          }
        }
      }
    }
  }, [
    grid,
    origin,
    waypoint,
    target,
    agentPos,
    path,
    visited,
    hoverCoord,
    showVisited,
    showFogOfWar,
    visibleCells,
    fovRadius,
    showCoordinates,
    cellSize,
    height,
    width,
    palette,
  ]);

  const getCellFromEvent = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): GridCoordinate | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      return { x, y };
    }
    return null;
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden select-none">
      {/* Bar Kontrol Simulasi di Atas Kanvas */}
      <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-white/90 backdrop-blur-sm border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSimulation}
            disabled={path.length <= 1}
            className={`px-4 py-1.5 rounded text-xs font-semibold transition-all shadow-sm ${
              isSimulating
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40'
            }`}
          >
            {isSimulating ? 'Jeda Pergerakan Agen' : 'Jalankan Simulasi Agen (A ke B)'}
          </button>

          <button
            onClick={onResetSimulation}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold transition-colors"
          >
            Reset Posisi Agen
          </button>

          <span className="text-xs text-slate-500 hidden xl:inline">
            | Klik atau seret kursor langsung di atas peta untuk memodifikasi rintangan
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-mono font-semibold text-slate-700">
            Posisi Agen: [{agentPos.x}, {agentPos.y}]
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-mono font-semibold text-slate-700">
            Kursor: {hoverCoord ? `[${hoverCoord.x}, ${hoverCoord.y}]` : '[-, -]'}
          </span>
        </div>
      </div>

      {/* Area Kanvas Utama yang Luas */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl overflow-hidden">
          <canvas
            ref={canvasRef}
            width={width * cellSize}
            height={height * cellSize}
            onMouseDown={e => {
              setIsMouseDown(true);
              const c = getCellFromEvent(e);
              if (c) onCellInteract(c.x, c.y);
            }}
            onMouseMove={e => {
              const c = getCellFromEvent(e);
              setHoverCoord(c);
              if (isMouseDown && c) onCellInteract(c.x, c.y);
            }}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => {
              setIsMouseDown(false);
              setHoverCoord(null);
            }}
            className="block cursor-crosshair"
          />
        </div>
      </div>

      {/* Footer Legenda Taktis di Bawah Kanvas */}
      <div className="flex flex-wrap items-center justify-between px-5 py-2 bg-white border-t border-slate-200 text-xs text-slate-600 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded-full bg-sky-600 text-white font-bold text-[9px] flex items-center justify-center">
              A
            </span>
            <span>Agen Awal</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded-full bg-amber-600 text-white font-bold text-[9px] flex items-center justify-center">
              P
            </span>
            <span>Titik Singgah (Opsional)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center">
              B
            </span>
            <span>Target Tujuan</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-slate-700 inline-block" />
            <span>Dinding 2.5D</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-sky-200 border border-sky-600 inline-block" />
            <span>Medan Air (2x Beban)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-100 border border-amber-600 inline-block" />
            <span>Pintu Sempit (3x Beban)</span>
          </div>
        </div>

        <div>
          Status Navigasi:{' '}
          {path.length > 0 ? (
            <strong className="text-emerald-600">
              Rute Aktif ({path.length - 1} Langkah)
            </strong>
          ) : (
            <strong className="text-rose-600">Jalur Terputus / Terhalang</strong>
          )}
        </div>
      </div>
    </div>
  );
};