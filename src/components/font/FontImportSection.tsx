import type { Dispatch, SetStateAction } from 'react';
import { Check, ClipboardPaste, Copy, X } from 'lucide-react';
import ORGANIZER_PROMPT from './fontOrganizerPrompt';
import { CATEGORY_ACTION_CREATE, CATEGORY_ACTION_REMOVE, ORGANIZED_IMPORT_EXAMPLE, keyFor, normalize, type FontEntry, type FontKnowledge, type LibraryState, type OrganizedCombinationEntry, type OrganizedImportEntry, type DuplicateAction } from './fontSelectorModel';

export interface FontImportSectionProps {
  library: LibraryState;
  importMode: 'manual' | 'organized';
  setImportMode: (mode: 'manual' | 'organized') => void;
  draftText: string; setDraftText: (value: string) => void;
  draftCategories: string[]; setDraftCategories: Dispatch<SetStateAction<string[]>>;
  newCategory: string; setNewCategory: (value: string) => void; addCategory: () => void;
  draftTags: string; setDraftTags: (value: string) => void;
  draftDescription: string; setDraftDescription: (value: string) => void;
  prepareDraft: (text: string) => void; handlePaste: () => Promise<void>;
  draft: FontKnowledge[] | null; setDraft: Dispatch<SetStateAction<FontKnowledge[] | null>>;
  saveDraft: () => void; updateDraftFont: (index: number, update: Partial<FontKnowledge>) => void;
  onToast: (message: string) => void;
  organizedText: string; setOrganizedText: (value: string) => void;
  organizedDraft: OrganizedImportEntry[] | null; setOrganizedDraft: Dispatch<SetStateAction<OrganizedImportEntry[] | null>>;
  organizedCombinationDraft: OrganizedCombinationEntry[]; setOrganizedCombinationDraft: Dispatch<SetStateAction<OrganizedCombinationEntry[]>>;
  organizedErrors: string[]; setOrganizedErrors: Dispatch<SetStateAction<string[]>>;
  mergedImportDuplicates: string[]; setMergedImportDuplicates: Dispatch<SetStateAction<string[]>>;
  mergedCombinationDuplicates: string[]; setMergedCombinationDuplicates: Dispatch<SetStateAction<string[]>>;
  reviewOrganizedImport: () => void;
  updateOrganizedCombination: (importId: string, update: Partial<Omit<OrganizedCombinationEntry, 'importId'>>) => void;
  categoryResolutions: Record<string, string>; setCategoryResolutions: Dispatch<SetStateAction<Record<string, string>>>;
  unknownImportCategories: string[]; importCandidates: OrganizedImportEntry[];
  importCombinationCandidates: OrganizedCombinationEntry[]; unresolvedImportCategories: string[]; duplicateImportNames: string[];
  saveOrganizedImport: () => void; updateOrganizedEntry: (importId: string, update: Partial<OrganizedImportEntry>) => void;
  existingFontForImport: (entry: FontKnowledge) => FontEntry | undefined;
  notice: string; setNotice: (value: string) => void;
}

export function FontImportSection({ library, importMode, setImportMode, draftText, setDraftText, draftCategories, setDraftCategories, newCategory, setNewCategory, addCategory, draftTags, setDraftTags, draftDescription, setDraftDescription, prepareDraft, handlePaste, draft, setDraft, saveDraft, updateDraftFont, onToast, organizedText, setOrganizedText, organizedDraft, setOrganizedDraft, organizedCombinationDraft, setOrganizedCombinationDraft, organizedErrors, setOrganizedErrors, mergedImportDuplicates, setMergedImportDuplicates, mergedCombinationDuplicates, setMergedCombinationDuplicates, reviewOrganizedImport, updateOrganizedCombination, categoryResolutions, setCategoryResolutions, unknownImportCategories, importCandidates, importCombinationCandidates, unresolvedImportCategories, duplicateImportNames, saveOrganizedImport, updateOrganizedEntry, existingFontForImport, notice, setNotice }: FontImportSectionProps) {
  return (
<div className="space-y-5">
            <div role="tablist" aria-label="Font import method" className="inline-flex rounded-xl border border-[#303c50] bg-[#111722] p-1">
              <button type="button" role="tab" aria-selected={importMode === 'manual'} onClick={() => setImportMode('manual')} className={`rounded-lg px-4 py-2.5 text-xs font-bold transition ${importMode === 'manual' ? 'bg-[#30264a] text-white shadow-sm' : 'text-[#b9c6d7] hover:text-white'}`}>Manual List</button>
              <button type="button" role="tab" aria-selected={importMode === 'organized'} onClick={() => setImportMode('organized')} className={`rounded-lg px-4 py-2.5 text-xs font-bold transition ${importMode === 'organized' ? 'bg-[#30264a] text-white shadow-sm' : 'text-[#b9c6d7] hover:text-white'}`}>Organized Import</button>
            </div>
            {importMode === 'manual' && <>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]">
              <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-4 sm:p-5">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-300/15 text-violet-100"><ClipboardPaste className="h-5 w-5" /></div><div><h2 className="text-sm font-bold text-white">Add fonts from a list</h2><p className="mt-1 text-xs text-[#bec9d8]">Paste one font name per line. Nothing is uploaded.</p></div></div>
                <textarea value={draftText} onChange={(event) => { setDraftText(event.target.value); setDraft(null); }} onPaste={(event) => { const pasted = event.clipboardData.getData('text'); if (pasted) { setDraftText(pasted); setDraft(null); onToast('Font list pasted. Select Review list to check the names before saving.'); } }} placeholder={'Anton\nInter\nBebas Neue\nPlayfair Display'} rows={10} className="mt-4 w-full resize-y rounded-xl border border-[#354156] bg-[#0b111b] p-4 text-sm leading-6 text-white outline-none placeholder:text-[#8795aa] focus:border-violet-300/60" />
                <p className="mt-2 text-[10px] leading-4 text-[#aebbd0]">Blank lines, bullets, and numbered-list prefixes are ignored. Existing or repeated font names are skipped.</p>
                <div className="mt-4 border-t border-[#303c50] pt-4">
                  <p className="text-xs font-bold text-white">Categories <span className="font-normal text-[#9eacc0]">— choose any that apply</span></p>
                  <div className="mt-2 flex flex-wrap gap-2">{library.categories.map((category) => {
                    const selected = draftCategories.includes(category);
                    return <button key={category} type="button" aria-pressed={selected} onClick={() => setDraftCategories((current) => selected ? current.filter((item) => item !== category) : [...current, category])} className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${selected ? 'border-violet-200 bg-violet-300 text-[#171222]' : 'border-[#46536a] bg-[#182131] text-[#d4ddea] hover:border-violet-300/50'}`}>{category}</button>;
                  })}</div>
                  <div className="mt-3 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCategory(); } }} placeholder="Create a category" className="min-w-0 flex-1 rounded-lg border border-[#354156] bg-[#101824] px-3 py-2 text-xs text-white outline-none placeholder:text-[#8391a5]" /><button type="button" onClick={addCategory} disabled={!newCategory.trim()} className="rounded-lg border border-[#46536a] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Add category</button></div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-[11px] font-semibold text-[#d4ddea]">Tags <span className="font-normal text-[#9eacc0]">optional, comma-separated</span><input value={draftTags} onChange={(event) => setDraftTags(event.target.value)} placeholder="Display, Bold, YouTube" className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#101824] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8391a5]" /></label>
                  <label className="text-[11px] font-semibold text-[#d4ddea]">Description <span className="font-normal text-[#9eacc0]">optional</span><input value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} placeholder="Good for bold video titles" className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#101824] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8391a5]" /></label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => prepareDraft(draftText)} disabled={!draftText.trim()} className="inline-flex items-center gap-2 rounded-lg bg-violet-300 px-4 py-2.5 text-xs font-bold text-[#171222] disabled:opacity-40"><Check className="h-4 w-4" />Review list</button>
                  <button type="button" onClick={() => void handlePaste()} className="inline-flex items-center gap-2 rounded-lg border border-[#46536a] bg-[#182131] px-3 py-2.5 text-xs font-semibold text-white hover:border-violet-300/40"><ClipboardPaste className="h-3.5 w-3.5" />Paste clipboard</button>
                  <button type="button" onClick={() => { setDraftText(''); setDraft(null); setNotice(''); }} className="rounded-lg border border-[#46536a] px-3 py-2.5 text-xs font-semibold text-[#d4ddea]">Clear</button>
                </div>
              </section>
              <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-4 sm:p-5">
                <h2 className="text-sm font-bold text-white">Suggested categories</h2>
                <p className="mt-1 text-xs leading-5 text-[#bec9d8]">Pick existing categories to apply to every name in this batch, or create a category of your own.</p>
                <div className="mt-4 rounded-xl border border-[#303c50] bg-[#0c111a] p-3">
                  <h3 className="text-xs font-bold text-white">Optional details</h3>
                  <p className="mt-2 text-xs leading-5 text-[#bec9d8]">Tags and a description are shared across this batch. You can edit each font’s category, tags, or description on the review step, and update them later from My Fonts.</p>
                </div>
                <div className="mt-4 rounded-xl border border-[#303c50] bg-[#0c111a] p-3">
                  <h3 className="text-xs font-bold text-white">What gets saved?</h3>
                  <p className="mt-2 text-xs leading-5 text-[#bec9d8]">Only the font names and the details you choose are stored in your browser. No font files or images are imported.</p>
                </div>
              </section>
            </div>
            {draft && <section className="rounded-2xl border border-violet-300/30 bg-[#121722] p-4 sm:p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><h2 className="text-base font-bold text-white">Review fonts</h2><p className="mt-1 text-xs text-[#c0cada]">{draft.length} font{draft.length === 1 ? '' : 's'} ready to save</p></div>
                <div className="flex gap-2"><button type="button" onClick={() => { setDraft(null); setNotice('Review discarded.'); }} className="rounded-lg border border-[#46536a] px-3 py-2 text-xs font-semibold text-white">Discard</button><button type="button" onClick={saveDraft} className="inline-flex items-center gap-2 rounded-lg bg-violet-300 px-4 py-2 text-xs font-bold text-[#171222]"><Check className="h-4 w-4" />Save All</button></div>
              </div>
              {draft.length > 0 && <div className="space-y-2">
                {draft.map((font, index) => <div key={`${font.name}-${index}`} className="grid gap-2 rounded-xl border border-[#303c50] bg-[#0d131d] p-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1.2fr_auto]">
                  <input aria-label={`Font name ${index + 1}`} value={font.name} onChange={(event) => updateDraftFont(index, { name: event.target.value })} className="rounded-lg border border-[#354156] bg-[#101824] px-3 py-2 text-xs font-bold text-white outline-none" />
                  <input aria-label={`Roles for ${font.name}`} list="font-role-options" value={font.roles.join(', ')} onChange={(event) => updateDraftFont(index, { roles: event.target.value.split(',').map(normalize).filter(Boolean) })} placeholder="Roles: Primary, Hook..." className="rounded-lg border border-violet-300/25 bg-[#101824] px-3 py-2 text-xs text-white outline-none placeholder:text-[#8391a5]" />
                  <input aria-label={`Categories for ${font.name}`} value={font.categories.join(', ')} onChange={(event) => updateDraftFont(index, { categories: event.target.value.split(',').map(normalize).filter(Boolean) })} placeholder="Categories (optional)" className="rounded-lg border border-[#354156] bg-[#101824] px-3 py-2 text-xs text-white outline-none placeholder:text-[#8391a5]" />
                  <input aria-label={`Tags for ${font.name}`} value={font.tags.join(', ')} onChange={(event) => updateDraftFont(index, { tags: event.target.value.split(',').map(normalize).filter(Boolean) })} placeholder="Tags (optional)" className="rounded-lg border border-[#354156] bg-[#101824] px-3 py-2 text-xs text-white outline-none placeholder:text-[#8391a5]" />
                  <input aria-label={`Description for ${font.name}`} value={font.description} onChange={(event) => updateDraftFont(index, { description: event.target.value })} placeholder="Description (optional)" className="rounded-lg border border-[#354156] bg-[#101824] px-3 py-2 text-xs text-white outline-none placeholder:text-[#8391a5]" />
                  <button type="button" aria-label={`Remove ${font.name}`} onClick={() => setDraft((current) => current?.filter((_, itemIndex) => itemIndex !== index) ?? null)} className="text-[#9daabd] hover:text-rose-300"><X className="h-4 w-4" /></button>
                </div>)}
              </div>}
              {draft.length === 0 && <p className="rounded-xl border border-[#303c50] bg-[#0d131d] p-4 text-xs text-[#b5c1d2]">No new font names to review. All entries were blank or already in your library.</p>}
            </section>}
            </>}
            {importMode === 'organized' && <div className="space-y-4">
              <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-300/15 text-violet-100"><ClipboardPaste className="h-5 w-5" /></div>
                  <div><h2 className="text-sm font-bold text-white">Paste organized fonts and combinations</h2><p className="mt-1 text-xs leading-5 text-[#bec9d8]">Use one block per font or combination. Fields can be empty; separate records with a blank line. This parser runs locally and uses no AI.</p></div>
                </div>
                <textarea aria-label="Organized font data" value={organizedText} onChange={(event) => { setOrganizedText(event.target.value); setOrganizedDraft(null); setOrganizedErrors([]); setMergedImportDuplicates([]); }} onPaste={(event) => { const pasted = event.clipboardData.getData('text'); if (pasted) { setOrganizedText(pasted); setOrganizedDraft(null); setOrganizedErrors([]); onToast('Organized font data pasted. Select Review Import to preview the records.'); } }} placeholder={ORGANIZED_IMPORT_EXAMPLE} rows={18} className="mt-4 w-full resize-y rounded-xl border border-[#354156] bg-[#0b111b] p-4 font-mono text-xs leading-6 text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={reviewOrganizedImport} disabled={!organizedText.trim()} className="inline-flex items-center gap-2 rounded-lg bg-violet-300 px-4 py-2.5 text-xs font-bold text-[#171222] disabled:opacity-40"><Check className="h-4 w-4" />Review Import</button>
                  <button type="button" onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(ORGANIZER_PROMPT);
                      onToast('Font organizer prompt copied. Paste it into your AI tool, then paste its structured result here.');
                    } catch {
                      onToast('Clipboard access was denied. Allow clipboard access and try copying the organizer prompt again.');
                    }
                  }} className="inline-flex items-center gap-2 rounded-lg border border-violet-300/30 bg-violet-300/[0.08] px-3 py-2.5 text-xs font-semibold text-violet-100 hover:border-violet-200/50"><Copy className="h-3.5 w-3.5" />Copy Font Organizer Prompt</button>
                  <button type="button" onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (!text.trim()) { onToast('Clipboard has no text. Paste organized font records into the text area.'); return; }
                      setOrganizedText(text);
                      setOrganizedDraft(null);
                      setOrganizedErrors([]);
                      onToast('Organized font data pasted. Select Review Import to preview the records.');
                    } catch {
                      onToast('Clipboard access was denied. Focus the organized import box and press Ctrl+V (or Cmd+V) instead.');
                    }
                  }} className="inline-flex items-center gap-2 rounded-lg border border-[#46536a] bg-[#182131] px-3 py-2.5 text-xs font-semibold text-white hover:border-violet-300/40"><ClipboardPaste className="h-3.5 w-3.5" />Paste from Clipboard</button>
                  <button type="button" onClick={() => { setOrganizedText(''); setOrganizedDraft(null); setOrganizedCombinationDraft([]); setOrganizedErrors([]); setMergedImportDuplicates([]); setMergedCombinationDuplicates([]); setCategoryResolutions({}); setNotice(''); }} className="rounded-lg border border-[#46536a] px-3 py-2.5 text-xs font-semibold text-[#d4ddea]">Clear</button>
                </div>
                {organizedErrors.length > 0 && <div role="status" className="mt-4 rounded-xl border border-amber-300/25 bg-amber-200/[0.08] p-3 text-xs leading-5 text-amber-100"><p className="font-bold">Import notes</p><ul className="mt-1 list-inside list-disc">{organizedErrors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul></div>}
              </section>

              {organizedDraft && <section className="rounded-2xl border border-violet-300/30 bg-[#121722] p-4 sm:p-5">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div><h2 className="text-base font-bold text-white">Import Preview</h2><p className="mt-1 text-xs text-[#c0cada]">{organizedDraft.length} font{organizedDraft.length === 1 ? '' : 's'} and {organizedCombinationDraft.length} combination{organizedCombinationDraft.length === 1 ? '' : 's'} detected · edit any field before importing.</p></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setOrganizedDraft(null); setCategoryResolutions({}); setNotice('Import review cancelled.'); }} className="rounded-lg border border-[#46536a] px-3 py-2 text-xs font-semibold text-white">Cancel</button>
                    <button type="button" disabled={importCandidates.length === 0 && importCombinationCandidates.length === 0 || unresolvedImportCategories.length > 0 || duplicateImportNames.length > 0} onClick={saveOrganizedImport} className="inline-flex items-center gap-2 rounded-lg bg-violet-300 px-4 py-2 text-xs font-bold text-[#171222] disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-4 w-4" />Import {importCandidates.length} Font{importCandidates.length === 1 ? '' : 's'}{importCombinationCandidates.length > 0 ? ` + ${importCombinationCandidates.length} Combination${importCombinationCandidates.length === 1 ? '' : 's'}` : ''}</button>
                  </div>
                </div>
                {mergedImportDuplicates.length > 0 && <p className="mb-4 rounded-lg border border-sky-300/20 bg-sky-200/[0.07] p-3 text-xs leading-5 text-sky-100">Repeated records in this paste were combined into one font each: {mergedImportDuplicates.join(', ')}.</p>}
                {mergedCombinationDuplicates.length > 0 && <p className="mb-4 rounded-lg border border-sky-300/20 bg-sky-200/[0.07] p-3 text-xs leading-5 text-sky-100">Repeated combination records in this paste were combined: {mergedCombinationDuplicates.join(', ')}.</p>}
                {duplicateImportNames.length > 0 && <p className="mb-4 rounded-lg border border-rose-300/20 bg-rose-200/[0.07] p-3 text-xs leading-5 text-rose-100">Font names must be unique within this import. Rename or remove duplicate entries before importing.</p>}
                {unknownImportCategories.length > 0 && <div className="mb-4 rounded-xl border border-amber-200/20 bg-amber-200/[0.06] p-4">
                  <h3 className="text-xs font-bold text-white">Resolve unknown categories</h3>
                  <p className="mt-1 text-xs leading-5 text-[#cbd5e2]">These categories aren’t in your library yet. Choose to create each category, map it to an existing one, or remove it from the imported fonts.</p>
                  <div className="mt-3 space-y-2">{unknownImportCategories.map((category) => <div key={keyFor(category)} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr]">
                    <span className="text-xs font-semibold text-amber-100">{category}</span>
                    <select aria-label={`Resolve category ${category}`} value={categoryResolutions[keyFor(category)] ?? ''} onChange={(event) => setCategoryResolutions((current) => ({ ...current, [keyFor(category)]: event.target.value }))} className="rounded-lg border border-[#46536a] bg-[#0b111b] px-3 py-2 text-xs text-white">
                      <option value="">Choose an action…</option>
                      <option value={CATEGORY_ACTION_CREATE}>Create “{category}”</option>
                      <option value={CATEGORY_ACTION_REMOVE}>Remove this category</option>
                      {library.categories.map((existing) => <option key={existing} value={`map:${existing}`}>Map to {existing}</option>)}
                    </select>
                  </div>)}</div>
                </div>}
                <div className="space-y-3">
                  {organizedDraft.map((entry) => {
                    const existing = existingFontForImport(entry);
                    return <article key={entry.importId} className="rounded-xl border border-[#354156] bg-[#0d131d] p-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-[#c4cede]">Font name
                          <input aria-label={`Imported font name ${entry.name}`} value={entry.name} onChange={(event) => updateOrganizedEntry(entry.importId, { name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#101824] px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-white outline-none" />
                        </label>
                        {existing && <label className="text-[10px] font-bold uppercase tracking-wide text-amber-100">Already in My Fonts · {existing.name}
                          <select aria-label={`Duplicate action for ${entry.name}`} value={entry.duplicateAction} onChange={(event) => setOrganizedDraft((current) => current?.map((item) => item.importId === entry.importId ? { ...item, duplicateAction: event.target.value as DuplicateAction } : item) ?? null)} className="mt-1.5 w-full rounded-lg border border-amber-200/25 bg-[#101824] px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-white">
                            <option value="skip">Skip (default)</option><option value="update">Update existing font</option><option value="keep">Keep both</option>
                          </select>
                        </label>}
                        <button type="button" aria-label={`Remove ${entry.name} from import`} onClick={() => setOrganizedDraft((current) => current?.filter((item) => item.importId !== entry.importId) ?? null)} className="justify-self-start rounded-lg border border-[#46536a] px-3 py-2 text-[10px] font-semibold text-[#c3cede] hover:border-rose-300/40 hover:text-rose-200 sm:col-span-2">Remove from this import</button>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-violet-200">Roles
                          <input list="font-role-options" aria-label={`Imported roles for ${entry.name}`} value={entry.roles.join(', ')} onChange={(event) => updateOrganizedEntry(entry.importId, { roles: event.target.value.split(',').map(normalize).filter(Boolean) })} placeholder="Primary, Hook, Supporting..." className="mt-1.5 w-full rounded-lg border border-violet-300/25 bg-[#101824] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none" />
                        </label>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-[#c4cede]">Categories
                          <input aria-label={`Imported categories for ${entry.name}`} value={entry.categories.join(', ')} onChange={(event) => updateOrganizedEntry(entry.importId, { categories: event.target.value.split(',').map(normalize).filter(Boolean) })} placeholder="Category 1, Category 2" className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#101824] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none" />
                        </label>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-[#c4cede]">Tags
                          <input aria-label={`Imported tags for ${entry.name}`} value={entry.tags.join(', ')} onChange={(event) => updateOrganizedEntry(entry.importId, { tags: event.target.value.split(',').map(normalize).filter(Boolean) })} placeholder="Bold, Elegant..." className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#101824] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none" />
                        </label>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-[#c4cede]">Description
                          <input aria-label={`Imported description for ${entry.name}`} value={entry.description} onChange={(event) => updateOrganizedEntry(entry.importId, { description: event.target.value })} placeholder="Optional description" className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#101824] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none" />
                        </label>
                      </div>
                      {existing && <p className="mt-2 text-[10px] leading-4 text-[#aebbd0]">Skip leaves the existing record unchanged. Update replaces its imported metadata; Keep both creates another library record.</p>}
                    </article>;
                  })}
                </div>
                {organizedCombinationDraft.length > 0 && <div className="mt-5 border-t border-[#303c50] pt-5">
                  <h3 className="mb-3 text-sm font-bold text-white">Combinations · {organizedCombinationDraft.length}</h3>
                  <div className="space-y-3">
                    {organizedCombinationDraft.map((combination) => <article key={combination.importId} className="rounded-xl border border-[#46536a] bg-[#101824] p-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-violet-200">Combination name
                          <input aria-label={`Combination name ${combination.name}`} value={combination.name} onChange={(event) => updateOrganizedCombination(combination.importId, { name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-semibold normal-case tracking-normal text-white outline-none" />
                        </label>
                        <button type="button" aria-label={`Remove combination ${combination.name}`} onClick={() => setOrganizedCombinationDraft((current) => current.filter((item) => item.importId !== combination.importId))} className="justify-self-start self-end rounded-lg border border-[#46536a] px-3 py-2.5 text-[10px] font-semibold text-[#c3cede] hover:border-rose-300/40 hover:text-rose-200">Remove combination</button>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-[#c4cede]">Fonts
                          <input aria-label={`Fonts in ${combination.name}`} value={combination.fontNames.join(', ')} onChange={(event) => updateOrganizedCombination(combination.importId, { fontNames: event.target.value.split(',').map(normalize).filter(Boolean) })} placeholder="Font 1, Font 2" className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none" />
                        </label>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-[#c4cede]">Best for
                          <input aria-label={`Best for ${combination.name}`} value={combination.bestFor} onChange={(event) => updateOrganizedCombination(combination.importId, { bestFor: event.target.value })} placeholder="Reels, thumbnails..." className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none" />
                        </label>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-[#c4cede] sm:col-span-2">Description
                          <input aria-label={`Description for ${combination.name}`} value={combination.description} onChange={(event) => updateOrganizedCombination(combination.importId, { description: event.target.value })} placeholder="Optional description" className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none" />
                        </label>
                      </div>
                    </article>)}
                  </div>
                </div>}
              </section>}
            </div>}
          </div>
  );
}
