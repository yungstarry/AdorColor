import React, { useState } from 'react';
import { Heart, Copy, Check, ExternalLink, Eye, SlidersHorizontal } from 'lucide-react';
import { Palette, PaletteColor } from '../types';
import { isLightColor, simulateColorBlindness } from '../utils/colorUtils';

interface PaletteCardProps {
  palette: Palette;
  onOpenDetails: (palette: Palette) => void;
  onOpenSaveModal: (palette: Palette) => void;
  onCopyHex: (hex: string) => void;
  onOpenInVisualizer?: (palette: Palette) => void;
  onOpenInContrast?: (palette: Palette) => void;
  isSaved?: boolean;
  simulationMode?: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
}

export const PaletteCard: React.FC<PaletteCardProps> = ({
  palette,
  onOpenDetails,
  onOpenSaveModal,
  onCopyHex,
  onOpenInVisualizer,
  onOpenInContrast,
  isSaved = false,
  simulationMode = 'normal',
}) => {
  const [copiedColorIndex, setCopiedColorIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [hoveredColorIndex, setHoveredColorIndex] = useState<number | null>(null);

  const handleCopySingleColor = (e: React.MouseEvent, color: PaletteColor, index: number) => {
    e.stopPropagation();
    onCopyHex(color.hex);
    setCopiedColorIndex(index);
    setTimeout(() => setCopiedColorIndex(null), 1500);
  };

  const handleCopyAllHexes = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hexList = palette.colors.map((c) => c.hex).join(', ');
    navigator.clipboard.writeText(hexList);
    onCopyHex(hexList);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div
      onClick={() => onOpenDetails(palette)}
      className="group bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-0.5"
    >
      {/* Visual Color Preview Bars */}
      <div className="h-44 sm:h-48 w-full flex relative overflow-hidden bg-gray-50">
        {palette.colors.map((color, index) => {
          const displayHex = simulateColorBlindness(color.hex, simulationMode);
          const isLight = isLightColor(displayHex);
          const isHovered = hoveredColorIndex === index;

          return (
            <div
              key={`${color.hex}-${index}`}
              style={{ backgroundColor: displayHex }}
              onMouseEnter={() => setHoveredColorIndex(index)}
              onMouseLeave={() => setHoveredColorIndex(null)}
              onClick={(e) => handleCopySingleColor(e, color, index)}
              className="flex-1 h-full relative transition-all duration-200 group/bar flex items-end justify-center pb-3 hover:flex-[1.4]"
            >
              <div
                className={`transition-all duration-200 text-center px-1 rounded-md py-1 backdrop-blur-xs ${
                  isHovered
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2 pointer-events-none'
                } ${
                  isLight
                    ? 'text-gray-900 bg-white/80 shadow-xs'
                    : 'text-white bg-black/50 shadow-xs'
                }`}
              >
                <div className="font-mono text-[11px] font-bold tracking-tight">
                  {copiedColorIndex === index ? 'Copied!' : displayHex}
                </div>
                <div className="text-[9px] uppercase tracking-wider font-medium opacity-80">
                  {copiedColorIndex === index ? '✓' : 'Copy'}
                </div>
              </div>
            </div>
          );
        })}

        {/* Hover Quick Action Buttons Bar */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-gray-100">
          <button
            onClick={handleCopyAllHexes}
            title="Copy all HEX codes"
            className="p-1.5 rounded-lg text-gray-700 hover:text-gray-950 hover:bg-gray-100/90 transition-colors"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {onOpenInVisualizer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInVisualizer(palette);
              }}
              title="Preview in Visualizer"
              className="p-1.5 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {onOpenInContrast && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInContrast(palette);
              }}
              title="Check Contrast"
              className="p-1.5 rounded-lg text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSaveModal(palette);
            }}
            title={isSaved ? 'Saved in collection' : 'Save palette to collection'}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              isSaved
                ? 'text-rose-600 bg-rose-50'
                : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100/90'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(palette);
            }}
            title="Open details"
            className="p-1.5 rounded-lg text-gray-700 hover:text-gray-950 hover:bg-gray-100/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hex Codes Row */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100 text-[11px] font-mono text-gray-600 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          {palette.colors.map((color, i) => (
            <span
              key={i}
              onClick={(e) => handleCopySingleColor(e, color, i)}
              className="hover:text-blue-600 hover:underline cursor-pointer"
              title={`Click to copy ${color.hex}`}
            >
              {color.hex}
            </span>
          ))}
        </div>
        <span className="text-[10px] font-sans text-gray-400 font-medium shrink-0 ml-2">
          {palette.colors.length} colors
        </span>
      </div>

      {/* Bottom Metadata */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <img
            src={palette.creator.avatar}
            alt={palette.creator.name}
            className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200"
          />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {palette.name}
            </h3>
            <p className="text-[11px] text-gray-400 truncate">by {palette.creator.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSaveModal(palette);
            }}
            className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
              isSaved ? 'text-rose-600 font-bold' : 'text-gray-500 hover:text-rose-600'
            }`}
            title="Save to collection"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isSaved ? 'fill-rose-500 text-rose-500 scale-110' : ''
              } transition-transform`}
            />
            <span>{isSaved ? 'Saved' : palette.likes > 999 ? `${(palette.likes / 1000).toFixed(1)}k` : palette.likes}</span>
          </button>

          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <span>↗</span>
            <span>{palette.views > 999 ? `${(palette.views / 1000).toFixed(1)}k` : palette.views}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
