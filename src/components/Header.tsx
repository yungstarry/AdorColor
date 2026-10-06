import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Wand2,
  Eye,
  Scissors,
  SlidersHorizontal,
  Image as ImageIcon,
  FolderHeart,
} from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  savedPalettesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  savedPalettesCount,
}) => {
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Brand + Promo */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setActiveView('explore')}
          className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
        >
          {/* Custom geometric logo mark */}
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <span className="w-1/4 h-full bg-[#2A9D8F]" />
              <span className="w-1/4 h-full bg-[#E9C46A]" />
              <span className="w-1/4 h-full bg-[#F4A261]" />
              <span className="w-1/4 h-full bg-[#E76F51]" />
            </div>
            <div className="relative z-10 w-4 h-4 rounded-full bg-white/95 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            </div>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center">
            Palette<span className="text-blue-600">Lab</span>
          </span>
        </button>

      </div>

      {/* Center: Navigation links */}
      <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
        <button
          onClick={() => setActiveView('explore')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeView === 'explore'
              ? 'bg-gray-100 text-gray-900 font-semibold'
              : 'hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setActiveView('generator')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeView === 'generator'
              ? 'bg-gray-100 text-gray-900 font-semibold'
              : 'hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => setActiveView('completer')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeView === 'completer'
              ? 'bg-gray-100 text-gray-900 font-semibold'
              : 'hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span>Color Completer</span>
          <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-blue-100 text-blue-700 rounded-md">
            New
          </span>
        </button>
        <button
          onClick={() => setActiveView('visualizer')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeView === 'visualizer'
              ? 'bg-gray-100 text-gray-900 font-semibold'
              : 'hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Visualizer
        </button>
        <button
          onClick={() => setActiveView('script-splitter')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeView === 'script-splitter'
              ? 'bg-gray-100 text-gray-900 font-semibold'
              : 'hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Script Splitter
        </button>
      </nav>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Tools dropdown */}
        <div className="relative">
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span>Tools</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {toolsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setToolsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-40 text-sm">
                <button
                  onClick={() => {
                    setActiveView('generator');
                    setToolsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Palette Studio</div>
                    <div className="text-xs text-gray-400">
                      Generate &amp; lock colors
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveView('completer');
                    setToolsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="font-medium">Palette Completer</div>
                    <div className="text-xs text-gray-400">
                      Provide 1-2 colors, auto-fill rest
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveView('visualizer');
                    setToolsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-medium">Palette Visualizer</div>
                    <div className="text-xs text-gray-400">
                      Preview on live web/mobile apps
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveView('contrast');
                    setToolsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-medium">Contrast Checker</div>
                    <div className="text-xs text-gray-400">
                      WCAG AA/AAA accessibility test
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveView('image-picker');
                    setToolsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-gray-50 text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="font-medium">Image Color Picker</div>
                    <div className="text-xs text-gray-400">
                      Extract colors from photos
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* My Library Button */}
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeView === 'dashboard'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="View saved palettes & collections"
        >
          <FolderHeart className="w-4 h-4 text-rose-500" />
          <span>Saved ({savedPalettesCount})</span>
        </button>
      </div>
    </header>
  );
};
