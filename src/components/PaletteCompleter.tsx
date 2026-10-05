import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Wand2, 
  Shuffle, 
  Bookmark, 
  Copy, 
  Check, 
  Eye, 
  Download, 
  Lock,
  SlidersHorizontal
} from 'lucide-react';
import { Palette, PaletteColor } from '../types';
import { 
  buildPaletteColor, 
  hexToRgb, 
  rgbToHex, 
  rgbToHsl, 
  hslToRgb, 
  isLightColor, 
  generateSvgDataUrl 
} from '../utils/colorUtils';

interface PaletteCompleterProps {
  onOpenInVisualizer: (palette: Palette) => void;
  onOpenInGenerator: (palette: Palette) => void;
  onOpenSaveModal: (palette: Palette) => void;
  onOpenInContrast?: (palette: Palette) => void;
  onToast: (msg: string) => void;
}

type CompletionMode = 
  | 'smart'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'golden'
  | 'monochromatic';

export const PaletteCompleter: React.FC<PaletteCompleterProps> = ({
  onOpenInVisualizer,
  onOpenInGenerator,
  onOpenSaveModal,
  onOpenInContrast,
  onToast,
}) => {
  const [seedColors, setSeedColors] = useState<string[]>(() => {
    const saved = localStorage.getItem('palettelab_completer_seeds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return ['#264653', '#E9C46A'];
  });

  const [targetCount, setTargetCount] = useState<number>(() => {
    const saved = localStorage.getItem('palettelab_completer_count');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [completionMode, setCompletionMode] = useState<CompletionMode>(() => {
    const saved = localStorage.getItem('palettelab_completer_mode');
    return (saved as CompletionMode) || 'smart';
  });

  const [completedPalette, setCompletedPalette] = useState<PaletteColor[]>(() => {
    const saved = localStorage.getItem('palettelab_completer_palette');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      buildPaletteColor('#264653', true),
      buildPaletteColor('#E9C46A', true),
      buildPaletteColor('#2A9D8F', false),
      buildPaletteColor('#F4A261', false),
      buildPaletteColor('#E76F51', false),
    ];
  });
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    localStorage.setItem('palettelab_completer_seeds', JSON.stringify(seedColors));
  }, [seedColors]);

  useEffect(() => {
    localStorage.setItem('palettelab_completer_count', targetCount.toString());
  }, [targetCount]);

  useEffect(() => {
    localStorage.setItem('palettelab_completer_mode', completionMode);
  }, [completionMode]);

  useEffect(() => {
    localStorage.setItem('palettelab_completer_palette', JSON.stringify(completedPalette));
  }, [completedPalette]);

  const [isRegenerating, setIsRegenerating] = useState(false);

  const generateCompletedPalette = (
    seeds = seedColors,
    count = targetCount,
    mode = completionMode,
    userTriggered = true
  ) => {
    if (seeds.length === 0) return;

    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 300);

    const lockedColors: PaletteColor[] = seeds.map((hex) => buildPaletteColor(hex, true));
    const needed = Math.max(0, count - lockedColors.length);

    if (needed === 0) {
      setCompletedPalette(lockedColors.slice(0, count));
      if (userTriggered) onToast(`Palette trimmed to ${count} seed colors.`);
      return;
    }

    const firstRgb = hexToRgb(seeds[0]);
    const firstHsl = rgbToHsl(firstRgb.r, firstRgb.g, firstRgb.b);

    const secondRgb = seeds[1] ? hexToRgb(seeds[1]) : null;
    const secondHsl = secondRgb ? rgbToHsl(secondRgb.r, secondRgb.g, secondRgb.b) : null;

    const generatedHexes: string[] = [];
    const jitter = (range: number) => (Math.random() - 0.5) * range;
    const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const variantIndex = Math.floor(Math.random() * 5);

    for (let i = 0; i < needed; i++) {
      let h = firstHsl.h;
      let s = firstHsl.s;
      let l = firstHsl.l;

      if (mode === 'smart') {
        if (secondHsl) {
          const t = (i + 1) / (needed + 1);
          const hueDelta = ((secondHsl.h - firstHsl.h + 540) % 360) - 180;

          if (variantIndex === 0) {
            const angleOffset = i === needed - 1 ? randomChoice([180, 150, 210, -30, 30]) : jitter(15);
            h = (firstHsl.h + hueDelta * t + angleOffset + 360) % 360;
            s = Math.max(25, Math.min(92, Math.round(firstHsl.s * (1 - t) + secondHsl.s * t + jitter(16))));
            l = Math.max(18, Math.min(88, Math.round(18 + t * 65 + jitter(10))));
          } else if (variantIndex === 1) {
            const midHue = (firstHsl.h + hueDelta * 0.5 + 360) % 360;
            const splitOffset = (i % 2 === 0 ? 150 : 210) + (i * 25) + jitter(20);
            h = (midHue + splitOffset + 360) % 360;
            s = Math.max(30, Math.min(92, Math.round(55 + jitter(25))));
            l = Math.max(20, Math.min(85, Math.round(22 + ((i + 1) / needed) * 58 + jitter(8))));
          } else if (variantIndex === 2) {
            const triadBase = (i % 2 === 0 ? 120 : 240) + jitter(25);
            h = (firstHsl.h + triadBase + 360) % 360;
            s = Math.max(35, Math.min(95, Math.round(firstHsl.s + jitter(20))));
            l = Math.max(18, Math.min(88, Math.round(20 + ((i + 1) / (needed + 1)) * 62 + jitter(12))));
          } else if (variantIndex === 3) {
            const goldenStep = (137.5 * (i + 1) + jitter(20) + (Math.random() * 60)) % 360;
            h = (firstHsl.h + goldenStep + 360) % 360;
            s = Math.max(30, Math.min(90, Math.round((firstHsl.s + secondHsl.s) / 2 + jitter(20))));
            l = Math.max(20, Math.min(86, Math.round(24 + ((i + 1) / needed) * 56 + jitter(8))));
          } else {
            const tetradOffset = (i * 90 + 45 + jitter(20)) % 360;
            h = (firstHsl.h + tetradOffset + 360) % 360;
            s = Math.max(30, Math.min(92, Math.round(60 + jitter(20))));
            l = Math.max(20, Math.min(85, Math.round(20 + ((i + 1) / (needed + 1)) * 65 + jitter(10))));
          }
        } else {
          const strategies = [
            [150 + jitter(15), 210 + jitter(15), 180 + jitter(15), 30 + jitter(15), 330 + jitter(15)],
            [120 + jitter(18), 240 + jitter(18), 90 + jitter(18), 270 + jitter(18), 180 + jitter(18)],
            [35 + jitter(12), 70 + jitter(12), -35 + jitter(12), -70 + jitter(12), 180 + jitter(15)],
            [137.5 + jitter(12), 275 + jitter(12), 52.5 + jitter(12), 190 + jitter(12), 327.5 + jitter(12)],
            [180 + jitter(15), 45 + jitter(15), 225 + jitter(15), 135 + jitter(15), 315 + jitter(15)]
          ];
          const chosen = strategies[variantIndex % strategies.length];
          const offset = chosen[i % chosen.length];
          h = (firstHsl.h + offset + 360) % 360;
          s = Math.max(25, Math.min(92, Math.round(firstHsl.s + jitter(22))));
          l = Math.max(18, Math.min(88, Math.round(20 + ((i + 1) / (needed + 1)) * 62 + jitter(12))));
        }
      } else if (mode === 'analogous') {
        const step = 20 + (variantIndex * 4) + jitter(6);
        const dir = (variantIndex % 2 === 0 ? 1 : -1);
        const multiplier = i + 1;
        h = (firstHsl.h + (dir * multiplier * step) + jitter(8) + 360) % 360;
        s = Math.max(20, Math.min(95, Math.round(firstHsl.s + jitter(18))));
        l = Math.max(16, Math.min(88, Math.round(22 + (i / needed) * 58 + jitter(10))));
      } else if (mode === 'complementary') {
        const spread = (i - Math.floor(needed / 2)) * (20 + variantIndex * 3);
        h = (firstHsl.h + 180 + spread + jitter(15) + 360) % 360;
        s = Math.max(30, Math.min(92, Math.round(firstHsl.s + jitter(20))));
        l = Math.max(18, Math.min(86, Math.round(20 + ((i + 1) / (needed + 1)) * 64 + jitter(10))));
      } else if (mode === 'triadic') {
        const baseTriad = (i % 2 === 0 ? 120 : 240);
        const phaseShift = (variantIndex * 15) + (i * 18);
        h = (firstHsl.h + baseTriad + phaseShift + jitter(12) + 360) % 360;
        s = Math.max(30, Math.min(92, Math.round(firstHsl.s + jitter(18))));
        l = Math.max(20, Math.min(85, Math.round(24 + (i * 22 + variantIndex * 8) % 55 + jitter(8))));
      } else if (mode === 'golden') {
        const phase = (variantIndex * 35) + jitter(12);
        h = (firstHsl.h + phase + (i + 1) * 137.5 + 360) % 360;
        s = Math.max(30, Math.min(88, Math.round(firstHsl.s + jitter(18))));
        l = Math.max(18, Math.min(86, Math.round(22 + ((i + 1) / (needed + 1)) * 60 + jitter(10))));
      } else if (mode === 'monochromatic') {
        h = (firstHsl.h + jitter(6) + 360) % 360;
        s = Math.max(15, Math.min(90, Math.round(firstHsl.s + jitter(20))));
        const stepLight = 15 + ((i + 1) / (needed + 1)) * 72 + jitter(8);
        l = Math.max(14, Math.min(90, Math.round(stepLight)));
      }

      const rgb = hslToRgb(h, s, l);
      generatedHexes.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }

    const filledColors: PaletteColor[] = generatedHexes.map((hex) => buildPaletteColor(hex, false));
    const fullPalette = [...lockedColors, ...filledColors];
    setCompletedPalette(fullPalette);
    localStorage.setItem('palettelab_completer_palette', JSON.stringify(fullPalette));

    if (userTriggered) {
      onToast(`Regenerated ${needed} harmonic colors for your palette!`);
    }
  };

  const handleUpdateSeedColor = (index: number, newHex: string) => {
    const updated = [...seedColors];
    updated[index] = newHex;
    setSeedColors(updated);
    generateCompletedPalette(updated, targetCount, completionMode);
  };

  const handleAddSeedColor = () => {
    if (seedColors.length >= 4) {
      onToast('Maximum 4 seed colors allowed.');
      return;
    }
    const nextColor = seedColors.length === 1 ? '#F4A261' : '#2A9D8F';
    const updated = [...seedColors, nextColor];
    setSeedColors(updated);
    if (targetCount < updated.length + 1) {
      setTargetCount(updated.length + 1);
    }
    generateCompletedPalette(updated, Math.max(targetCount, updated.length + 1), completionMode);
  };

  const handleRemoveSeedColor = (index: number) => {
    if (seedColors.length <= 1) {
      onToast('You need at least 1 seed color.');
      return;
    }
    const updated = seedColors.filter((_, i) => i !== index);
    setSeedColors(updated);
    generateCompletedPalette(updated, targetCount, completionMode);
  };

  const handleCopySingle = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    onToast(`${hex} copied to clipboard!`);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleCopyAllHexes = () => {
    const hexList = completedPalette.map((c) => c.hex).join(', ');
    navigator.clipboard.writeText(hexList);
    setCopiedAll(true);
    onToast(`Copied ${completedPalette.length} colors: ${hexList}`);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const asPaletteObj = (): Palette => {
    return {
      id: `compl-${Date.now()}`,
      name: `Harmonic Palette (${completedPalette.length} Colors)`,
      colors: completedPalette,
      tags: ['Completed', completionMode, `${completedPalette.length} Colors`],
      styles: [`${completedPalette.length} Colors`, completionMode],
      topics: ['Design System'],
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
  };

  const handleDownloadSvg = () => {
    const dataUrl = generateSvgDataUrl(completedPalette);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `completed-palette-${Date.now()}.svg`;
    a.click();
    onToast('SVG palette downloaded!');
  };

  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barWidth = canvas.width / completedPalette.length;
    completedPalette.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * barWidth, 0, barWidth, canvas.height);

      ctx.fillStyle = isLightColor(c.hex) ? '#111827' : '#FFFFFF';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(c.hex, i * barWidth + barWidth / 2, canvas.height - 45);

      ctx.font = '14px system-ui';
      ctx.fillText(i < seedColors.length ? 'SEED COLOR' : 'COMPLETED', i * barWidth + barWidth / 2, canvas.height - 20);
    });

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `completed-palette-${Date.now()}.png`;
    a.click();
    onToast('PNG palette downloaded!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 select-none">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Wand2 className="w-4 h-4" />
          <span>Intelligent Color Extender</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Palette Completer &amp; Color Fill
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Provide your first 1 or 2 initial colors, select your target palette size, and PaletteLab automatically completes the rest with mathematically harmonic tones.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Initial Seed Colors ({seedColors.length})
              </label>
              {seedColors.length < 4 && (
                <button
                  onClick={handleAddSeedColor}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add another color</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {seedColors.map((hex, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => handleUpdateSeedColor(idx, e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200 p-0 shrink-0"
                    />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Seed Color 0{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={hex}
                        onChange={(e) => handleUpdateSeedColor(idx, e.target.value)}
                        className="font-mono text-xs font-bold text-gray-900 uppercase bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>

                    {seedColors.length > 1 && (
                      <button
                        onClick={() => handleRemoveSeedColor(idx)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove seed color"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Target Palette Size: <span className="text-blue-600 font-extrabold">{targetCount} Colors</span>
                </label>
                <span className="text-[11px] text-gray-400">
                  {Math.max(0, targetCount - seedColors.length)} to be filled
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      const finalNum = Math.max(num, seedColors.length);
                      setTargetCount(finalNum);
                      generateCompletedPalette(seedColors, finalNum, completionMode);
                    }}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetCount === num
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Harmonic Fill Algorithm
              </label>
              <select
                value={completionMode}
                onChange={(e) => {
                  const mode = e.target.value as CompletionMode;
                  setCompletionMode(mode);
                  generateCompletedPalette(seedColors, targetCount, mode);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-blue-500 cursor-pointer"
              >
                <option value="smart">Smart Balance (Perceptual Bridge)</option>
                <option value="analogous">Analogous Flow (Color Wheel Neighbors)</option>
                <option value="complementary">Complementary Anchor &amp; Contrast</option>
                <option value="triadic">Triadic Spectrum (Three-Point Vibrant)</option>
                <option value="golden">Golden Ratio Distribution (Equidistant)</option>
                <option value="monochromatic">Monochromatic Tonal Range (Tints &amp; Shades)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => generateCompletedPalette()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Re-color and fill the remaining slots with new harmonic tones"
              >
                <Shuffle className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Re-color &amp; Fill Remaining {Math.max(0, targetCount - seedColors.length)} Colors</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">
              Completed Harmonious Palette
            </h3>
            <p className="text-xs text-gray-500">
              {seedColors.length} locked seed {seedColors.length === 1 ? 'color' : 'colors'} + {Math.max(0, completedPalette.length - seedColors.length)} filled colors
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateCompletedPalette()}
              className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-700 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Re-color filled colors with new harmonic variations"
            >
              <Shuffle className={`w-3.5 h-3.5 text-blue-600 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Re-color Palette</span>
            </button>

            <button
              onClick={handleCopyAllHexes}
              className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
              <span>{copiedAll ? 'Copied Palette!' : 'Copy Palette'}</span>
            </button>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full flex rounded-2xl overflow-hidden shadow-md border border-gray-200">
          {completedPalette.map((color, idx) => {
            const isSeed = idx < seedColors.length;
            const isLight = isLightColor(color.hex);
            const textColor = isLight ? 'text-gray-900' : 'text-white';
            const badgeBg = isLight ? 'bg-black/15 text-gray-900' : 'bg-white/25 text-white';

            return (
              <div
                key={idx}
                style={{ backgroundColor: color.hex }}
                onClick={() => handleCopySingle(color.hex)}
                className="flex-1 h-full relative group cursor-pointer flex flex-col justify-between p-4 transition-all duration-200 hover:flex-[1.4]"
                title={`Click to copy ${color.hex}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${badgeBg}`}>
                    {isSeed ? 'Seed' : 'Filled'}
                  </span>
                  {isSeed ? (
                    <span title="Locked seed color">
                      <Lock className={`w-3.5 h-3.5 ${textColor} opacity-80`} />
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateCompletedPalette();
                      }}
                      className={`p-1 rounded-md hover:bg-black/15 transition-all ${textColor} opacity-60 hover:opacity-100 cursor-pointer active:scale-90`}
                      title="Re-color filled colors"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1 text-center">
                  <div className={`font-mono text-sm sm:text-base font-extrabold ${textColor}`}>
                    {color.hex}
                  </div>
                  <div className={`text-[11px] font-medium opacity-80 truncate ${textColor}`}>
                    {color.name}
                  </div>
                  <div className={`text-[9px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity font-bold ${textColor}`}>
                    {copiedHex === color.hex ? '✓ Copied' : 'Click to copy'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenInVisualizer(asPaletteObj())}
              className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview in Visualizer</span>
            </button>

            {onOpenInContrast && (
              <button
                onClick={() => onOpenInContrast(asPaletteObj())}
                className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Check color contrast accessibility (WCAG AA/AAA)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                <span>Check Contrast</span>
              </button>
            )}

            <button
              onClick={() => onOpenInGenerator(asPaletteObj())}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Edit in Palette Studio</span>
            </button>

            <button
              onClick={() => onOpenSaveModal(asPaletteObj())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save to Collection</span>
            </button>

            <button
              onClick={handleCopyAllHexes}
              className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{copiedAll ? 'Copied!' : 'Copy Palette'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSvg}
              className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>SVG</span>
            </button>

            <button
              onClick={handleDownloadPng}
              className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
