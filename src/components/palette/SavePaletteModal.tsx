import React, { useState } from 'react';
import { X, Plus, Folder, Check, Heart } from 'lucide-react';
import { Palette, Collection } from '../../types';

interface SavePaletteModalProps {
  palette: Palette | null;
  isOpen: boolean;
  collections: Collection[];
  onClose: () => void;
  onSaveToCollection: (palette: Palette, collectionId: string) => void;
  onCreateCollection: (name: string) => string;
  onToast: (msg: string) => void;
}

export const SavePaletteModal: React.FC<SavePaletteModalProps> = ({
  palette,
  isOpen,
  collections,
  onClose,
  onSaveToCollection,
  onCreateCollection,
  onToast,
}) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    collections[0]?.id || 'favs'
  );
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  if (!isOpen || !palette) return null;

  const handleCreateAndSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      const newId = onCreateCollection(newCollectionName.trim());
      setSelectedCollectionId(newId);
      setNewCollectionName('');
      setShowCreateNew(false);
      onToast(`Created collection "${newCollectionName.trim()}"`);
    }
  };

  const handleConfirmSave = () => {
    onSaveToCollection(palette, selectedCollectionId);
    const col = collections.find((c) => c.id === selectedCollectionId);
    onToast(`Saved "${palette.name}" to ${col?.name || 'Favorites'}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Save to Collection</h3>
              <p className="text-xs text-gray-400">Choose where to organize this palette</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-900">{palette.name}</span>
            <span className="text-[10px] text-gray-400">{palette.colors.length} colors</span>
          </div>
          <div className="h-10 w-full flex rounded-xl overflow-hidden border border-gray-200 shadow-2xs">
            {palette.colors.map((c, i) => (
              <div
                key={i}
                style={{ backgroundColor: c.hex }}
                className="flex-1 h-full"
                title={c.hex}
              />
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Select Collection
            </span>
            <button
              onClick={() => setShowCreateNew(!showCreateNew)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Collection</span>
            </button>
          </div>

          {showCreateNew && (
            <form onSubmit={handleCreateAndSelect} className="flex gap-2">
              <input
                type="text"
                placeholder="Collection name (e.g. Summer Campaign)..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </form>
          )}

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {collections.map((col) => {
              const isSelected = selectedCollectionId === col.id;
              const hasPalette = col.paletteIds.includes(palette.id);

              return (
                <div
                  key={col.id}
                  onClick={() => setSelectedCollectionId(col.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-white border-gray-200/80 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{col.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {col.paletteIds.length} palettes {hasPalette && '• Already saved'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 font-bold" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            Save Palette
          </button>
        </div>
      </div>
    </div>
  );
};
