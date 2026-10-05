import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react';
import { FilterState } from '../types';
import { hexToRgb } from '../utils/colorUtils';

interface FilterPanelProps {
  filterState: FilterState;
  onToggleColor: (colorName: string) => void;
  onToggleStyle: (styleName: string) => void;
  onToggleTopic: (topicName: string) => void;
  onSetSortOrder: (order: 'trending' | 'latest' | 'popular') => void;
  onSetCustomHex: (hex: string | undefined) => void;
  onUpdateAdvanced: (updates: Partial<FilterState['advanced']>) => void;
  onClearAll: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const COLOR_DEFINITIONS: { name: string; dotColor: string }[] = [
  { name: 'Red', dotColor: '#EF4444' },
  { name: 'Orange', dotColor: '#F97316' },
  { name: 'Brown', dotColor: '#A16207' },
  { name: 'Yellow', dotColor: '#EAB308' },
  { name: 'Green', dotColor: '#22C55E' },
  { name: 'Turquoise', dotColor: '#14B8A6' },
  { name: 'Blue', dotColor: '#3B82F6' },
  { name: 'Violet', dotColor: '#8B5CF6' },
  { name: 'Pink', dotColor: '#EC4899' },
  { name: 'Gray', dotColor: '#9CA3AF' },
  { name: 'Black', dotColor: '#111827' },
  { name: 'White', dotColor: '#FFFFFF' },
];

const STYLE_OPTIONS = [
  'Warm',
  'Cold',
  'Bright',
  'Dark',
  'Pastel',
  'Vintage',
  'Monochromatic',
  'Gradient',
  'Rainbow',
  '2 Colors',
  '3 Colors',
  '4 Colors',
  '5 Colors',
  '6 Colors',
  '7 Colors',
  '8 Colors',
  '9 Colors',
  '10 Colors',
];

const INITIAL_TOPIC_OPTIONS = [
  'Christmas',
  'Halloween',
  'Pride',
  'Sunset',
  'Spring',
  'Winter',
  'Summer',
  'Autumn',
  'Gold',
  'Wedding',
  'Party',
  'Space',
  'Kids',
  'Nature',
  'City',
  'Food',
  'Happy',
  'Water',
  'Relax',
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filterState,
  onToggleColor,
  onToggleStyle,
  onToggleTopic,
  onSetSortOrder,
  onSetCustomHex,
  onUpdateAdvanced,
  onClearAll,
  isExpanded,
  onToggleExpand,
}) => {
  const [topicList, setTopicList] = useState<string[]>(INITIAL_TOPIC_OPTIONS);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [showCustomHexModal, setShowCustomHexModal] = useState(false);
  const [customHexInput, setCustomHexInput] = useState('#3B82F6');
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);

  const rgbValues = hexToRgb(customHexInput);

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicName.trim() && !topicList.includes(newTopicName.trim())) {
      const topic = newTopicName.trim();
      setTopicList([...topicList, topic]);
      onToggleTopic(topic);
      setNewTopicName('');
      setShowNewTopicInput(false);
    }
  };

  const handleApplyCustomHex = () => {
    let hex = customHexInput.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      onSetCustomHex(hex);
      setShowCustomHexModal(false);
    }
  };

  const hasActiveFilters =
    filterState.selectedColors.length > 0 ||
    filterState.selectedStyles.length > 0 ||
    filterState.selectedTopics.length > 0 ||
    filterState.tags.length > 0 ||
    filterState.customHex ||
    filterState.advanced.hueRange[0] !== 0 ||
    filterState.advanced.hueRange[1] !== 360 ||
    filterState.advanced.saturationMin > 0 ||
    filterState.advanced.brightnessMin > 0 ||
    filterState.advanced.temperature !== 'all' ||
    filterState.advanced.numColors !== null ||
    filterState.advanced.wcagAA ||
    filterState.advanced.wcagAAA ||
    filterState.advanced.colorBlindFriendly ||
    filterState.advanced.simulationMode !== 'normal';

  if (!isExpanded) {
    return (
      <div className="border-b border-gray-200 bg-white px-4 md:px-8 py-2.5 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>Filters are collapsed.</span>
          {hasActiveFilters && (
            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Active filters applied
            </span>
          )}
        </div>
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          <span>Show filters</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFBFB] border-b border-gray-200 text-gray-800 transition-all select-none">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-5">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Filter By
            </span>
            {hasActiveFilters && (
              <button
                onClick={onClearAll}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer ml-3 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer transition-colors"
            title="Collapse filters"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
          {/* 1. Colors Column */}
          <div>
            <div className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>Colors</span>
              <button
                onClick={() => setShowCustomHexModal(!showCustomHexModal)}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
              >
                + Custom HEX
              </button>
            </div>

            {showCustomHexModal && (
              <div className="mb-3 p-3 bg-white rounded-xl shadow-md border border-gray-200 text-xs">
                <div className="font-semibold text-gray-900 mb-2">Custom Color</div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={customHexInput}
                    onChange={(e) => setCustomHexInput(e.target.value)}
                    className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0"
                  />
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase block">HEX</label>
                    <input
                      type="text"
                      value={customHexInput}
                      onChange={(e) => setCustomHexInput(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded font-mono text-xs uppercase"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mb-2 font-mono">
                  RGB: {rgbValues.r}, {rgbValues.g}, {rgbValues.b}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowCustomHexModal(false)}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCustomHex}
                    className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {COLOR_DEFINITIONS.map((c) => {
                const isSelected = filterState.selectedColors.includes(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => onToggleColor(c.name)}
                    className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 ring-1.5 ring-blue-500 shadow-xs'
                        : 'bg-[#F2F2F2] hover:bg-[#EBEBEB] text-gray-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0 shadow-2xs"
                      style={{ backgroundColor: c.dotColor }}
                    />
                    <span className="truncate">{c.name}</span>
                    {isSelected && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Styles Column */}
          <div>
            <div className="text-sm font-bold text-gray-900 mb-3">Styles</div>
            <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {STYLE_OPTIONS.map((style) => {
                const isSelected = filterState.selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    onClick={() => onToggleStyle(style)}
                    className={`h-8 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100 text-purple-900 ring-1.5 ring-purple-500 shadow-xs'
                        : 'bg-[#F2F2F2] hover:bg-[#EBEBEB] text-gray-700'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Topics Column */}
          <div>
            <div className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>Topics</span>
              <button
                onClick={() => setShowNewTopicInput(!showNewTopicInput)}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
              >
                + Add Topic
              </button>
            </div>

            {showNewTopicInput && (
              <form onSubmit={handleAddTopic} className="mb-2 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="New topic name..."
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:outline-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Add
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {topicList.map((topic) => {
                const isSelected = filterState.selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => onToggleTopic(topic)}
                    className={`h-8 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 ring-1.5 ring-amber-500 shadow-xs'
                        : 'bg-[#F2F2F2] hover:bg-[#EBEBEB] text-gray-700'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Order Column */}
          <div>
            <div className="text-sm font-bold text-gray-900 mb-3">Order</div>
            <div className="flex flex-col gap-2">
              {(['Trending', 'Latest', 'Popular'] as const).map((order) => {
                const lower = order.toLowerCase() as 'trending' | 'latest' | 'popular';
                const isActive = filterState.sortOrder === lower;
                return (
                  <button
                    key={order}
                    onClick={() => onSetSortOrder(lower)}
                    className={`h-9 px-4 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-[#EBF5FF] text-blue-700 font-bold shadow-2xs'
                        : 'bg-[#F2F2F2] hover:bg-[#EBEBEB] text-gray-700'
                    }`}
                  >
                    <span>{order}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200/70">
              <button
                onClick={() => setShowAdvancedSection(!showAdvancedSection)}
                className="w-full text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center justify-between py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-gray-500" />
                  Advanced Properties
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showAdvancedSection ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Properties */}
        {showAdvancedSection && (
          <div className="mt-6 pt-5 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-xl shadow-2xs">
            {/* Color Properties */}
            <div>
              <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Color Properties
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span>Hue Range</span>
                    <span className="font-mono">
                      {filterState.advanced.hueRange[0]}° - {filterState.advanced.hueRange[1]}°
                    </span>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={filterState.advanced.hueRange[0]}
                      aria-label="Minimum hue"
                      onChange={(e) =>
                        onUpdateAdvanced({
                          hueRange: [Number(e.target.value), filterState.advanced.hueRange[1]],
                        })
                      }
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                    />
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={filterState.advanced.hueRange[1]}
                      aria-label="Maximum hue"
                      onChange={(e) =>
                        onUpdateAdvanced({
                          hueRange: [filterState.advanced.hueRange[0], Number(e.target.value)],
                        })
                      }
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span>Min Saturation</span>
                    <span className="font-mono">{filterState.advanced.saturationMin}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterState.advanced.saturationMin}
                    onChange={(e) =>
                      onUpdateAdvanced({ saturationMin: Number(e.target.value) })
                    }
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span>Min Brightness</span>
                    <span className="font-mono">{filterState.advanced.brightnessMin}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filterState.advanced.brightnessMin}
                    onChange={(e) =>
                      onUpdateAdvanced({ brightnessMin: Number(e.target.value) })
                    }
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Temperature & Number of colors */}
            <div>
              <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Palette Characteristics
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-gray-600 mb-1.5">Color Temperature</div>
                  <div className="flex gap-1.5">
                    {(['all', 'warm', 'cool'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => onUpdateAdvanced({ temperature: t })}
                        className={`px-3 py-1 rounded-md capitalize cursor-pointer text-xs font-medium transition-colors ${
                          filterState.advanced.temperature === t
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-gray-600 mb-1.5">Number of Colors</div>
                  <div className="flex flex-wrap gap-1">
                    {[null, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num === null ? 'any' : num}
                        onClick={() => onUpdateAdvanced({ numColors: num })}
                        className={`w-7 h-7 rounded-md text-xs font-medium flex items-center justify-center cursor-pointer transition-colors ${
                          filterState.advanced.numColors === num
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {num === null ? 'All' : num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Accessibility */}
            <div>
              <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Accessibility
              </div>
              <div className="space-y-2 text-xs text-gray-700 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterState.advanced.wcagAA}
                    onChange={(e) => onUpdateAdvanced({ wcagAA: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span title="Requires at least one color pair with a contrast ratio of 4.5:1 or higher.">
                    WCAG AA Contrast Compliant
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterState.advanced.wcagAAA}
                    onChange={(e) => onUpdateAdvanced({ wcagAAA: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span title="Requires at least one color pair with a contrast ratio of 7:1 or higher.">
                    WCAG AAA Contrast Compliant
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterState.advanced.colorBlindFriendly}
                    onChange={(e) =>
                      onUpdateAdvanced({ colorBlindFriendly: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span title="Requires palette colors to remain visually distinct across four color-vision simulations.">
                    Color-blind Friendly Balance
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Simulation Preview Mode
                </label>
                <select
                  value={filterState.advanced.simulationMode}
                  onChange={(e) =>
                    onUpdateAdvanced({
                      simulationMode: e.target.value as any,
                    })
                  }
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-blue-500 cursor-pointer"
                >
                  <option value="normal">Normal Vision</option>
                  <option value="protanopia">Protanopia (Red-Blind)</option>
                  <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                  <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                  <option value="achromatopsia">Achromatopsia (Monochrome)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
