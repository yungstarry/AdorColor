import React, { useState } from 'react';
import { 
  FolderHeart, 
  Folder, 
  Plus, 
  Layers, 
  Trash2, 
} from 'lucide-react';
import { Palette, Collection, Project } from '../types';
import { PaletteCard } from './PaletteCard';

interface UserDashboardProps {
  savedPalettes: Palette[];
  likedPaletteIds: string[];
  collections: Collection[];
  projects: Project[];
  onCreateCollection: (name: string) => void;
  onCreateProject: (name: string) => void;
  onOpenDetails: (palette: Palette) => void;
  onOpenInGenerator: (palette: Palette) => void;
  onOpenInVisualizer: (palette: Palette) => void;
  onOpenInContrast?: (palette: Palette) => void;
  onToggleLike?: (paletteId: string) => void;
  onDeleteSaved: (paletteId: string) => void;
  onCopyHex: (hex: string) => void;
  onToast: (msg: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  savedPalettes,
  collections,
  projects,
  onCreateCollection,
  onCreateProject,
  onOpenDetails,
  onOpenInVisualizer,
  onOpenInContrast,
  onDeleteSaved,
  onCopyHex,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'collections' | 'projects'>('saved');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowCreateCollection(false);
      onToast(`Created collection "${newCollectionName.trim()}"`);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setShowCreateProject(false);
      onToast(`Created project "${newProjectName.trim()}"`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Your Palette Library</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your saved palettes, client projects, and curated brand collections.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Saved Palettes ({savedPalettes.length})
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'collections'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Collections ({collections.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Projects ({projects.length})
          </button>
        </div>
      </div>

      {activeTab === 'saved' && (
        <div className="py-8">
          {savedPalettes.length === 0 ? (
            <div className="py-20 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-4">
                <FolderHeart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No saved palettes yet</h3>
              <p className="text-xs text-gray-500 mb-6">
                When you explore or generate palettes, click the bookmark icon to save them to your library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedPalettes.map((palette) => (
                <div key={palette.id} className="relative group">
                  <PaletteCard
                    palette={palette}
                    isSaved={true}
                    onOpenDetails={onOpenDetails}
                    onOpenSaveModal={() => onDeleteSaved(palette.id)}
                    onCopyHex={onCopyHex}
                    onOpenInVisualizer={onOpenInVisualizer}
                    onOpenInContrast={onOpenInContrast}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSaved(palette.id);
                      onToast('Palette removed from saved library.');
                    }}
                    className="absolute top-2 left-2 p-1.5 rounded-xl bg-white/90 backdrop-blur-md text-gray-400 hover:text-rose-600 hover:bg-white shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove from library"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Curated Collections
            </h3>
            <button
              onClick={() => setShowCreateCollection(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Collection</span>
            </button>
          </div>

          {showCreateCollection && (
            <form
              onSubmit={handleCreateCollection}
              className="mb-6 p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 max-w-md"
            >
              <input
                type="text"
                placeholder="Collection name (e.g. Summer 2026, Brand Kit)..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateCollection(false)}
                className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => (
              <div
                key={col.id}
                className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{col.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {col.paletteIds.length} palettes saved
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Created {new Date(col.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
                    View &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Client &amp; Product Projects
            </h3>
            <button
              onClick={() => setShowCreateProject(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>

          {showCreateProject && (
            <form
              onSubmit={handleCreateProject}
              className="mb-6 p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 max-w-md"
            >
              <input
                type="text"
                placeholder="Project name (e.g. Website Redesign, Mobile App)..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateProject(false)}
                className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{proj.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {proj.paletteIds.length} palettes &amp; design assets
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Created {new Date(proj.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-purple-600 hover:underline cursor-pointer">
                    Manage &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
