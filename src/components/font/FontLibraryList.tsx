import type { Dispatch, SetStateAction } from 'react';
import { Library, X } from 'lucide-react';
import { keyFor, type CombinationEntry, type FontEntry, type LibraryState, type Section } from './fontSelectorModel';
import { CombinationCard, FontCard } from './FontSelectorCards';
import { FontChips } from './FontChips';

export interface FontLibraryListProps {
  section: Section; library: LibraryState; compareIds: string[]; setCompareIds: Dispatch<SetStateAction<string[]>>; fontsById: Map<string, FontEntry>;
  query: string; search: string; setQuery: (query: string) => void; setSection: (section: Section) => void; categoryMatches: (left: string, right: string) => boolean; filteredFonts: FontEntry[]; filteredCombinations: CombinationEntry[];
  setLibrary: Dispatch<SetStateAction<LibraryState>>; fontsByName: Map<string, FontEntry>; markUsed: (ids: string[]) => void;
  persistFontUpdate: (id: string, update: Partial<FontEntry>) => void; toggleFontFavorite: (font: FontEntry) => void;
  addFontToProject: (font: FontEntry, projectId: string) => void; deleteFont: (id: string) => void;
}

export function FontLibraryList({ section, library, compareIds, setCompareIds, fontsById, query, search, setQuery, setSection, categoryMatches, filteredFonts, filteredCombinations, setLibrary, fontsByName, markUsed, persistFontUpdate, toggleFontFavorite, addFontToProject, deleteFont }: FontLibraryListProps) {
  return (
<>
            {compareIds.length > 0 && <section className="mb-5 rounded-2xl border border-violet-300/25 bg-[#151a27] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-white">Compare font knowledge <span className="text-xs font-normal text-[#bdc8d8]">· {compareIds.length}/4</span></h2><button type="button" onClick={() => setCompareIds([])} className="text-xs font-semibold text-[#bcc8d8] hover:text-white">Clear</button></div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{compareIds.map((id) => {
                const font = fontsById.get(id); if (!font) return null;
                return <article key={id} className="rounded-xl border border-[#354156] bg-[#0d131d] p-3"><div className="flex justify-between"><h3 className="text-sm font-bold text-white">{font.name}</h3><button type="button" onClick={() => setCompareIds((current) => current.filter((item) => item !== id))} aria-label={`Remove ${font.name} from comparison`} className="text-[#a6b3c6] hover:text-white"><X className="h-3.5 w-3.5" /></button></div><div className="mt-3"><FontChips values={font.roles} empty="No roles assigned" /></div><div className="mt-2"><FontChips values={font.categories} /></div><div className="mt-2"><FontChips values={font.tags} empty="No tags" /></div><p className="mt-3 text-xs leading-5 text-[#d0d9e5]">{font.description || font.notes || 'No notes yet.'}</p></article>;
              })}</div>
            </section>}
              {section === 'categories' && <div className="mb-4 flex flex-wrap gap-2">{library.categories.map((category) => <button key={category} type="button" onClick={() => setQuery(query === category ? '' : category)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${query === category ? 'border-violet-200 bg-violet-300/15 text-white' : 'border-[#3c495e] bg-[#151d29] text-[#e0e7f1] hover:border-violet-300/40'}`}>{category} <span className="ml-1 text-[#bac6d5]">{library.fonts.filter((font) => font.categories.some((item) => categoryMatches(item, category))).length}</span></button>)}</div>}
              {section === 'fonts' && search && filteredCombinations.length > 0 && <section className="mb-5 rounded-2xl border border-[#303c50] bg-[#111722] p-4"><h2 className="mb-3 text-sm font-bold text-white">Matching combinations</h2><div className="grid gap-3 xl:grid-cols-2">{filteredCombinations.map((combo) => <CombinationCard key={combo.id} combo={combo} library={library} setLibrary={setLibrary} fontsByName={fontsByName} fontsById={fontsById} markUsed={markUsed} />)}</div></section>}
              {filteredFonts.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredFonts.map((font) => <FontCard key={font.id} font={font} library={library} compareIds={compareIds} onFontUpdate={persistFontUpdate} onToggleFavorite={toggleFontFavorite} onCompare={(id) => setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current)} onAddToProject={addFontToProject} onDelete={deleteFont} />)}</div> : <div className="rounded-2xl border border-dashed border-[#49566b] bg-[#111722] px-5 py-12 text-center"><Library className="mx-auto h-7 w-7 text-[#b2bfd0]" /><p className="mt-3 text-sm font-bold text-white">{section === 'favorites' ? 'No favorite fonts yet' : query ? 'No fonts match this search' : 'No font knowledge added yet'}</p><p className="mt-1 text-xs text-[#bdc8d8]">Add your own font names to organize and get recommendations.</p><button type="button" onClick={() => setSection('import')} className="mt-4 rounded-lg bg-violet-300 px-3.5 py-2 text-xs font-bold text-[#171222]">Add Fonts</button></div>}
          </>
  );
}
