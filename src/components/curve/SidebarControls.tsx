import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft, Check, FlipHorizontal, FlipVertical, RotateCcw, Search, Sliders, Sparkles, Star,
} from 'lucide-react';
import { ALL_EASING_PRESETS, EASING_CATEGORIES } from './utils/presets';
import { aEVelocityToBezier, bezierToAEVelocity, evaluateBezier } from './utils/bezierMath';
import type { AnimationSettings, BezierPoints, EasingPreset } from './types';

const SAVED_PRESETS_KEY = 'palettelab_curve_saved_presets';
const PRESET_PREVIEW_KEY = 'palettelab_curve_preset_preview';
type PresetPreviewMode = 'value' | 'speed';

function readPresetPreviewMode(): PresetPreviewMode {
  try {
    return localStorage.getItem(PRESET_PREVIEW_KEY) === 'speed' ? 'speed' : 'value';
  } catch (error) {
    console.warn('Could not read preset preview preference.', error);
    return 'value';
  }
}

function readSavedPresetNames(): string[] {
  try {
    const saved = localStorage.getItem(SAVED_PRESETS_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === 'string') : [];
  } catch (error) {
    console.warn('Could not read saved curve presets.', error);
    return [];
  }
}

function PresetCurve({
  preset,
  active,
  mode,
}: {
  preset: EasingPreset;
  active: boolean;
  mode: PresetPreviewMode;
}) {
  if (mode === 'speed') {
    const samples = Array.from({ length: 61 }, (_, index) => {
      const point = evaluateBezier(index / 60, preset.p1.x, preset.p1.y, preset.p2.x, preset.p2.y);
      return { x: point.x, speed: Number.isFinite(point.slope) ? point.slope : 0 };
    });
    const minSpeed = Math.min(0, ...samples.map(({ speed }) => speed));
    const maxSpeed = Math.max(0, ...samples.map(({ speed }) => speed));
    const padding = Math.max((maxSpeed - minSpeed) * 0.12, 0.08);
    const range = maxSpeed - minSpeed + padding * 2;
    const yForSpeed = (speed: number) => 33 - ((speed - minSpeed + padding) / range) * 27;
    const path = samples.map(({ x, speed }, index) =>
      `${index === 0 ? 'M' : 'L'} ${(5 + x * 90).toFixed(2)} ${yForSpeed(speed).toFixed(2)}`).join(' ');
    const zeroY = yForSpeed(0);

    return (
      <svg className="curve-preset-preview" viewBox="0 0 100 38" aria-hidden="true">
        <path d={`M 5 ${zeroY.toFixed(2)} H 95`} className="curve-preset-baseline" />
        <path d={path} className={active ? 'curve-preset-shape is-active' : 'curve-preset-shape'} />
      </svg>
    );
  }

  const yValues = [0, 1, preset.p1.y, preset.p2.y];
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const padding = Math.max((maxY - minY) * 0.12, 0.08);
  const range = maxY - minY + padding * 2;
  const path = Array.from({ length: 41 }, (_, index) => {
    const point = evaluateBezier(index / 40, preset.p1.x, preset.p1.y, preset.p2.x, preset.p2.y);
    const x = 5 + point.x * 90;
    const y = 33 - ((point.y - minY + padding) / range) * 27;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  return (
    <svg className="curve-preset-preview" viewBox="0 0 100 38" aria-hidden="true">
      <path d="M 5 33 H 95" className="curve-preset-baseline" />
      <path d={path} className={active ? 'curve-preset-shape is-active' : 'curve-preset-shape'} />
    </svg>
  );
}

interface SidebarControlsProps {
  bezier: BezierPoints;
  settings: AnimationSettings;
  onBezierChange: (bezier: BezierPoints) => void;
  onSettingsChange: (settings: AnimationSettings) => void;
  activePreset: string;
  onPresetChange: (name: string) => void;
}

export function SidebarControls({
  bezier,
  settings,
  onBezierChange,
  onSettingsChange,
  activePreset,
  onPresetChange,
}: SidebarControlsProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [presetTab, setPresetTab] = useState<'default' | 'saved'>('default');
  const [savedPresetNames, setSavedPresetNames] = useState<string[]>(readSavedPresetNames);
  const [presetPreviewMode, setPresetPreviewMode] = useState<PresetPreviewMode>(readPresetPreviewMode);
  const velocity = useMemo(() => bezierToAEVelocity(bezier, settings), [bezier, settings]);
  const hasDisplacement = Math.abs(settings.endValue - settings.startValue) >= 1e-8;
  const filteredPresets = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return ALL_EASING_PRESETS.filter((item) =>
      (presetTab === 'default' || savedPresetNames.includes(item.name))
      && (selectedCategory === 'All' || item.category === selectedCategory)
      && (!query || `${item.name} ${item.category} ${item.description}`.toLocaleLowerCase().includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [presetTab, savedPresetNames, selectedCategory, searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(savedPresetNames));
    } catch (error) {
      console.warn('Could not save curve presets.', error);
    }
  }, [savedPresetNames]);

  useEffect(() => {
    try {
      localStorage.setItem(PRESET_PREVIEW_KEY, presetPreviewMode);
    } catch (error) {
      console.warn('Could not save preset preview preference.', error);
    }
  }, [presetPreviewMode]);

  const updateVelocity = (key: keyof typeof velocity, value: number) => {
    const next = {
      ...velocity,
      [key]: key.endsWith('Influence') ? Math.min(100, Math.max(0.1, value)) : value,
    };
    onBezierChange(aEVelocityToBezier(next, settings));
    onPresetChange('');
  };

  const updateSettings = (updates: Partial<AnimationSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const reset = () => {
    const preset = ALL_EASING_PRESETS.find(({ name }) => name === 'Easy Ease');
    if (!preset) return;
    onBezierChange({
      p0: { x: 0, y: 0 },
      p1: { ...preset.p1 },
      p2: { ...preset.p2 },
      p3: { x: 1, y: 1 },
    });
    onPresetChange(preset.name);
  };

  const matchesPreset = (item: EasingPreset) => {
    const epsilon = 0.015;
    return Math.abs(bezier.p1.x - item.p1.x) < epsilon
      && Math.abs(bezier.p1.y - item.p1.y) < epsilon
      && Math.abs(bezier.p2.x - item.p2.x) < epsilon
      && Math.abs(bezier.p2.y - item.p2.y) < epsilon;
  };

  const toggleSavedPreset = (name: string) => {
    setSavedPresetNames((saved) =>
      saved.includes(name) ? saved.filter((savedName) => savedName !== name) : [...saved, name]);
  };

  return (
    <aside className="curve-sidebar">
      <div className="curve-sidebar-title">
        <div className="flex items-center gap-2"><Sliders className="h-4 w-4 text-sky-400" /><h2>Parameters</h2></div>
        <button type="button" className="curve-small-icon" title="Reset to Easy Ease" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /></button>
      </div>

      <section className="curve-sidebar-section">
        <h3><span className="text-indigo-400">◈</span> Animation context</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="curve-field">Start value
            <input type="number" value={settings.startValue} onChange={(event) => updateSettings({ startValue: Number(event.target.value) || 0 })} />
          </label>
          <label className="curve-field">End value
            <input type="number" value={settings.endValue} onChange={(event) => updateSettings({ endValue: Number(event.target.value) || 0 })} />
          </label>
        </div>
        <div className="grid grid-cols-[1fr_82px] gap-2">
          <label className="curve-field">Duration (seconds)
            <input type="number" min="0.05" max="120" step="0.1" value={settings.duration} onChange={(event) => updateSettings({ duration: Math.max(0.05, Number(event.target.value) || 0.05) })} />
          </label>
          <label className="curve-field">Unit
            <select value={settings.unit} onChange={(event) => updateSettings({ unit: event.target.value })}>
              {['px', '%', 'deg', 'rem', 'vw', ''].map((unit) => <option key={unit || 'none'} value={unit}>{unit || 'none'}</option>)}
            </select>
          </label>
        </div>
        <label className="curve-field">Frame rate
          <select value={settings.fps} onChange={(event) => updateSettings({ fps: Number(event.target.value) })}>
            {[24, 25, 30, 48, 50, 60, 120].map((fps) => <option key={fps} value={fps}>{fps} fps</option>)}
          </select>
        </label>
        <div className="curve-frame-count">
          <span>Frames</span><strong>{Math.round(settings.duration * settings.fps)} @ {settings.fps} fps</strong>
        </div>
      </section>

      <section id="velocity" className="curve-sidebar-section">
        <h3><ArrowRightLeft className="h-3.5 w-3.5 text-emerald-400" /> After Effects velocity <span className="ml-auto text-[9px] font-medium normal-case tracking-normal text-emerald-400">Synced</span></h3>
        <div className="curve-velocity-card">
          <h4>Keyframe 1 · Outgoing</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="curve-field">Speed ({settings.unit || 'value'}/s)
              <input type="number" step="1" disabled={!hasDisplacement} value={Number(velocity.outgoingSpeed.toFixed(2))} onChange={(event) => updateVelocity('outgoingSpeed', Number(event.target.value) || 0)} />
            </label>
            <label className="curve-field">Influence (%)
              <input type="number" min="0.1" max="100" step="1" value={Number(velocity.outgoingInfluence.toFixed(1))} onChange={(event) => updateVelocity('outgoingInfluence', Number(event.target.value) || 0.1)} />
            </label>
          </div>
        </div>
        <div className="curve-velocity-card">
          <h4 className="text-indigo-300">Keyframe 2 · Incoming</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="curve-field">Speed ({settings.unit || 'value'}/s)
              <input type="number" step="1" disabled={!hasDisplacement} value={Number(velocity.incomingSpeed.toFixed(2))} onChange={(event) => updateVelocity('incomingSpeed', Number(event.target.value) || 0)} />
            </label>
            <label className="curve-field">Influence (%)
              <input type="number" min="0.1" max="100" step="1" value={Number(velocity.incomingInfluence.toFixed(1))} onChange={(event) => updateVelocity('incomingInfluence', Number(event.target.value) || 0.1)} />
            </label>
          </div>
        </div>
        {!hasDisplacement && <p className="text-[9px] leading-4 text-amber-300/80">With zero value change, keyframe speeds are zero; set different start and end values to edit velocity.</p>}
      </section>

      <section className="curve-sidebar-section">
        <div className="flex items-center justify-between">
          <h3><Sparkles className="h-3.5 w-3.5 text-amber-400" /> Curve browser</h3>
          <span className="text-[9px] text-slate-500">{filteredPresets.length} shown</span>
        </div>
        <div className="curve-preset-tabs" role="tablist" aria-label="Preset collection">
          <button type="button" role="tab" aria-selected={presetTab === 'default'} className={presetTab === 'default' ? 'active' : ''} onClick={() => setPresetTab('default')}>Default</button>
          <button type="button" role="tab" aria-selected={presetTab === 'saved'} className={presetTab === 'saved' ? 'active' : ''} onClick={() => setPresetTab('saved')}>Saved {savedPresetNames.length > 0 && <span>{savedPresetNames.length}</span>}</button>
        </div>
        <div className="curve-preset-preview-toggle" role="group" aria-label="Preset graph preview">
          <span>Preview</span>
          <div>
            <button type="button" aria-pressed={presetPreviewMode === 'value'} className={presetPreviewMode === 'value' ? 'active' : ''} onClick={() => setPresetPreviewMode('value')}>Value</button>
            <button type="button" aria-pressed={presetPreviewMode === 'speed'} className={presetPreviewMode === 'speed' ? 'active' : ''} onClick={() => setPresetPreviewMode('speed')}>Speed</button>
          </div>
        </div>
        <label className="curve-search">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input aria-label="Search easing presets" type="search" placeholder="Search presets..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
        </label>
        <label className="curve-preset-filter">Category
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            {EASING_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <div className="curve-preset-list">
          {filteredPresets.map((item) => {
            const active = matchesPreset(item);
            return (
              <article className={active ? 'curve-preset-card active' : 'curve-preset-card'} key={item.name}>
                <button
                  type="button"
                  title={`${item.name}: ${item.description}\ncubic-bezier(${item.p1.x}, ${item.p1.y}, ${item.p2.x}, ${item.p2.y})`}
                  aria-pressed={active}
                  onClick={() => {
                    onBezierChange({ p0: { x: 0, y: 0 }, p1: { ...item.p1 }, p2: { ...item.p2 }, p3: { x: 1, y: 1 } });
                    onPresetChange(item.name);
                  }}
                  className="curve-preset-apply"
                >
                  <PresetCurve preset={item} active={active} mode={presetPreviewMode} />
                  <span className="curve-preset-name">{item.name}</span>
                  {active && <Check className="curve-preset-check h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  className={savedPresetNames.includes(item.name) ? 'curve-preset-save is-saved' : 'curve-preset-save'}
                  aria-label={savedPresetNames.includes(item.name) ? `Remove ${item.name} from saved presets` : `Save ${item.name}`}
                  aria-pressed={savedPresetNames.includes(item.name)}
                  title={savedPresetNames.includes(item.name) ? 'Remove from Saved' : 'Save preset'}
                  onClick={() => toggleSavedPreset(item.name)}
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              </article>
            );
          })}
          {filteredPresets.length === 0 && <p className="curve-preset-empty">{presetTab === 'saved' && savedPresetNames.length === 0 ? 'Save a curve with the star to keep it here.' : 'No matching presets.'}</p>}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
        <button type="button" className="curve-transform-button" onClick={() => {
          onBezierChange({ ...bezier, p1: { ...bezier.p1, y: 1 - bezier.p1.y }, p2: { ...bezier.p2, y: 1 - bezier.p2.y } });
          onPresetChange('');
        }}><FlipVertical className="h-3.5 w-3.5" /> Invert Y</button>
        <button type="button" className="curve-transform-button" onClick={() => {
          onBezierChange({
            ...bezier,
            p1: { x: 1 - bezier.p2.x, y: 1 - bezier.p2.y },
            p2: { x: 1 - bezier.p1.x, y: 1 - bezier.p1.y },
          });
          onPresetChange('');
        }}><FlipHorizontal className="h-3.5 w-3.5" /> Reverse X</button>
      </div>
    </aside>
  );
}
