import { Suspense, lazy, useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchTagBar } from './components/palette/SearchTagBar';
import { FilterPanel } from './components/palette/FilterPanel';
import { PaletteGrid } from './components/palette/PaletteGrid';
import { PaletteDetailModal } from './components/palette/PaletteDetailModal';
import { PaletteGeneratorWorkspace } from './components/palette/PaletteGeneratorWorkspace';
import { PaletteCompleter } from './components/palette/PaletteCompleter';
import { ContrastChecker } from './components/palette/ContrastChecker';
import { ImageColorPicker } from './components/palette/ImageColorPicker';
import { PaletteVisualizer } from './components/palette/PaletteVisualizer';
import { UserDashboard } from './components/palette/UserDashboard';
import { SavePaletteModal } from './components/palette/SavePaletteModal';
import { Toast } from './components/Toast';
import { VideoBriefStudio, createVideoColorBrief } from './components/palette/VideoBriefStudio';
import { ScriptSplitter } from './components/script/ScriptSplitter';
import {
  Compass,
  WandSparkles,
  Sparkles,
  Eye,
  SlidersHorizontal,
  Image as ImageIcon,
  FolderHeart,
  Video,
} from 'lucide-react';

import { getPalettesForFilter } from './data/paletteDatabase';
import {
  Palette, 
  FilterState, 
  ActiveView, 
  Collection, 
  Project,
  VideoColorBrief,
} from './types';

const FontSelector = lazy(() =>
  import('./components/font/FontSelector').then((module) => ({ default: module.FontSelector }))
);

const DEFAULT_FILTER_STATE: FilterState = {
  searchQuery: '',
  tags: [],
  selectedColors: [],
  customHex: undefined,
  selectedStyles: [],
  selectedTopics: [],
  sortOrder: 'popular',
  advanced: {
    hueRange: [0, 360],
    saturationMin: 0,
    brightnessMin: 0,
    temperature: 'all',
    numColors: null,
    wcagAA: false,
    wcagAAA: false,
    colorBlindFriendly: false,
    simulationMode: 'normal',
  },
};

const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-favs',
    name: 'Favorites',
    paletteIds: ['pal-p-1', 'pal-p-2'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'col-brand',
    name: 'Brand Colors',
    paletteIds: ['pal-p-6'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'col-web',
    name: 'Website Project',
    paletteIds: ['pal-p-4'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'col-summer',
    name: 'Summer Collection',
    paletteIds: ['pal-p-12'],
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Fintech Mobile App',
    paletteIds: ['pal-p-16', 'pal-p-34'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Nordic Ceramic Studio',
    paletteIds: ['pal-p-3', 'pal-p-45'],
    createdAt: new Date().toISOString(),
  },
];

const WORKSPACE_LINKS = [
  { view: 'explore', label: 'Explore', icon: Compass },
  { view: 'generator', label: 'Palette Studio', icon: WandSparkles },
  { view: 'completer', label: 'Color Completer', icon: Sparkles },
  { view: 'visualizer', label: 'Visualizer', icon: Eye },
  { view: 'contrast', label: 'Contrast Checker', icon: SlidersHorizontal },
  { view: 'image-picker', label: 'Image Color Picker', icon: ImageIcon },
  { view: 'dashboard', label: 'Saved Library', icon: FolderHeart },
  { view: 'video-briefs', label: 'Video Briefs', icon: Video },
] as const;

const isVideoColorBrief = (value: unknown): value is VideoColorBrief => {
  if (!value || typeof value !== 'object') return false;
  const brief = value as Partial<VideoColorBrief>;
  const status = brief.status;
  const deliveryFormat = brief.deliveryFormat;
  const palette = brief.palette;
  const validStatuses = ['draft', 'in-review', 'changes-requested', 'approved'];
  const validDeliveryFormats = ['rec709', 'rec2020-hlg', 'rec2020-pq', 'not-specified'];

  return (
    typeof brief.id === 'string' &&
    typeof brief.title === 'string' &&
    typeof brief.revision === 'number' &&
    typeof brief.clientName === 'string' &&
    typeof brief.projectName === 'string' &&
    typeof brief.notes === 'string' &&
    typeof brief.referenceFrameUrl === 'string' &&
    (brief.visualizerImageDataUrl === undefined || typeof brief.visualizerImageDataUrl === 'string') &&
    (brief.exportSections === undefined || (
      typeof brief.exportSections === 'object' &&
      Object.values(brief.exportSections).every((included) => typeof included === 'boolean')
    )) &&
    typeof brief.createdAt === 'string' &&
    typeof brief.updatedAt === 'string' &&
    !!palette &&
    typeof palette === 'object' &&
    typeof palette.name === 'string' &&
    Array.isArray(palette.colors) &&
    Array.isArray(brief.roles) &&
    brief.roles.every((role) =>
      typeof role.id === 'string' &&
      typeof role.label === 'string' &&
      typeof role.colorHex === 'string' &&
      typeof role.usage === 'string'
    ) &&
    typeof status === 'string' &&
    validStatuses.includes(status) &&
    typeof deliveryFormat === 'string' &&
    validDeliveryFormats.includes(deliveryFormat)
  );
};

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const saved = localStorage.getItem('palettelab_active_view');
    return (saved as ActiveView) || 'explore';
  });
  const [videoBriefs, setVideoBriefs] = useState<VideoColorBrief[]>(() => {
    try {
      const saved = localStorage.getItem('palettelab_video_briefs');
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter(isVideoColorBrief) : [];
    } catch {
      return [];
    }
  });
  const [activeVideoBriefId, setActiveVideoBriefId] = useState<string | null>(() => {
    return localStorage.getItem('palettelab_active_video_brief');
  });
  const [filterPanelExpanded, setFilterPanelExpanded] = useState(true);

  const [displayLimit, setDisplayLimit] = useState(36);

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('palettelab_collections');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('palettelab_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const savedPaletteIds = useMemo(() => {
    const all = new Set<string>();
    collections.forEach((c) => c.paletteIds.forEach((id) => all.add(id)));
    return Array.from(all);
  }, [collections]);

  const [likedPaletteIds, setLikedPaletteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('palettelab_liked_ids');
    return saved ? JSON.parse(saved) : ['pal-p-1', 'pal-p-5'];
  });

  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);

  useEffect(() => {
    setDisplayLimit(36);
  }, [
    filterState.selectedColors, 
    filterState.selectedStyles, 
    filterState.selectedTopics, 
    filterState.tags, 
    filterState.searchQuery, 
    filterState.customHex,
    filterState.sortOrder,
    filterState.advanced
  ]);

  const { currentPalettes, totalCount } = useMemo(() => {
    const { palettes, totalCount } = getPalettesForFilter(filterState, 0, displayLimit);
    return { currentPalettes: palettes, totalCount };
  }, [filterState, displayLimit]);
  const hasAdvancedPaletteFilters =
    filterState.advanced.hueRange[0] !== 0 ||
    filterState.advanced.hueRange[1] !== 360 ||
    filterState.advanced.saturationMin > 0 ||
    filterState.advanced.brightnessMin > 0 ||
    filterState.advanced.temperature !== 'all' ||
    filterState.advanced.numColors !== null ||
    filterState.advanced.wcagAA ||
    filterState.advanced.wcagAAA ||
    filterState.advanced.colorBlindFriendly;

  const [selectedPaletteForModal, setSelectedPaletteForModal] = useState<Palette | null>(null);
  const [paletteToSave, setPaletteToSave] = useState<Palette | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const [selectedPaletteForStudio, setSelectedPaletteForStudio] = useState<Palette | null>(() => {
    const saved = localStorage.getItem('palettelab_studio_palette');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [selectedPaletteForVisualizer, setSelectedPaletteForVisualizer] = useState<Palette>(() => {
    const saved = localStorage.getItem('palettelab_visualizer_palette');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return currentPalettes[0] || null;
  });

  const [selectedPaletteForContrast, setSelectedPaletteForContrast] = useState<Palette | null>(() => {
    const saved = localStorage.getItem('palettelab_contrast_palette');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return currentPalettes[0] || null;
  });

  const [contrastColors, setContrastColors] = useState<{ fg: string; bg: string }>(() => {
    const saved = localStorage.getItem('palettelab_contrast_colors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return { fg: '#FFFFFF', bg: '#264653' };
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  useEffect(() => {
    localStorage.setItem('palettelab_active_view', activeView);
  }, [activeView]);

  useEffect(() => {
    if (selectedPaletteForVisualizer) {
      localStorage.setItem('palettelab_visualizer_palette', JSON.stringify(selectedPaletteForVisualizer));
    }
  }, [selectedPaletteForVisualizer]);

  useEffect(() => {
    if (selectedPaletteForStudio) {
      localStorage.setItem('palettelab_studio_palette', JSON.stringify(selectedPaletteForStudio));
    }
  }, [selectedPaletteForStudio]);

  useEffect(() => {
    localStorage.setItem('palettelab_contrast_colors', JSON.stringify(contrastColors));
  }, [contrastColors]);

  useEffect(() => {
    localStorage.setItem('palettelab_liked_ids', JSON.stringify(likedPaletteIds));
  }, [likedPaletteIds]);

  useEffect(() => {
    localStorage.setItem('palettelab_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('palettelab_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('palettelab_video_briefs', JSON.stringify(videoBriefs));
  }, [videoBriefs]);

  useEffect(() => {
    if (activeVideoBriefId) {
      localStorage.setItem('palettelab_active_video_brief', activeVideoBriefId);
    } else {
      localStorage.removeItem('palettelab_active_video_brief');
    }
  }, [activeVideoBriefId]);

  const handleOpenSaveModal = (palette: Palette) => {
    setPaletteToSave(palette);
    setSaveModalOpen(true);
  };

  const handleSaveToCollection = (palette: Palette, collectionId: string) => {
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id === collectionId) {
          const ids = col.paletteIds.includes(palette.id)
            ? col.paletteIds
            : [...col.paletteIds, palette.id];
          return { ...col, paletteIds: ids };
        }
        return col;
      })
    );

    if (!likedPaletteIds.includes(palette.id)) {
      setLikedPaletteIds((prev) => [...prev, palette.id]);
    }
  };

  const handleCreateCollection = (name: string): string => {
    const newId = `col-${Date.now()}`;
    setCollections((prev) => [
      ...prev,
      {
        id: newId,
        name,
        paletteIds: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    return newId;
  };

  const handleOpenInGenerator = (palette: Palette) => {
    setSelectedPaletteForStudio(palette);
    setActiveView('generator');
  };

  const handleOpenInVisualizer = (palette: Palette) => {
    setSelectedPaletteForVisualizer(palette);
    localStorage.setItem('palettelab_visualizer_palette', JSON.stringify(palette));
    localStorage.setItem('palettelab_active_view', 'visualizer');
    setActiveView('visualizer');
  };

  const handleOpenInContrast = (paletteOrColor1: Palette | string, color2?: string) => {
    if (typeof paletteOrColor1 === 'string' && color2) {
      setContrastColors({ fg: paletteOrColor1, bg: color2 });
    } else if (typeof paletteOrColor1 === 'object' && paletteOrColor1.colors && paletteOrColor1.colors.length >= 2) {
      setContrastColors({ fg: paletteOrColor1.colors[0].hex, bg: paletteOrColor1.colors[1].hex });
      setSelectedPaletteForContrast(paletteOrColor1);
      localStorage.setItem('palettelab_contrast_palette', JSON.stringify(paletteOrColor1));
    }
    setActiveView('contrast');
  };

  const handleCreateVideoBrief = (palette: Palette, visualizerImageDataUrl?: string) => {
    const brief = createVideoColorBrief(palette, visualizerImageDataUrl);
    setVideoBriefs((previous) => [brief, ...previous]);
    setActiveVideoBriefId(brief.id);
    setActiveView('video-briefs');
    showToast('Video color brief created. Add the client and project details.');
  };

  const handleCreateRevision = (previous: VideoColorBrief) => {
    const revision: VideoColorBrief = {
      ...previous,
      id: `brief-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      revision: previous.revision + 1,
      status: 'draft',
      approvedAt: undefined,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setVideoBriefs((items) => [revision, ...items]);
    setActiveVideoBriefId(revision.id);
    showToast(`Revision ${revision.revision} created as a new draft.`);
  };

  const handleDeleteVideoBrief = (briefId: string) => {
    const remainingBriefs = videoBriefs.filter((brief) => brief.id !== briefId);
    setVideoBriefs(remainingBriefs);
    if (activeVideoBriefId === briefId) {
      const nextBrief = [...remainingBriefs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      setActiveVideoBriefId(nextBrief?.id || null);
    }
    showToast('Video brief revision deleted.');
  };

  const savedPalettesList = useMemo(() => {
    return currentPalettes.filter((p) => savedPaletteIds.includes(p.id));
  }, [currentPalettes, savedPaletteIds]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        savedPalettesCount={savedPaletteIds.length}
      />

      <div className="sticky top-[60px] z-30 border-b border-gray-200 bg-gray-50/95 shadow-xs backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 md:px-8">
          <nav
            aria-label="Workspace tools"
            className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
          >
            {WORKSPACE_LINKS.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                aria-current={activeView === view ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  activeView === view
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-transparent bg-white text-gray-600 hover:border-gray-200 hover:bg-white hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeView === 'explore' && (
        <main className="flex-1">
          <SearchTagBar
            filterState={filterState}
            onAddTag={(tag) =>
              setFilterState((prev) => ({
                ...prev,
                tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag],
              }))
            }
            onRemoveTag={(tag) =>
              setFilterState((prev) => ({
                ...prev,
                tags: prev.tags.filter((t) => t !== tag),
              }))
            }
            onRemoveColor={(color) =>
              setFilterState((prev) => ({
                ...prev,
                selectedColors: prev.selectedColors.filter((c) => c !== color),
              }))
            }
            onRemoveStyle={(style) =>
              setFilterState((prev) => ({
                ...prev,
                selectedStyles: prev.selectedStyles.filter((s) => s !== style),
              }))
            }
            onRemoveTopic={(topic) =>
              setFilterState((prev) => ({
                ...prev,
                selectedTopics: prev.selectedTopics.filter((t) => t !== topic),
              }))
            }
            onSearchChange={(q) =>
              setFilterState((prev) => ({ ...prev, searchQuery: q }))
            }
            filterPanelExpanded={filterPanelExpanded}
            onToggleFilterPanel={() => setFilterPanelExpanded(!filterPanelExpanded)}
            totalResultsCount={totalCount}
          />

          <FilterPanel
            filterState={filterState}
            onToggleColor={(c) =>
              setFilterState((prev) => ({
                ...prev,
                selectedColors: prev.selectedColors.includes(c)
                  ? prev.selectedColors.filter((item) => item !== c)
                  : [c],
              }))
            }
            onToggleStyle={(s) =>
              setFilterState((prev) => ({
                ...prev,
                selectedStyles: prev.selectedStyles.includes(s)
                  ? prev.selectedStyles.filter((item) => item !== s)
                  : [s],
              }))
            }
            onToggleTopic={(t) =>
              setFilterState((prev) => ({
                ...prev,
                selectedTopics: prev.selectedTopics.includes(t)
                  ? prev.selectedTopics.filter((item) => item !== t)
                  : [t],
              }))
            }
            onSetSortOrder={(order) =>
              setFilterState((prev) => ({ ...prev, sortOrder: order }))
            }
            onSetCustomHex={(hex) =>
              setFilterState((prev) => ({ ...prev, customHex: hex }))
            }
            onUpdateAdvanced={(updates) =>
              setFilterState((prev) => ({
                ...prev,
                advanced: { ...prev.advanced, ...updates },
              }))
            }
            onClearAll={() => setFilterState(DEFAULT_FILTER_STATE)}
            isExpanded={filterPanelExpanded}
            onToggleExpand={() => setFilterPanelExpanded(!filterPanelExpanded)}
          />

          <PaletteGrid
            palettes={currentPalettes}
            totalAvailableCount={totalCount}
            hasAdvancedPaletteFilters={hasAdvancedPaletteFilters}
            savedPaletteIds={savedPaletteIds}
            onOpenDetails={(palette) => setSelectedPaletteForModal(palette)}
            onOpenSaveModal={handleOpenSaveModal}
            onCopyHex={(hex) => showToast(`${hex} copied to clipboard!`)}
            onOpenInVisualizer={handleOpenInVisualizer}
            onOpenInContrast={handleOpenInContrast}
            onClearFilters={() => setFilterState(DEFAULT_FILTER_STATE)}
            onLoadMore={() => setDisplayLimit((prev) => prev + 36)}
            simulationMode={filterState.advanced.simulationMode}
          />
        </main>
      )}

      {activeView === 'completer' && (
        <PaletteCompleter
          onOpenInVisualizer={handleOpenInVisualizer}
          onOpenInGenerator={handleOpenInGenerator}
          onOpenSaveModal={handleOpenSaveModal}
          onOpenInContrast={handleOpenInContrast}
          onToast={showToast}
        />
      )}

      {activeView === 'video-briefs' && (
        <VideoBriefStudio
          briefs={videoBriefs}
          activeBriefId={activeVideoBriefId}
          onSelectBrief={setActiveVideoBriefId}
          onDeleteBrief={handleDeleteVideoBrief}
          onUpdateBrief={(updatedBrief) =>
            setVideoBriefs((previous) =>
              previous.map((brief) => brief.id === updatedBrief.id ? updatedBrief : brief)
            )
          }
          onCreateRevision={handleCreateRevision}
          onOpenExplore={() => setActiveView('explore')}
          onToast={showToast}
        />
      )}

      {activeView === 'generator' && (
        <PaletteGeneratorWorkspace
          initialPalette={selectedPaletteForStudio}
          onSavePalette={(palette) => handleOpenSaveModal(palette)}
          onOpenInVisualizer={handleOpenInVisualizer}
          onOpenInContrast={handleOpenInContrast}
          onToast={showToast}
        />
      )}

      {activeView === 'visualizer' && (
        <PaletteVisualizer
          palette={selectedPaletteForVisualizer || currentPalettes[0]}
          onOpenInContrast={handleOpenInContrast}
          onCreateVideoBrief={handleCreateVideoBrief}
          onToast={showToast}
        />
      )}

      {activeView === 'script-splitter' && <ScriptSplitter />}

      {activeView === 'font-selector' && (
        <Suspense fallback={<main className="min-h-[calc(100vh-60px)] bg-[#080b11] p-8 text-sm text-white">Loading Font Selector…</main>}>
          <FontSelector onToast={showToast} />
        </Suspense>
      )}

      {activeView === 'contrast' && (
        <ContrastChecker
          initialForeground={contrastColors.fg}
          initialBackground={contrastColors.bg}
          palette={selectedPaletteForContrast || selectedPaletteForVisualizer || currentPalettes[0]}
          onToast={showToast}
        />
      )}

      {activeView === 'image-picker' && (
        <ImageColorPicker
          onOpenInGenerator={handleOpenInGenerator}
          onOpenInVisualizer={handleOpenInVisualizer}
          onOpenSaveModal={handleOpenSaveModal}
          onOpenInContrast={handleOpenInContrast}
          onToast={showToast}
        />
      )}

      {activeView === 'dashboard' && (
        <UserDashboard
          savedPalettes={savedPalettesList}
          likedPaletteIds={likedPaletteIds}
          collections={collections}
          projects={projects}
          onCreateCollection={(name) => handleCreateCollection(name)}
          onCreateProject={(name) =>
            setProjects((prev) => [
              ...prev,
              {
                id: `proj-${Date.now()}`,
                name,
                paletteIds: [],
                createdAt: new Date().toISOString(),
              },
            ])
          }
          onOpenDetails={(palette) => setSelectedPaletteForModal(palette)}
          onOpenInGenerator={handleOpenInGenerator}
          onOpenInVisualizer={handleOpenInVisualizer}
          onOpenInContrast={handleOpenInContrast}
          onDeleteSaved={(id) =>
            setCollections((prev) =>
              prev.map((c) => ({
                ...c,
                paletteIds: c.paletteIds.filter((pid) => pid !== id),
              }))
            )
          }
          onCopyHex={(hex) => showToast(`${hex} copied to clipboard!`)}
          onToast={showToast}
        />
      )}

      <PaletteDetailModal
        palette={selectedPaletteForModal}
        onClose={() => setSelectedPaletteForModal(null)}
        onOpenInGenerator={handleOpenInGenerator}
        onOpenInVisualizer={handleOpenInVisualizer}
        onOpenInContrast={handleOpenInContrast}
        onSaveToCollection={handleOpenSaveModal}
        isSaved={
          selectedPaletteForModal
            ? savedPaletteIds.includes(selectedPaletteForModal.id)
            : false
        }
        onToast={showToast}
      />

      <SavePaletteModal
        palette={paletteToSave}
        isOpen={saveModalOpen}
        collections={collections}
        onClose={() => setSaveModalOpen(false)}
        onSaveToCollection={handleSaveToCollection}
        onCreateCollection={handleCreateCollection}
        onToast={showToast}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
