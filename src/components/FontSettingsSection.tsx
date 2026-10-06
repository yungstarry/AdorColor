import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { LibraryState } from './fontSelectorModel';

export interface FontSettingsSectionProps { library: LibraryState; exportLibrary: () => void; importLibrary: (event: ChangeEvent<HTMLInputElement>) => Promise<void>; }

export function FontSettingsSection({ library, exportLibrary, importLibrary }: FontSettingsSectionProps) {
  return (
<div className="max-w-2xl space-y-4">
            <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-5"><div className="flex items-center gap-3"><ArrowDownToLine className="h-5 w-5 text-violet-200" /><div><h2 className="text-sm font-bold text-white">Export Font Knowledge</h2><p className="mt-1 text-xs text-[#bdc8d8]">Save your font records, categories, combinations, project sets, favorites, and notes.</p></div></div><button type="button" onClick={exportLibrary} className="mt-4 rounded-lg border border-[#46536a] bg-[#192334] px-3.5 py-2 text-xs font-bold text-white hover:border-violet-300/40">Export library JSON</button></section>
            <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-5"><div className="flex items-center gap-3"><ArrowUpFromLine className="h-5 w-5 text-violet-200" /><div><h2 className="text-sm font-bold text-white">Import Font Knowledge</h2><p className="mt-1 text-xs text-[#bdc8d8]">Restore a previously exported JSON library.</p></div></div><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#46536a] bg-[#192334] px-3.5 py-2 text-xs font-bold text-white hover:border-violet-300/40">Choose library JSON<input type="file" accept=".json,application/json" onChange={(event) => void importLibrary(event)} className="sr-only" /></label></section>
            <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-5"><h2 className="text-sm font-bold text-white">Local storage</h2><p className="mt-2 text-xs leading-5 text-[#bdc8d8]">{library.fonts.length} font records · {library.categories.length} categories · {library.combinations.length} combinations · {library.projects.length} project sets. Your information is stored in this browser. Only names and metadata are saved; font files are not imported or uploaded.</p></section>
          </div>
  );
}
