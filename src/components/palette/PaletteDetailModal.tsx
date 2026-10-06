import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Download, 
  Wand2, 
  Eye, 
  SlidersHorizontal, 
  Bookmark, 
  FileCode,
  FileText,
} from 'lucide-react';
import { Palette, PaletteColor } from '../../types';
import { 
  isLightColor, 
  generateCssSnippet, 
  generateTailwindSnippet, 
  generateSvgDataUrl 
} from '../../utils/colorUtils';

interface PaletteDetailModalProps {
  palette: Palette | null;
  onClose: () => void;
  onOpenInGenerator: (palette: Palette) => void;
  onOpenInVisualizer: (palette: Palette) => void;
  onOpenInContrast: (paletteOrColor1: Palette | string, color2?: string) => void;
  onSaveToCollection: (palette: Palette) => void;
  isSaved?: boolean;
  onToast: (msg: string) => void;
}

export const PaletteDetailModal: React.FC<PaletteDetailModalProps> = ({
  palette,
  onClose,
  onOpenInGenerator,
  onOpenInVisualizer,
  onOpenInContrast,
  onSaveToCollection,
  isSaved = false,
  onToast,
}) => {
  const [, setCopiedFormat] = useState<string | null>(null);

  if (!palette) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(label);
    onToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedFormat(null), 1500);
  };

  const handleDownloadSvg = () => {
    const dataUrl = generateSvgDataUrl(palette.colors);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${palette.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    onToast('SVG file downloaded!');
  };

  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barWidth = canvas.width / palette.colors.length;
    palette.colors.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * barWidth, 0, barWidth, canvas.height);

      ctx.fillStyle = isLightColor(c.hex) ? '#111827' : '#FFFFFF';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(c.hex, i * barWidth + barWidth / 2, canvas.height - 50);
      ctx.font = '16px system-ui';
      ctx.fillText(c.name, i * barWidth + barWidth / 2, canvas.height - 25);
    });

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${palette.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
    onToast('PNG palette image downloaded!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-gray-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{palette.name}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>by {palette.creator.name}</span>
              <span>·</span>
              <span>{palette.colors.length} colors</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveToCollection(palette)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-blue-600' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Large Horizontal Color Visualization */}
        <div className="h-64 sm:h-72 w-full flex">
          {palette.colors.map((color, i) => (
            <div
              key={i}
              style={{ backgroundColor: color.hex }}
              className="flex-1 h-full relative group flex flex-col justify-end p-4 transition-all duration-300"
            >
              <div
                className={`transition-all duration-200 opacity-0 group-hover:opacity-100 text-center ${
                  isLightColor(color.hex) ? 'text-gray-900' : 'text-white'
                }`}
              >
                <div className="font-mono text-sm font-bold">{color.hex}</div>
                <div className="text-xs">{color.name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Color Specs Grid (HEX, RGB, HSL, CMYK) */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {palette.colors.map((color, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs font-bold text-gray-900 truncate">{color.name}</span>
                </div>

                <div className="space-y-1 text-[11px] font-mono">
                  {/* HEX */}
                  <div
                    onClick={() => copyToClipboard(color.hex, `${color.hex}`)}
                    className="flex justify-between items-center text-gray-600 hover:text-blue-600 cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <span className="text-gray-400 font-sans text-[10px]">HEX</span>
                    <span className="font-semibold">{color.hex}</span>
                  </div>

                  {/* RGB */}
                  <div
                    onClick={() => copyToClipboard(`rgb(${color.rgb})`, `rgb(${color.rgb})`)}
                    className="flex justify-between items-center text-gray-600 hover:text-blue-600 cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <span className="text-gray-400 font-sans text-[10px]">RGB</span>
                    <span className="truncate ml-1">{color.rgb}</span>
                  </div>

                  {/* HSL */}
                  <div
                    onClick={() => copyToClipboard(`hsl(${color.hsl})`, `hsl(${color.hsl})`)}
                    className="flex justify-between items-center text-gray-600 hover:text-blue-600 cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <span className="text-gray-400 font-sans text-[10px]">HSL</span>
                    <span className="truncate ml-1">{color.hsl}</span>
                  </div>

                  {/* CMYK */}
                  <div
                    onClick={() => copyToClipboard(`cmyk(${color.cmyk})`, `cmyk(${color.cmyk})`)}
                    className="flex justify-between items-center text-gray-600 hover:text-blue-600 cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded transition-colors"
                  >
                    <span className="text-gray-400 font-sans text-[10px]">CMYK</span>
                    <span className="truncate ml-1">{color.cmyk}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions & Export Options */}
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onOpenInGenerator(palette);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Open in Generator</span>
            </button>

            <button
              onClick={() => {
                onOpenInVisualizer(palette);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Visualizer</span>
            </button>

            {palette.colors.length >= 2 && (
              <button
                onClick={() => {
                  onOpenInContrast(palette);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Check Contrast</span>
              </button>
            )}

          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => copyToClipboard(generateCssSnippet(palette.colors, palette.name), 'CSS Variables')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Copy CSS</span>
            </button>

            <button
              onClick={() => copyToClipboard(generateTailwindSnippet(palette.colors, palette.name), 'Tailwind Config')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Tailwind</span>
            </button>

            <button
              onClick={handleDownloadSvg}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>SVG</span>
            </button>

            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium cursor-pointer"
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
