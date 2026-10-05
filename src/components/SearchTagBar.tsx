import React, { useState, useRef } from 'react';
import { Menu, X, Plus } from 'lucide-react';
import { FilterState } from '../types';

interface SearchTagBarProps {
  filterState: FilterState;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onRemoveColor: (color: string) => void;
  onRemoveStyle: (style: string) => void;
  onRemoveTopic: (topic: string) => void;
  onSearchChange: (query: string) => void;
  filterPanelExpanded: boolean;
  onToggleFilterPanel: () => void;
  totalResultsCount: number;
}

const COMMON_TAG_SUGGESTIONS = [
  'Minimal',
  'Luxury',
  'Nature',
  'SaaS',
  'Branding',
  'Dark',
  'Pastel',
  'Vintage',
  'Neon',
  'Warm',
  'Autumn',
  'Summer',
  'Tech',
  'Fintech',
  'Food',
  'Wedding',
  'Modern',
  'Retro'
];

export const SearchTagBar: React.FC<SearchTagBarProps> = ({
  filterState,
  onAddTag,
  onRemoveTag,
  onRemoveColor,
  onRemoveStyle,
  onRemoveTopic,
  onSearchChange,
  filterPanelExpanded,
  onToggleFilterPanel,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      onAddTag(tagInput.trim());
      setTagInput('');
      setShowSuggestions(false);
    } else if (e.key === 'Backspace' && !tagInput) {
      if (filterState.tags.length > 0) {
        onRemoveTag(filterState.tags[filterState.tags.length - 1]);
      } else if (filterState.selectedColors.length > 0) {
        onRemoveColor(filterState.selectedColors[filterState.selectedColors.length - 1]);
      }
    }
  };

  const filteredSuggestions = COMMON_TAG_SUGGESTIONS.filter(
    (tag) =>
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !filterState.tags.includes(tag)
  );

  return (
    <div className="h-[74px] bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between gap-4 select-none">
      {/* Left side: Tag chips + Add tag input */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
        {filterState.selectedColors.map((colorName) => (
          <span
            key={colorName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium border border-gray-200 shrink-0 hover:bg-gray-100 transition-colors"
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
              style={{
                backgroundColor:
                  colorName.toLowerCase() === 'white'
                    ? '#FFFFFF'
                    : colorName.toLowerCase() === 'black'
                    ? '#000000'
                    : colorName.toLowerCase() === 'turquoise'
                    ? '#14b8a6'
                    : colorName.toLowerCase(),
              }}
            />
            <span>{colorName}</span>
            <button
              onClick={() => onRemoveColor(colorName)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 cursor-pointer ml-0.5"
              aria-label={`Remove ${colorName}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {filterState.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 text-sm font-medium border border-blue-100 shrink-0"
          >
            <span>{tag}</span>
            <button
              onClick={() => onRemoveTag(tag)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-100 text-blue-600 hover:text-blue-900 cursor-pointer ml-0.5"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {filterState.selectedStyles.map((style) => (
          <span
            key={style}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-900 text-sm font-medium border border-purple-100 shrink-0"
          >
            <span>{style}</span>
            <button
              onClick={() => onRemoveStyle(style)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-purple-100 text-purple-600 hover:text-purple-900 cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {filterState.selectedTopics.map((topic) => (
          <span
            key={topic}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 text-sm font-medium border border-amber-100 shrink-0"
          >
            <span>{topic}</span>
            <button
              onClick={() => onRemoveTopic(topic)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-amber-100 text-amber-600 hover:text-amber-900 cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <div className="relative min-w-[150px] flex-1">
          <input
            ref={inputRef}
            type="text"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              onSearchChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              filterState.selectedColors.length === 0 && filterState.tags.length === 0
                ? 'Add tag (e.g. Minimal, Luxury, Nature, SaaS) or type color / keyword...'
                : 'Add tag...'
            }
            className="w-full h-9 px-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
          />

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 top-10 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Popular tags
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredSuggestions.slice(0, 8).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onAddTag(suggestion);
                      setTagInput('');
                      setShowSuggestions(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>{suggestion}</span>
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Search controls */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleFilterPanel}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            filterPanelExpanded
              ? 'bg-gray-100 border-gray-300 text-gray-900'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          title={filterPanelExpanded ? 'Collapse filters' : 'Expand filters'}
          aria-label="Toggle filter drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
