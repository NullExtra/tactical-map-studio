import { useState, useCallback, useMemo, useEffect } from 'react';
import { TILE } from './types/map';
import type {
  TileType,
  GridCoordinate,
  ActiveTool,
  AlgorithmType,
  GeneratorType,
  MapSizePreset,
  StudioTheme,
} from './types/map';
import { GridEngine } from './core/GridEngine';
import { Pathfinder } from './core/Pathfinder';
import { ViewportCanvas } from './components/ViewportCanvas';
import { TutorialModal } from './components/TutorialModal';

const SIZE_PRESETS: Record<
  MapSizePreset,
  { width: number; height: number; cellSize: number; label: string }
> = {
  STANDARD: { width: 38, height: 24, cellSize: 25, label: 'Standar (38 x 24)' },
  LARGE: { width: 46, height: 28, cellSize: 22, label: 'Luas (46 x 28)' },
  MASSIVE: { width: 54, height: 32, cellSize: 19, label: 'Masif (54 x 32)' },
};

const THEME_STYLES: Record<
  StudioTheme,
  {
    appBg: string;
    panelBg: string;
    border: string;
    cardBg: string;
    textMain: string;
    textMuted: string;
  }
> = {
  TACTICAL_COMMAND: {
    appBg: 'bg-[#e2e8f0]',
    panelBg: 'bg-white',
    border: 'border-slate-200',
    cardBg: 'bg-slate-50',
    textMain: 'text-slate-800',
    textMuted: 'text-slate-500',
  },
  ROYAL_PARCHMENT: {
    appBg: 'bg-[#dfd7c6]',
    panelBg: 'bg-[#f7f3e8]',
    border: 'border-[#d4c9b4]',
    cardBg: 'bg-[#efe8d8]',
    textMain: 'text-stone-800',
    textMuted: 'text-stone-500',
  },
  ARCHITECT_BLUEPRINT: {
    appBg: 'bg-[#dbeafe]',
    panelBg: 'bg-[#f8fafc]',
    border: 'border-blue-200',
    cardBg: 'bg-blue-50/60',
    textMain: 'text-slate-900',
    textMuted: 'text-slate-600',
  },
};

export function App() {
  const [sizePreset, setSizePreset] = useState<MapSizePreset>('LARGE');
  const [generatorType, setGeneratorType] = useState<GeneratorType>('TACTICAL_ROOMS');

  const currentDim = SIZE_PRESETS[sizePreset];

  const [gridData, setGridData] = useState<TileType[][]>(() => {
    return GridEngine.generateMap(
      currentDim.width,
      currentDim.height,
      'TACTICAL_ROOMS'
    ).grid;
  });

  const [genTimeMs, setGenTimeMs] = useState<number>(0.65);
  const [origin, setOrigin] = useState<GridCoordinate>(() =>
    GridEngine.findFirstWalkable(gridData, false)
  );
  const [waypoint, setWaypoint] = useState<GridCoordinate | null>(null);
  const [target, setTarget] = useState<GridCoordinate>(() =>
    GridEngine.findFirstWalkable(gridData, true)
  );

  // State untuk pergerakan agen secara hidup
  const [agentStepIndex, setAgentStepIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Tab Panel Kiri ('MAP' atau 'AI') agar UI ringkas & peta lebih luas
  const [sidebarTab, setSidebarTab] = useState<'MAP' | 'AI'>('MAP');

  const [activeTool, setActiveTool] = useState<ActiveTool>('BRUSH_WALL');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('ASTAR');
  const [allowDiagonal, setAllowDiagonal] = useState<boolean>(false);
  const [theme, setTheme] = useState<StudioTheme>('TACTICAL_COMMAND');

  const [showVisited, setShowVisited] = useState<boolean>(true);
  const [showFogOfWar, setShowFogOfWar] = useState<boolean>(false);
  const [fovRadius, setFovRadius] = useState<number>(8);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  const pathResult = useMemo(() => {
    return Pathfinder.computeCompleteRoute(
      gridData,
      origin,
      target,
      waypoint,
      algorithm,
      allowDiagonal
    );
  }, [gridData, origin, target, waypoint, algorithm, allowDiagonal]);

  const walkableRatio = useMemo(() => {
    return GridEngine.calculateWalkableRatio(gridData);
  }, [gridData]);

  // Reset indeks agen jika rute berubah
  useEffect(() => {
    setAgentStepIndex(0);
    setIsSimulating(false);
  }, [pathResult.path]);

  // Loop animasi pergerakan agen sepanjang jalur
  useEffect(() => {
    if (!isSimulating || pathResult.path.length <= 1) return;

    const timer = window.setInterval(() => {
      setAgentStepIndex(prev => {
        if (prev >= pathResult.path.length - 1) {
          setIsSimulating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 110);

    return () => window.clearInterval(timer);
  }, [isSimulating, pathResult.path]);

  const currentAgentPos =
    pathResult.path[agentStepIndex] || origin;

  const triggerGenerateMap = (
    preset: MapSizePreset = sizePreset,
    genType: GeneratorType = generatorType
  ) => {
    const dim = SIZE_PRESETS[preset];
    const result = GridEngine.generateMap(dim.width, dim.height, genType);
    const newOrigin = GridEngine.findFirstWalkable(result.grid, false);
    const newTarget = GridEngine.findFirstWalkable(result.grid, true);

    setGridData(result.grid);
    setOrigin(newOrigin);
    setWaypoint(null);
    setTarget(newTarget);
    setGenTimeMs(result.executionTimeMs);
  };

  const handleSizeChange = (newPreset: MapSizePreset) => {
    setSizePreset(newPreset);
    triggerGenerateMap(newPreset, generatorType);
  };

  const handleClearMap = () => {
    const empty = GridEngine.createEmptyGrid(
      currentDim.width,
      currentDim.height,
      TILE.FLOOR
    );
    setGridData(empty);
    setWaypoint(null);
    setGenTimeMs(0.05);
  };

  const handleCellInteract = useCallback(
    (x: number, y: number) => {
      if (activeTool === 'SET_ORIGIN') {
        if (gridData[y][x] !== TILE.WALL) setOrigin({ x, y });
        return;
      }
      if (activeTool === 'SET_WAYPOINT') {
        if (gridData[y][x] !== TILE.WALL) setWaypoint({ x, y });
        return;
      }
      if (activeTool === 'SET_TARGET') {
        if (gridData[y][x] !== TILE.WALL) setTarget({ x, y });
        return;
      }

      setGridData(prev => {
        if (
          (x === origin.x && y === origin.y) ||
          (x === target.x && y === target.y) ||
          (waypoint && x === waypoint.x && y === waypoint.y)
        ) {
          return prev;
        }

        let nextTile: TileType = TILE.FLOOR;
        if (activeTool === 'BRUSH_WALL') nextTile = TILE.WALL;
        else if (activeTool === 'BRUSH_CHOKEPOINT') nextTile = TILE.CHOKEPOINT;
        else if (activeTool === 'BRUSH_WATER') nextTile = TILE.WATER;

        if (prev[y][x] === nextTile) return prev;
        const copy = GridEngine.cloneGrid(prev);
        copy[y][x] = nextTile;
        return copy;
      });
    },
    [activeTool, gridData, origin, target, waypoint]
  );

  const handleExportJSON = () => {
    const payload = {
      namaProyek: 'Studio Peta Taktis & Simulasi Navigasi AI',
      skalaPeta: sizePreset,
      generatorAktif: generatorType,
      algoritmaNavigasi: algorithm,
      gerakDiagonal: allowDiagonal,
      koordinatUnit: { awalA: origin, singgahP: waypoint, tujuanB: target },
      totalBebanRute: pathResult.totalCost,
      ruteOptimal: pathResult.path,
      matriksPeta: gridData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level-taktis-${currentDim.width}x${currentDim.height}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ui = THEME_STYLES[theme];

  return (
    <div
      className={`flex flex-col h-screen w-screen ${ui.appBg} ${ui.textMain} font-sans overflow-hidden`}
    >
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Top Studio Bar */}
      <header
        className={`flex items-center justify-between px-5 h-13 ${ui.panelBg} border-b ${ui.border} shadow-sm select-none z-10`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-3.5 h-3.5 rounded-sm bg-sky-600 shadow-sm" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              Studio Arsitektur Level & Navigasi Taktis AI
            </h1>
          </div>
          <span className="hidden md:inline-block px-2 py-0.5 text-[11px] font-semibold bg-sky-100 text-sky-800 rounded">
            Edisi Portofolio Studio
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className={`font-medium hidden sm:inline ${ui.textMuted}`}>
              Skala Kanvas:
            </span>
            <select
              value={sizePreset}
              onChange={e => handleSizeChange(e.target.value as MapSizePreset)}
              className={`px-2.5 py-1.5 rounded border ${ui.border} ${ui.cardBg} font-semibold text-xs cursor-pointer`}
            >
              {Object.entries(SIZE_PRESETS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className={`font-medium hidden sm:inline ${ui.textMuted}`}>
              Tema Visual:
            </span>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value as StudioTheme)}
              className={`px-2.5 py-1.5 rounded border ${ui.border} ${ui.cardBg} font-semibold text-xs cursor-pointer`}
            >
              <option value="TACTICAL_COMMAND">Meja Komando Taktis</option>
              <option value="ROYAL_PARCHMENT">Perkamen Kerajaan</option>
              <option value="ARCHITECT_BLUEPRINT">Cetak Biru Arsitektur</option>
            </select>
          </div>

          <button
            onClick={() => setIsTutorialOpen(true)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
          >
            Panduan Studio
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Ringkas dengan Tab (Lebar w-72 agar Peta Sangat Luas) */}
        <aside
          className={`w-72 shrink-0 ${ui.panelBg} border-r ${ui.border} flex flex-col justify-between select-none overflow-y-auto`}
        >
          <div>
            {/* Navigasi 2 Tab */}
            <div className={`grid grid-cols-2 border-b ${ui.border} p-1.5 gap-1 ${ui.cardBg}`}>
              <button
                onClick={() => setSidebarTab('MAP')}
                className={`py-2 text-xs font-bold rounded transition-all ${
                  sidebarTab === 'MAP'
                    ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Desain Peta
              </button>
              <button
                onClick={() => setSidebarTab('AI')}
                className={`py-2 text-xs font-bold rounded transition-all ${
                  sidebarTab === 'AI'
                    ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Simulasi & AI
              </button>
            </div>

            <div className="p-4 space-y-5">
              {sidebarTab === 'MAP' ? (
                <>
                  {/* Mode Algoritma Generator Peta */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Tipe Generator Prosedural
                    </label>
                    <select
                      value={generatorType}
                      onChange={e => {
                        const nextGen = e.target.value as GeneratorType;
                        setGeneratorType(nextGen);
                        triggerGenerateMap(sizePreset, nextGen);
                      }}
                      className={`w-full px-3 py-2 rounded border ${ui.border} ${ui.cardBg} text-xs font-semibold mb-2.5 cursor-pointer`}
                    >
                      <option value="TACTICAL_ROOMS">
                        Ruangan Taktis & Koridor (BSP)
                      </option>
                      <option value="ORGANIC_CAVES">
                        Gua Organik (Cellular Automata)
                      </option>
                      <option value="BRAIDED_MAZE">
                        Labirin Taktis Bercabang
                      </option>
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => triggerGenerateMap()}
                        className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                      >
                        Buat Peta Baru
                      </button>
                      <button
                        onClick={handleClearMap}
                        className={`px-3 py-2 ${ui.cardBg} hover:bg-slate-200/70 border ${ui.border} rounded text-xs font-semibold transition-colors`}
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  {/* Kuas Medan & Penempatan Token */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Kuas Struktur & Medan
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {(
                        [
                          { id: 'BRUSH_WALL', label: 'Dinding 2.5D' },
                          { id: 'BRUSH_FLOOR', label: 'Lantai Terbuka' },
                          { id: 'BRUSH_WATER', label: 'Medan Air (2x)' },
                          { id: 'BRUSH_CHOKEPOINT', label: 'Pintu Sempit (3x)' },
                        ] as { id: ActiveTool; label: string }[]
                      ).map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id)}
                          className={`px-2.5 py-2 text-left rounded border font-medium transition-all ${
                            activeTool === tool.id
                              ? 'bg-sky-600 border-sky-700 text-white shadow-sm'
                              : `${ui.cardBg} ${ui.border} hover:border-slate-400`
                          }`}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Penempatan Unit Taktis */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Penempatan Titik Unit
                      </label>
                      {waypoint && (
                        <button
                          onClick={() => setWaypoint(null)}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          Hapus Singgah (P)
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {(
                        [
                          { id: 'SET_ORIGIN', label: 'Pindah Agen Awal (A)' },
                          {
                            id: 'SET_WAYPOINT',
                            label: 'Tambah Titik Singgah (P)',
                          },
                          { id: 'SET_TARGET', label: 'Pindah Target Tujuan (B)' },
                        ] as { id: ActiveTool; label: string }[]
                      ).map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id)}
                          className={`w-full px-3 py-2 text-left rounded border font-medium transition-all ${
                            activeTool === tool.id
                              ? 'bg-sky-600 border-sky-700 text-white shadow-sm'
                              : `${ui.cardBg} ${ui.border} hover:border-slate-400`
                          }`}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Pilihan Algoritma AI */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Algoritma Pencarian Rute
                    </label>
                    <div className="space-y-1.5 text-xs">
                      {(
                        [
                          {
                            id: 'ASTAR',
                            name: 'A-Star (A*) Heuristic',
                            desc: 'Cepat & taktis, mencari jalur dengan beban terendah.',
                          },
                          {
                            id: 'DIJKSTRA',
                            name: 'Dijkstra Uniform Cost',
                            desc: 'Menyebar rata ke segala arah dengan bobot medan.',
                          },
                          {
                            id: 'BFS',
                            name: 'Breadth-First Search',
                            desc: 'Mengabaikan beban air/pintu, murni jumlah kotak.',
                          },
                        ] as { id: AlgorithmType; name: string; desc: string }[]
                      ).map(algo => (
                        <button
                          key={algo.id}
                          onClick={() => setAlgorithm(algo.id)}
                          className={`w-full p-2.5 text-left rounded border transition-all ${
                            algorithm === algo.id
                              ? 'bg-sky-50 border-sky-600 text-slate-900'
                              : `${ui.cardBg} ${ui.border} hover:border-slate-400`
                          }`}
                        >
                          <div className="font-semibold">{algo.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {algo.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pengaturan Gerak & Kabut Perang (Raycasting FoV) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Sensor & Pergerakan Agen
                    </label>
                    <div className="space-y-2 text-xs">
                      <label
                        className={`flex items-center justify-between px-3 py-2 rounded border ${ui.border} ${ui.cardBg} cursor-pointer`}
                      >
                        <span className="font-medium">Izinkan Gerak Diagonal (8 Arah)</span>
                        <input
                          type="checkbox"
                          checked={allowDiagonal}
                          onChange={e => setAllowDiagonal(e.target.checked)}
                          className="accent-sky-600 w-4 h-4"
                        />
                      </label>

                      <label
                        className={`flex items-center justify-between px-3 py-2 rounded border ${ui.border} ${ui.cardBg} cursor-pointer`}
                      >
                        <span className="font-medium">Kabut Pandangan (2D Raycast)</span>
                        <input
                          type="checkbox"
                          checked={showFogOfWar}
                          onChange={e => setShowFogOfWar(e.target.checked)}
                          className="accent-sky-600 w-4 h-4"
                        />
                      </label>

                      {showFogOfWar && (
                        <div className={`p-2.5 rounded border ${ui.border} ${ui.cardBg}`}>
                          <div className="flex justify-between text-[11px] font-semibold mb-1">
                            <span>Radius Pandangan Agen:</span>
                            <span>{fovRadius} Kotak</span>
                          </div>
                          <input
                            type="range"
                            min={4}
                            max={16}
                            value={fovRadius}
                            onChange={e => setFovRadius(Number(e.target.value))}
                            className="w-full accent-sky-600 cursor-pointer"
                          />
                        </div>
                      )}

                      <label
                        className={`flex items-center justify-between px-3 py-2 rounded border ${ui.border} ${ui.cardBg} cursor-pointer`}
                      >
                        <span className="font-medium">Tampilkan Area Pikiran AI</span>
                        <input
                          type="checkbox"
                          checked={showVisited}
                          onChange={e => setShowVisited(e.target.checked)}
                          className="accent-sky-600 w-4 h-4"
                        />
                      </label>

                      <label
                        className={`flex items-center justify-between px-3 py-2 rounded border ${ui.border} ${ui.cardBg} cursor-pointer`}
                      >
                        <span className="font-medium">Tampilkan Angka Koordinat</span>
                        <input
                          type="checkbox"
                          checked={showCoordinates}
                          onChange={e => setShowCoordinates(e.target.checked)}
                          className="accent-sky-600 w-4 h-4"
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Metrik Performa Selalu Tampil di Bawah */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Telemetri Performa Real-Time
                </label>
                <div
                  className={`p-3 rounded border ${ui.border} ${ui.cardBg} text-xs space-y-1.5`}
                >
                  <div className="flex justify-between">
                    <span className={ui.textMuted}>Waktu Buat Peta:</span>
                    <span className="font-mono font-semibold">{genTimeMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={ui.textMuted}>Waktu Hitung AI:</span>
                    <span className="font-mono font-semibold">
                      {pathResult.executionTimeMs} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={ui.textMuted}>Kotak Diperiksa:</span>
                    <span className="font-mono font-semibold text-sky-700">
                      {pathResult.visited.length} kotak
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={ui.textMuted}>Total Beban Langkah:</span>
                    <span className="font-mono font-semibold">
                      {pathResult.totalCost} poin
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={ui.textMuted}>Area Terbuka:</span>
                    <span className="font-mono font-semibold">{walkableRatio}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Ekspor JSON */}
          <div className={`p-3.5 border-t ${ui.border} ${ui.cardBg}`}>
            <button
              onClick={handleExportJSON}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold tracking-wide shadow-sm transition-colors"
            >
              Unduh Data Level (.JSON)
            </button>
          </div>
        </aside>

        {/* Kanvas Utama yang Mendominasi Layar */}
        <ViewportCanvas
          grid={gridData}
          origin={origin}
          waypoint={waypoint}
          target={target}
          agentPos={currentAgentPos}
          isSimulating={isSimulating}
          path={pathResult.path}
          visited={pathResult.visited}
          activeTool={activeTool}
          theme={theme}
          showVisited={showVisited}
          showFogOfWar={showFogOfWar}
          fovRadius={fovRadius}
          showCoordinates={showCoordinates}
          cellSize={currentDim.cellSize}
          onCellInteract={handleCellInteract}
          onToggleSimulation={() => {
            if (agentStepIndex >= pathResult.path.length - 1) {
              setAgentStepIndex(0);
            }
            setIsSimulating(prev => !prev);
          }}
          onResetSimulation={() => {
            setIsSimulating(false);
            setAgentStepIndex(0);
          }}
        />
      </div>
    </div>
  );
}

export default App;