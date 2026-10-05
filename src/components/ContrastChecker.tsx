import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Zap,
  Layers,
} from 'lucide-react';
import { getContrastRatio } from '../utils/colorUtils';
import { Palette } from '../types';

interface ContrastCheckerProps {
  initialForeground?: string;
  initialBackground?: string;
  palette?: Palette | null;
  onToast: (msg: string) => void;
}

export const ContrastChecker: React.FC<ContrastCheckerProps> = ({
  initialForeground = '#FFFFFF',
  initialBackground = '#264653',
  palette = null,
  onToast,
}) => {
  const [foreground, setForeground] = useState(initialForeground);
  const [background, setBackground] = useState(initialBackground);

  useEffect(() => {
    if (initialForeground) {
      setForeground(initialForeground);
    }
  }, [initialForeground]);

  useEffect(() => {
    if (initialBackground) {
      setBackground(initialBackground);
    }
  }, [initialBackground]);

  const ratio = getContrastRatio(foreground, background);
  const formattedRatio = ratio.toFixed(2);

  const passAANormal = ratio >= 4.5;
  const passAALarge = ratio >= 3.0;
  const passAAANormal = ratio >= 7.0;
  const passAAALarge = ratio >= 4.5;

  const handleSwap = () => {
    const temp = foreground;
    setForeground(background);
    setBackground(temp);
  };

  const handleAutoHighestContrast = () => {
    if (!palette || !palette.colors || palette.colors.length < 2) return;
    const cols = palette.colors;
    let bestFg = cols[0].hex;
    let bestBg = cols[1].hex;
    let maxRatio = 0;

    for (let i = 0; i < cols.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        if (i === j) continue;
        const r = getContrastRatio(cols[i].hex, cols[j].hex);
        if (r > maxRatio) {
          maxRatio = r;
          bestFg = cols[i].hex;
          bestBg = cols[j].hex;
        }
      }
    }

    setForeground(bestFg);
    setBackground(bestBg);
    onToast(`Selected highest contrast pair (${maxRatio.toFixed(2)}:1)!`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Accessibility Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Color Contrast Checker
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Calculate contrast ratio according to Web Content Accessibility
          Guidelines (WCAG 2.1 &amp; WCAG 3.0 APCA guidelines).
        </p>
      </div>

      {palette && palette.colors && palette.colors.length > 0 && (
        <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                  Active Palette
                </span>
                <h3 className="font-extrabold text-sm text-gray-900 truncate">
                  "{palette.name}"
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Click any color below to assign as Text (FG) or Background (BG).
              </p>
            </div>

            <button
              onClick={handleAutoHighestContrast}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Automatically select the pair with maximum contrast ratio"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Highest Contrast Pair</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {palette.colors.map((c, idx) => {
              const isFg = c.hex.toLowerCase() === foreground.toLowerCase();
              const isBg = c.hex.toLowerCase() === background.toLowerCase();

              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-white hover:border-gray-300 transition-all shadow-2xs"
                >
                  <span
                    style={{ backgroundColor: c.hex }}
                    className="w-7 h-7 rounded-lg border border-black/10 shadow-2xs shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-gray-800 uppercase">
                      {c.hex}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => setForeground(c.hex)}
                        className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold cursor-pointer transition-colors ${
                          isFg
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        title="Set as Text / Foreground"
                      >
                        {isFg ? '✓ Text' : 'Text'}
                      </button>
                      <button
                        onClick={() => setBackground(c.hex)}
                        className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold cursor-pointer transition-colors ${
                          isBg
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        title="Set as Background"
                      >
                        {isBg ? '✓ Bg' : 'Bg'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Text / Foreground
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={foreground}
                  onChange={(e) => setForeground(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border border-gray-200 p-0 shrink-0"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    className="w-full font-mono text-sm px-3 py-2.5 rounded-xl border border-gray-200 uppercase font-bold text-gray-800 focus:outline-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                className="p-2.5 rounded-full border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-600 transition-all cursor-pointer shadow-2xs"
                title="Swap foreground & background"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Background
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border border-gray-200 p-0 shrink-0"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-full font-mono text-sm px-3 py-2.5 rounded-xl border border-gray-200 uppercase font-bold text-gray-800 focus:outline-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 block mb-2">
              Common Pairings:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { fg: '#FFFFFF', bg: '#0F172A', label: 'Dark Navy' },
                { fg: '#1E293B', bg: '#F8FAFC', label: 'Crisp Light' },
                { fg: '#2A9D8F', bg: '#10171D', label: 'Cyber Teal' },
                { fg: '#E76F51', bg: '#FFF5F0', label: 'Warm Coral' },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setForeground(preset.fg);
                    setBackground(preset.bg);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Contrast Ratio
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 font-mono tracking-tight">
                  {formattedRatio}
                </span>
                <span className="text-xl font-bold text-gray-400 font-mono">
                  : 1
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ratio >= 7
                  ? 'Superb contrast! Passes all WCAG AAA requirements.'
                  : ratio >= 4.5
                  ? 'Great contrast! Passes all standard WCAG AA requirements.'
                  : ratio >= 3
                  ? 'Acceptable for large headings (18pt+) and UI components.'
                  : 'Fails WCAG accessibility standards. Consider darkening or lightening.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto shrink-0">
              <div
                className={`p-3 rounded-2xl border text-center ${
                  passAANormal
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  WCAG AA
                </div>
                <div className="text-xs font-semibold">Normal Text</div>
                <div className="text-xs font-extrabold mt-1 flex items-center justify-center gap-1">
                  {passAANormal ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PASS</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>FAIL</span>
                    </>
                  )}
                </div>
              </div>

              <div
                className={`p-3 rounded-2xl border text-center ${
                  passAALarge
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  WCAG AA
                </div>
                <div className="text-xs font-semibold">Large Text</div>
                <div className="text-xs font-extrabold mt-1 flex items-center justify-center gap-1">
                  {passAALarge ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PASS</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>FAIL</span>
                    </>
                  )}
                </div>
              </div>

              <div
                className={`p-3 rounded-2xl border text-center ${
                  passAAANormal
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  WCAG AAA
                </div>
                <div className="text-xs font-semibold">Normal Text</div>
                <div className="text-xs font-extrabold mt-1 flex items-center justify-center gap-1">
                  {passAAANormal ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PASS</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>FAIL</span>
                    </>
                  )}
                </div>
              </div>

              <div
                className={`p-3 rounded-2xl border text-center ${
                  passAAALarge
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  WCAG AAA
                </div>
                <div className="text-xs font-semibold">Large Text</div>
                <div className="text-xs font-extrabold mt-1 flex items-center justify-center gap-1">
                  {passAAALarge ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PASS</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>FAIL</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{ backgroundColor: background, color: foreground }}
            className="p-8 rounded-3xl border border-black/10 shadow-lg space-y-5 transition-colors duration-200"
          >
            <div className="flex items-center justify-between border-b border-current/20 pb-4">
              <span className="text-xs uppercase tracking-widest font-bold opacity-75">
                Live Type Specimen
              </span>
              <span className="font-mono text-xs opacity-75">
                {formattedRatio} : 1
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Empowering design systems with verified color balance.
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed opacity-90">
                Accessible design ensures people with color vision deficiencies
                and low vision can comfortably read your content without visual
                strain across any monitor or lighting environment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                style={{ backgroundColor: foreground, color: background }}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-transform hover:scale-105 shadow-xs cursor-pointer"
              >
                Primary Button
              </button>
              <button
                style={{ borderColor: foreground, color: foreground }}
                className="px-4 py-2 rounded-xl text-xs font-bold border hover:bg-current/10 transition-colors cursor-pointer"
              >
                Outline Action
              </button>
            </div>
          </div>

          {palette && palette.colors && palette.colors.length >= 2 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>
                      Palette Contrast Matrix ({palette.colors.length} Colors)
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Click any cell to test that color pair in the live preview.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  WCAG 2.1
                </span>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-[10px] uppercase font-bold text-gray-400">
                        Text \ Bg
                      </th>
                      {palette.colors.map((c, i) => (
                        <th key={i} className="p-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              style={{ backgroundColor: c.hex }}
                              className="w-4 h-4 rounded-md border border-black/15 shadow-2xs"
                              title={c.hex}
                            />
                            <span className="font-mono text-[9px] font-bold text-gray-600 truncate max-w-[45px]">
                              {c.hex}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {palette.colors.map((fgColor, rIdx) => (
                      <tr key={rIdx} className="border-t border-gray-100">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span
                              style={{ backgroundColor: fgColor.hex }}
                              className="w-4 h-4 rounded-md border border-black/15 shadow-2xs shrink-0"
                            />
                            <span className="font-mono text-[10px] font-bold text-gray-700 truncate max-w-[50px]">
                              {fgColor.hex}
                            </span>
                          </div>
                        </td>

                        {palette.colors.map((bgColor, cIdx) => {
                          if (rIdx === cIdx) {
                            return (
                              <td
                                key={cIdx}
                                className="p-2 text-center text-gray-300 font-mono text-[10px]"
                              >
                                —
                              </td>
                            );
                          }

                          const pairRatio = getContrastRatio(
                            fgColor.hex,
                            bgColor.hex
                          );
                          const isPassAAA = pairRatio >= 7.0;
                          const isPassAA = pairRatio >= 4.5;
                          const isPassLarge = pairRatio >= 3.0;

                          const isSelected =
                            foreground.toLowerCase() ===
                              fgColor.hex.toLowerCase() &&
                            background.toLowerCase() ===
                              bgColor.hex.toLowerCase();

                          return (
                            <td key={cIdx} className="p-1 text-center">
                              <button
                                onClick={() => {
                                  setForeground(fgColor.hex);
                                  setBackground(bgColor.hex);
                                  onToast(
                                    `Testing ${fgColor.hex} on ${bgColor.hex} (${pairRatio.toFixed(2)}:1)`
                                  );
                                }}
                                style={{
                                  backgroundColor: bgColor.hex,
                                  color: fgColor.hex,
                                }}
                                className={`w-full py-2 px-1 rounded-xl text-center font-mono text-[10px] font-black transition-all cursor-pointer border ${
                                  isSelected
                                    ? 'ring-2 ring-blue-600 shadow-md scale-105 border-transparent'
                                    : 'border-black/10 hover:scale-102 hover:shadow-xs'
                                }`}
                                title={`${fgColor.hex} on ${bgColor.hex}: ${pairRatio.toFixed(2)}:1 (${
                                  isPassAAA
                                    ? 'AAA'
                                    : isPassAA
                                    ? 'AA'
                                    : isPassLarge
                                    ? 'AA Large'
                                    : 'Fail'
                                })`}
                              >
                                <div>{pairRatio.toFixed(1)}</div>
                                <div className="text-[7.5px] uppercase font-bold tracking-tighter opacity-80">
                                  {isPassAAA
                                    ? 'AAA'
                                    : isPassAA
                                    ? 'AA'
                                    : isPassLarge
                                    ? 'Large'
                                    : '✕'}
                                </div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
