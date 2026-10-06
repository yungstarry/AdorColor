import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  Unlock, 
  X, 
  Plus, 
  Shuffle, 
  Undo2, 
  Redo2, 
  Bookmark, 
  Copy, 
  Eye, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { Palette, PaletteColor } from '../../types';
import { 
  buildPaletteColor, 
  getRandomHex, 
  generateHarmonicColors, 
  isLightColor 
} from '../../utils/colorUtils';

interface PaletteGeneratorWorkspaceProps {
  initialPalette?: Palette | null;
  onSavePalette: (palette: Palette) => void;
  onOpenInVisualizer: (palette: Palette) => void;
  onOpenInContrast?: (paletteOrColor1: Palette | string, color2?: string) => void;
  onToast: (msg: string) => void;
}

export const PaletteGeneratorWorkspace: React.FC<PaletteGeneratorWorkspaceProps> = ({
  initialPalette,
  onSavePalette,
  onOpenInVisualizer,
  onOpenInContrast,
  onToast,
}) => {
  const [colors, setColors] = useState<PaletteColor[]>(() => {
    if (initialPalette && initialPalette.colors.length > 0) {
      return initialPalette.colors.map((c) => ({ ...c, locked: false }));
    }
    const saved = localStorage.getItem('palettelab_studio_colors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      buildPaletteColor('#264653'),
      buildPaletteColor('#2A9D8F'),
      buildPaletteColor('#E9C46A'),
      buildPaletteColor('#F4A261'),
      buildPaletteColor('#E76F51'),
    ];
  });

  const [history, setHistory] = useState<PaletteColor[][]>([]);
  const [redoStack, setRedoStack] = useState<PaletteColor[][]>([]);
  const [paletteTitle, setPaletteTitle] = useState(() => {
    if (initialPalette?.name) return initialPalette.name;
    return localStorage.getItem('palettelab_studio_title') || 'Untitled Workspace';
  });
  const [harmonyMode, setHarmonyMode] = useState<
    'random' | 'analogous' | 'monochromatic' | 'triadic' | 'complementary'
  >(() => {
    const saved = localStorage.getItem('palettelab_studio_harmony');
    return (saved as any) || 'random';
  });
  const [copiedPalette, setCopiedPalette] = useState(false);

  useEffect(() => {
    localStorage.setItem('palettelab_studio_colors', JSON.stringify(colors));
  }, [colors]);

  useEffect(() => {
    localStorage.setItem('palettelab_studio_title', paletteTitle);
  }, [paletteTitle]);

  useEffect(() => {
    localStorage.setItem('palettelab_studio_harmony', harmonyMode);
  }, [harmonyMode]);

  const handleCopyPalette = () => {
    const hexList = colors.map((c) => c.hex).join(', ');
    navigator.clipboard.writeText(hexList);
    setCopiedPalette(true);
    onToast(`Copied palette (${colors.length} colors): ${hexList}`);
    setTimeout(() => setCopiedPalette(false), 1800);
  };

  useEffect(() => {
    if (initialPalette) {
      setColors(initialPalette.colors.map((c) => ({ ...c, locked: false })));
      setPaletteTitle(initialPalette.name);
    }
  }, [initialPalette]);

  const generateNewColors = useCallback(() => {
    setHistory((prev) => [...prev, colors]);
    setRedoStack([]);

    if (harmonyMode === 'random') {
      setColors((prev) =>
        prev.map((c) => (c.locked ? c : buildPaletteColor(getRandomHex(), false)))
      );
    } else {
      const base = colors.find((c) => c.locked) || colors[0];
      const newHexes = generateHarmonicColors(base.hex, harmonyMode, colors.length);

      setColors((prev) =>
        prev.map((c, i) => (c.locked ? c : buildPaletteColor(newHexes[i] || getRandomHex(), false)))
      );
    }
    onToast('Generated new palette variation!');
  }, [colors, harmonyMode, onToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        generateNewColors();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generateNewColors]);

  const toggleLock = (index: number) => {
    setColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  };

  const removeColor = (index: number) => {
    if (colors.length <= 2) {
      onToast('Palettes need at least 2 colors');
      return;
    }
    setHistory((prev) => [...prev, colors]);
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  const addColor = (insertIndex: number) => {
    if (colors.length >= 10) {
      onToast('Maximum 10 colors reached');
      return;
    }
    setHistory((prev) => [...prev, colors]);
    const newColor = buildPaletteColor(getRandomHex(), false);
    const updated = [...colors];
    updated.splice(insertIndex + 1, 0, newColor);
    setColors(updated);
  };

  const moveColor = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= colors.length) return;
    const updated = [...colors];
    const item = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, item);
    setColors(updated);
  };

  const updateColorHex = (index: number, newHex: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
      setColors((prev) =>
        prev.map((c, i) => (i === index ? buildPaletteColor(newHex, c.locked) : c))
      );
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, colors]);
    setColors(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, colors]);
    setColors(next);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  const handleSave = () => {
    const palette: Palette = {
      id: `custom-${Date.now()}`,
      name: paletteTitle || 'Custom Palette',
      colors,
      tags: ['Workspace', 'Custom'],
      styles: [`${colors.length} Colors`],
      topics: ['Design'],
      creator: {
        id: 'me',
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      },
      likes: 1,
      views: 1,
      createdAt: new Date().toISOString(),
      isPublic: false,
    };
    onSavePalette(palette);
    onToast(`"${palette.name}" saved to library!`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-white select-none">
      {/* Workspace Top Toolbar */}
      <div className="h-14 border-b border-gray-200 px-4 md:px-8 flex items-center justify-between gap-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={paletteTitle}
            onChange={(e) => setPaletteTitle(e.target.value)}
            className="font-bold text-gray-900 text-sm md:text-base border-b border-transparent hover:border-gray-300 focus:border-blue-600 focus:outline-none px-1 py-0.5"
            placeholder="Palette title..."
          />

          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 pl-2">
            <span>Press</span>
            <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono text-[10px] font-bold">
              Spacebar
            </kbd>
            <span>to generate</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-600">
            <span className="font-semibold text-gray-400 uppercase text-[10px]">Harmony:</span>
            <select
              value={harmonyMode}
              onChange={(e) => setHarmonyMode(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-blue-500 cursor-pointer"
            >
              <option value="random">Dynamic Freeform</option>
              <option value="analogous">Analogous</option>
              <option value="monochromatic">Monochromatic</option>
              <option value="triadic">Triadic</option>
              <option value="complementary">Complementary</option>
            </select>
          </div>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-gray-200" />
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={generateNewColors}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>

          <button
            onClick={handleCopyPalette}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
            title="Copy entire palette HEX codes"
          >
            {copiedPalette ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{copiedPalette ? 'Copied!' : 'Copy Palette'}</span>
          </button>

          <button
            onClick={() =>
              onOpenInVisualizer({
                id: 'ws-preview',
                name: paletteTitle,
                colors,
                tags: [],
                styles: [],
                topics: [],
                creator: { id: 'me', name: 'You', avatar: '' },
                likes: 0,
                views: 0,
                createdAt: '',
                isPublic: false,
              })
            }
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Preview</span>
          </button>

          {onOpenInContrast && (
            <button
              onClick={() => {
                const paletteObj: Palette = {
                  id: 'ws-contrast',
                  name: paletteTitle || 'Workspace Palette',
                  colors,
                  tags: [],
                  styles: [],
                  topics: [],
                  creator: { id: 'me', name: 'You', avatar: '' },
                  likes: 0,
                  views: 0,
                  createdAt: '',
                  isPublic: false,
                };
                onOpenInContrast(paletteObj);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer"
              title="Check color contrast accessibility for this palette"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Check Contrast</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Color Columns Workstation */}
      <div className="flex-1 flex flex-col sm:flex-row w-full overflow-hidden">
        {colors.map((color, index) => {
          const isLight = isLightColor(color.hex);
          const textColor = isLight ? 'text-gray-900' : 'text-white';
          const secondaryTextColor = isLight ? 'text-gray-700/80' : 'text-white/80';
          const buttonBg = isLight
            ? 'bg-black/10 hover:bg-black/20 text-gray-900'
            : 'bg-white/20 hover:bg-white/30 text-white';

          return (
            <div
              key={index}
              style={{ backgroundColor: color.hex }}
              className="flex-1 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300 relative group"
            >
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  {index > 0 && (
                    <button
                      onClick={() => moveColor(index, 'left')}
                      className={`p-1.5 rounded-full ${buttonBg} opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                      title="Move left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {index < colors.length - 1 && (
                    <button
                      onClick={() => moveColor(index, 'right')}
                      className={`p-1.5 rounded-full ${buttonBg} opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                      title="Move right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleLock(index)}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      color.locked
                        ? isLight
                          ? 'bg-black text-white shadow-md'
                          : 'bg-white text-black shadow-md'
                        : `${buttonBg} opacity-80 group-hover:opacity-100`
                    }`}
                    title={color.locked ? 'Unlock color' : 'Lock color'}
                  >
                    {color.locked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </button>

                  {colors.length > 2 && (
                    <button
                      onClick={() => removeColor(index)}
                      className={`p-2 rounded-xl ${buttonBg} opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                      title="Remove color"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {index < colors.length - 1 && colors.length < 10 && (
                <button
                  onClick={() => addColor(index)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-white text-gray-900 border border-gray-300 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-125 transition-all z-20 cursor-pointer"
                  title="Insert color here"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="flex flex-col items-center text-center space-y-3 z-10">
                <div>
                  <input
                    type="text"
                    value={color.hex}
                    onChange={(e) => updateColorHex(index, e.target.value)}
                    className={`font-mono font-extrabold text-xl sm:text-2xl tracking-wider text-center uppercase bg-transparent border-b border-transparent hover:border-current focus:border-current focus:outline-none ${textColor}`}
                  />
                  <p className={`text-xs font-medium tracking-wide mt-1 uppercase ${secondaryTextColor}`}>
                    {color.name}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(color.hex);
                      onToast(`${color.hex} copied!`);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 ${buttonBg} cursor-pointer transition-colors`}
                    title="Copy HEX"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>

                  {onOpenInContrast && (
                    <button
                      onClick={() => {
                        const otherHex = index === 0 ? colors[1]?.hex || '#FFFFFF' : colors[0]?.hex || '#000000';
                        onOpenInContrast(color.hex, otherHex);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 ${buttonBg} cursor-pointer transition-colors`}
                      title={`Check contrast of ${color.hex}`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Contrast</span>
                    </button>
                  )}

                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColorHex(index, e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer opacity-90 hover:opacity-100 border-0 p-0"
                    title="Fine tune color"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
