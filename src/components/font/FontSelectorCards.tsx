import type { Dispatch, SetStateAction } from 'react';
import { Heart, Star, Trash2, X } from 'lucide-react';
import { keyFor, normalize, type CombinationEntry, type FontEntry, type LibraryState } from './fontSelectorModel';
import { FontChips } from './FontChips';

interface FontCardProps {
  font: FontEntry;
  library: Pick<LibraryState, 'categories' | 'projects'>;
  compareIds: string[];
  onFontUpdate: (id: string, update: Partial<FontEntry>) => void;
  onToggleFavorite: (font: FontEntry) => void;
  onCompare: (id: string) => void;
  onAddToProject: (font: FontEntry, projectId: string) => void;
  onDelete: (id: string) => void;
}

export function FontCard({ font, library, compareIds, onFontUpdate, onToggleFavorite, onCompare, onAddToProject, onDelete }: FontCardProps) {
  return (
    <article key={font.id} className="overflow-hidden rounded-2xl border border-[#303c50] bg-[#121925] shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:border-violet-300/50">
      <div className="border-b border-[#303c50] bg-gradient-to-br from-[#202b3e] to-[#131b29] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">Font record</p>
            <input aria-label="Font name" value={font.name} onChange={(event) => onFontUpdate(font.id, { name: event.target.value })} className="mt-2 w-full break-words bg-transparent text-xl font-bold tracking-tight text-white outline-none focus:ring-1 focus:ring-violet-300/50" />
          </div>
          <button type="button" onClick={() => onToggleFavorite(font)} aria-label={`${font.favorite ? 'Unfavorite' : 'Favorite'} ${font.name}`} className={`rounded-xl border p-2.5 ${font.favorite ? 'border-rose-300/30 bg-rose-300/10 text-rose-300' : 'border-[#455168] text-[#aab7ca] hover:text-rose-300'}`}>
            <Heart className="h-4 w-4" fill={font.favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-[#e3e9f3]">Aa <span className="text-base font-normal text-[#b8c4d5]">SAMPLE TYPE</span></p>
        <p className="mt-2 text-[10px] text-[#b8c4d5]">Metadata preview · actual font file not required</p>
      </div>
      <div className="space-y-4 p-4">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-200">Roles
          <input list="font-role-options" value={font.roles.join(', ')} onChange={(event) => onFontUpdate(font.id, { roles: [...new Set(event.target.value.split(',').map(normalize).filter(Boolean))] })} placeholder="Primary, Hook, Supporting, Accent..." className="mt-2 w-full rounded-lg border border-violet-300/25 bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
        </label>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#adbbce]">Categories</p>
          <FontChips values={font.categories} />
          <select
            aria-label={`Add category to ${font.name}`}
            value=""
            onChange={(event) => {
              const category = event.target.value;
              if (category && !font.categories.includes(category)) onFontUpdate(font.id, { categories: [...font.categories, category] });
            }}
            className="mt-2 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2 text-xs text-white outline-none focus:border-violet-300/60"
          >
            <option value="">+ Add a category</option>
            {library.categories.filter((category) => !font.categories.includes(category)).map((category) => <option key={category}>{category}</option>)}
          </select>
          {font.categories.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{font.categories.map((category) => <button key={category} type="button" title={`Remove ${category}`} onClick={() => onFontUpdate(font.id, { categories: font.categories.filter((item) => item !== category) })} className="rounded-md bg-[#1b2636] px-2 py-1 text-[10px] text-[#d0d9e6] hover:bg-rose-400/15 hover:text-rose-200">{category} ×</button>)}</div>}
        </div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#adbbce]">Tags
          <input value={font.tags.join(', ')} onChange={(event) => onFontUpdate(font.id, { tags: [...new Set(event.target.value.split(',').map(normalize).filter(Boolean))] })} placeholder="Bold, Editorial, Reels" className="mt-2 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
        </label>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#adbbce]">Description
          <input value={font.description} onChange={(event) => onFontUpdate(font.id, { description: event.target.value })} placeholder="What makes this font useful?" className="mt-2 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
        </label>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#adbbce]">Personal notes
          <textarea value={font.notes} onChange={(event) => onFontUpdate(font.id, { notes: event.target.value })} rows={2} placeholder="Use for large cinematic titles..." className="mt-2 w-full resize-y rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
        </label>
        <div className="flex items-center justify-between border-t border-[#303c50] pt-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onCompare(font.id)} className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${compareIds.includes(font.id) ? 'border-violet-300/50 bg-violet-300/10 text-violet-100' : 'border-[#46536a] text-[#c3cede] hover:border-violet-300/30'}`}>{compareIds.includes(font.id) ? '✓ Comparing' : 'Compare'}</button>
            {library.projects.length > 0 && <select aria-label={`Add ${font.name} to project`} value="" onChange={(event) => onAddToProject(font, event.target.value)} className="max-w-32 rounded-lg border border-[#46536a] bg-[#0b111b] px-2 py-2 text-[10px] text-white">
              <option value="">Add to project</option>{library.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>}
          </div>
          <button type="button" onClick={() => onDelete(font.id)} aria-label={`Delete ${font.name}`} className="rounded-lg p-2 text-[#96a4b8] hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </article>
  );
}

interface CombinationCardProps {
  combo: CombinationEntry;
  library: LibraryState;
  setLibrary: Dispatch<SetStateAction<LibraryState>>;
  fontsByName: Map<string, FontEntry>;
  fontsById: Map<string, FontEntry>;
  markUsed: (ids: string[]) => void;
}

export function CombinationCard({ combo, library, setLibrary, fontsByName, fontsById, markUsed }: CombinationCardProps) {
  return (
    <article key={combo.id} className="rounded-2xl border border-[#303c50] bg-[#121925] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input aria-label="Combination name" value={combo.name} onChange={(event) => setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, name: event.target.value, updatedAt: Date.now() } : item) }))} className="w-full bg-transparent text-base font-bold text-white outline-none" />
          <input aria-label={`Best for ${combo.name}`} value={combo.bestFor} onChange={(event) => setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, bestFor: event.target.value, updatedAt: Date.now() } : item) }))} placeholder="Best for (e.g. Reels)" className="mt-1 w-full bg-transparent text-xs text-violet-200 outline-none placeholder:text-[#8492a7]" />
          <input aria-label={`${combo.name} description`} value={combo.description} onChange={(event) => setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, description: event.target.value } : item) }))} placeholder="Describe where this combination works" className="mt-1 w-full bg-transparent text-xs text-[#c0cada] outline-none placeholder:text-[#8492a7]" />
        </div>
        <button type="button" onClick={() => setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, favorite: !item.favorite } : item) }))} aria-label={`${combo.favorite ? 'Unfavorite' : 'Favorite'} ${combo.name}`} className={`rounded-lg p-2 ${combo.favorite ? 'text-amber-300' : 'text-[#99a7ba] hover:text-amber-300'}`}><Star className="h-4 w-4" fill={combo.favorite ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {combo.fontNames.map((fontName) => {
          const font = fontsByName.get(keyFor(fontName));
          return <span key={fontName} className="inline-flex items-center gap-1.5 rounded-lg border border-[#3a465b] bg-[#1a2434] px-2.5 py-1.5 text-xs text-[#e0e7f1]">
            {font?.name ?? fontName}
            <button type="button" aria-label={`Remove ${fontName} from ${combo.name}`} onClick={() => setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, fontNames: item.fontNames.filter((name) => keyFor(name) !== keyFor(fontName)) } : item) }))} className="text-[#91a0b5] hover:text-rose-300"><X className="h-3 w-3" /></button>
          </span>;
        })}
        <select aria-label={`Add font to ${combo.name}`} value="" onChange={(event) => {
          const id = event.target.value;
          const font = fontsById.get(id);
          if (!font || combo.fontNames.some((name) => keyFor(name) === keyFor(font.name))) return;
          markUsed([id]);
          setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, fontNames: [...item.fontNames, font.name] } : item) }));
        }} className="rounded-lg border border-dashed border-[#46536a] bg-transparent px-2.5 py-1.5 text-[11px] text-[#b9c6d7]">
          <option value="">+ Add a font</option>{library.fonts.map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}
        </select>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[#adbbce]">Categories<input value={combo.categories.join(', ')} onChange={(event) => setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, categories: [...new Set(event.target.value.split(',').map(normalize).filter(Boolean))] } : item) }))} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2 text-xs font-normal normal-case tracking-normal text-white outline-none" /></label>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[#adbbce]">Tags<input value={combo.tags.join(', ')} onChange={(event) => setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, tags: [...new Set(event.target.value.split(',').map(normalize).filter(Boolean))] } : item) }))} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2 text-xs font-normal normal-case tracking-normal text-white outline-none" /></label>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[#adbbce] sm:col-span-2">Notes<textarea value={combo.notes} onChange={(event) => setLibrary((current) => ({ ...current, combinations: current.combinations.map((item) => item.id === combo.id ? { ...item, notes: event.target.value } : item) }))} rows={2} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2 text-xs font-normal normal-case tracking-normal text-white outline-none" /></label>
      </div>
      <div className="mt-3 flex justify-end"><button type="button" onClick={() => setLibrary((current) => ({ ...current, combinations: current.combinations.filter((item) => item.id !== combo.id) }))} className="inline-flex items-center gap-1.5 text-[11px] text-[#a5b1c1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" />Delete combination</button></div>
    </article>
  );
}
