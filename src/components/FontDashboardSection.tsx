import { FolderKanban, Library, ListFilter, Plus, Type } from 'lucide-react';
import type { LibraryState, Section } from './fontSelectorModel';

export interface DashboardSectionProps { library: LibraryState; popularCategories: { category: string; count: number }[]; setSection: (section: Section) => void; setQuery: (query: string) => void; }

export function DashboardSection({ library, popularCategories, setSection, setQuery }: DashboardSectionProps) {
  return (
<div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'My Fonts', count: library.fonts.length, icon: Library, target: 'fonts' as Section },
                { label: 'Categories', count: library.categories.length, icon: ListFilter, target: 'categories' as Section },
                { label: 'Combinations', count: library.combinations.length, icon: Type, target: 'combinations' as Section },
                { label: 'Project Sets', count: library.projects.length, icon: FolderKanban, target: 'projects' as Section },
              ].map(({ label, count, icon: Icon, target }) => <button key={label} type="button" onClick={() => setSection(target)} className="rounded-2xl border border-[#303c50] bg-[#131b28] p-4 text-left shadow-lg shadow-black/10 transition hover:border-violet-300/50">
                <div className="flex items-center justify-between text-xs font-semibold text-[#d0d9e6]">{label}<Icon className="h-4 w-4 text-violet-200" /></div><p className="mt-3 text-3xl font-bold text-white">{count}</p>
              </button>)}
            </div>
            {library.fonts.length === 0 ? <div className="rounded-2xl border border-dashed border-[#49566b] bg-[#111722] px-6 py-12 text-center">
              <Type className="mx-auto h-8 w-8 text-violet-200" /><h2 className="mt-3 text-base font-bold text-white">Build your personal font knowledge</h2>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[#bdc8d7]">Paste font names, assign useful roles like Primary or Accent, then add categories, tags, or a description. These classifications power your video mixes.</p>
              <button type="button" onClick={() => setSection('import')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-300 px-3.5 py-2.5 text-xs font-bold text-[#171222]"><Plus className="h-4 w-4" />Add fonts</button>
            </div> : <>
              <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-white">Recently Added</h2><button type="button" onClick={() => setSection('fonts')} className="text-[11px] font-semibold text-violet-200">View fonts →</button></div><div className="flex flex-wrap gap-2">{[...library.fonts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8).map((font) => <button key={font.id} type="button" onClick={() => { setSection('fonts'); setQuery(font.name); }} className="rounded-lg border border-[#3b485e] bg-[#1a2434] px-3 py-2 text-xs font-semibold text-white hover:border-violet-300/40">{font.name}</button>)}</div></section>
              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-4"><div className="mb-3 flex justify-between"><h2 className="text-sm font-bold text-white">Favorite Fonts</h2><button type="button" onClick={() => setSection('favorites')} className="text-[11px] font-semibold text-violet-200">View all →</button></div>{library.fonts.filter((font) => font.favorite).slice(0, 6).length ? <div className="flex flex-wrap gap-2">{library.fonts.filter((font) => font.favorite).slice(0, 6).map((font) => <span key={font.id} className="rounded-lg bg-[#202b3b] px-3 py-2 text-xs text-[#edf2fa]">{font.name}</span>)}</div> : <p className="text-xs text-[#b5c1d2]">Favorite fonts to make a quick shortlist.</p>}</section>
                <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-4"><h2 className="mb-3 text-sm font-bold text-white">Popular Categories</h2>{popularCategories.length ? <div className="space-y-2">{popularCategories.map(({ category, count }) => <button key={category} type="button" onClick={() => { setSection('categories'); setQuery(category); }} className="flex w-full items-center justify-between text-xs text-[#e0e7f1] hover:text-violet-100"><span>{category}</span><span className="rounded-md bg-[#212c3d] px-2 py-1 text-[10px] text-[#d5deea]">{count}</span></button>)}</div> : <p className="text-xs text-[#b5c1d2]">Categories appear here as you organize your fonts.</p>}</section>
              </div>
              <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-4"><div className="mb-3 flex justify-between"><h2 className="text-sm font-bold text-white">Recent Project Sets</h2><button type="button" onClick={() => setSection('projects')} className="text-[11px] font-semibold text-violet-200">View all →</button></div>{library.projects.length ? <div className="grid gap-2 sm:grid-cols-2">{library.projects.slice(0, 4).map((project) => <button key={project.id} type="button" onClick={() => setSection('projects')} className="rounded-lg border border-[#354156] bg-[#0d131d] p-3 text-left"><p className="text-xs font-bold text-white">{project.name}</p><p className="mt-1 text-[10px] text-[#b2bfd0]">{project.style || 'No style selected'} · {project.fontIds.length} fonts</p></button>)}</div> : <p className="text-xs text-[#b5c1d2]">Save a recommendation as a project set to see it here.</p>}</section>
            </>}
          </div>
  );
}
