import { Plus, Search, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { type CombinationEntry, type FontEntry, type LibraryState, type Section } from './fontSelectorModel';
import { CombinationCard } from './FontSelectorCards';

export interface FontCollectionsSectionProps {
  section: Section; library: LibraryState; newCategory: string; setNewCategory: (value: string) => void; addCategory: () => void; deleteCategory: (category: string) => void;
  newCombination: string; setNewCombination: (value: string) => void; addCombination: () => void; query: string; setQuery: (query: string) => void; filteredCombinations: CombinationEntry[];
  setLibrary: Dispatch<SetStateAction<LibraryState>>; fontsByName: Map<string, FontEntry>; fontsById: Map<string, FontEntry>; markUsed: (ids: string[]) => void;
}

export function FontCollectionsSection({section,library,newCategory,setNewCategory,addCategory,deleteCategory,newCombination,setNewCombination,addCombination,query,setQuery,filteredCombinations,setLibrary,fontsByName,fontsById,markUsed}: FontCollectionsSectionProps) {
  return (
    <>
      {section === 'categories' && <section className="mt-5 rounded-2xl border border-[#303c50] bg-[#111722] p-4"><h2 className="text-sm font-bold text-white">Manage categories</h2><form onSubmit={(event) => { event.preventDefault(); addCategory(); }} className="mt-3 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Create a category, e.g. YouTube Fonts" className="min-w-0 flex-1 rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8795aa]" /><button className="inline-flex items-center gap-1.5 rounded-lg bg-[#253147] px-3 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add</button></form><div className="mt-3 flex flex-wrap gap-2">{library.categories.map((category) => <span key={category} className="inline-flex items-center gap-2 rounded-lg border border-[#3a465b] bg-[#192233] px-2.5 py-1.5 text-[10px] text-white">{category}<button type="button" aria-label={`Delete category ${category}`} onClick={() => deleteCategory(category)} className="text-[#a4b1c4] hover:text-rose-300"><X className="h-3 w-3" /></button></span>)}</div></section>}

          {section === 'combinations' && <div className="space-y-4">
            <form onSubmit={(event) => { event.preventDefault(); addCombination(); }} className="flex gap-2 rounded-2xl border border-[#303c50] bg-[#111722] p-4"><input value={newCombination} onChange={(event) => setNewCombination(event.target.value)} placeholder="Combination name, e.g. Cinematic 3Mix" className="min-w-0 flex-1 rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8795aa]" /><button className="inline-flex items-center gap-1.5 rounded-lg bg-violet-300 px-3.5 text-xs font-bold text-[#171222]"><Plus className="h-3.5 w-3.5" />Create</button></form>
            <label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a4b1c4]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search combinations and font names..." className="w-full rounded-xl border border-[#354156] bg-[#111722] py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#8d9cb1]" /></label>
            {filteredCombinations.length ? <div className="grid gap-4 xl:grid-cols-2">{filteredCombinations.map((combo) => <CombinationCard key={combo.id} combo={combo} library={library} setLibrary={setLibrary} fontsByName={fontsByName} fontsById={fontsById} markUsed={markUsed} />)}</div> : <p className="rounded-2xl border border-dashed border-[#49566b] bg-[#111722] p-8 text-center text-xs text-[#bdc8d8]">No combinations saved yet. Create one or detect combinations from pasted notes.</p>}
          </div>}
    </>
  );
}
