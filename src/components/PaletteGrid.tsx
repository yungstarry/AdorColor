import React from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Palette } from '../types';
import { PaletteCard } from './PaletteCard';

interface PaletteGridProps {
  palettes: Palette[];
  totalAvailableCount: number;
  hasAdvancedPaletteFilters: boolean;
  savedPaletteIds: string[];
  onOpenDetails: (palette: Palette) => void;
  onOpenSaveModal: (palette: Palette) => void;
  onCopyHex: (hex: string) => void;
  onOpenInVisualizer: (palette: Palette) => void;
  onOpenInContrast?: (palette: Palette) => void;
  onClearFilters: () => void;
  onLoadMore: () => void;
  simulationMode: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
}

export const PaletteGrid: React.FC<PaletteGridProps> = ({
  palettes,
  totalAvailableCount,
  hasAdvancedPaletteFilters,
  savedPaletteIds,
  onOpenDetails,
  onOpenSaveModal,
  onCopyHex,
  onOpenInVisualizer,
  onOpenInContrast,
  onClearFilters,
  onLoadMore,
  simulationMode,
}) => {
  const hasMore = palettes.length < totalAvailableCount;

  if (palettes.length === 0) {
    return (
      <div className="py-20 px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-4">
          <SlidersHorizontal className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">No matching palettes found</h3>
        <p className="text-sm text-gray-500 mb-6">
          Try removing some of your selected colors, tags, or styles to discover more palettes.
        </p>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 text-xs text-gray-500 font-medium gap-2">
        <div>
          {hasAdvancedPaletteFilters ? (
            <>
              Showing <span className="text-gray-900 font-extrabold">{palettes.length}</span> palettes matching advanced properties
            </>
          ) : (
            <>
              Showing <span className="text-gray-900 font-extrabold">{palettes.length}</span> of{' '}
              <span className="text-gray-900 font-extrabold">{totalAvailableCount.toLocaleString()}</span> color palettes{' '}
              <span className="text-blue-600 font-semibold">(10M catalog · balanced across all filters)</span>
            </>
          )}
          {simulationMode !== 'normal' && (
            <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-semibold">
              Simulating {simulationMode}
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-400">
          Infinitely computed color theory catalog
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {palettes.map((palette) => (
          <PaletteCard
            key={palette.id}
            palette={palette}
            isSaved={savedPaletteIds.includes(palette.id)}
            onOpenDetails={onOpenDetails}
            onOpenSaveModal={onOpenSaveModal}
            onCopyHex={onCopyHex}
            onOpenInVisualizer={onOpenInVisualizer}
            onOpenInContrast={onOpenInContrast}
            simulationMode={simulationMode}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={onLoadMore}
            className="px-8 py-3 bg-white border border-gray-300 hover:border-gray-400 text-gray-900 rounded-2xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2 hover:scale-[1.01]"
          >
            <span>
              {hasAdvancedPaletteFilters
                ? 'Load More Matching Palettes'
                : `Load Next 36 Palettes (${(totalAvailableCount - palettes.length).toLocaleString()} remaining)`}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
