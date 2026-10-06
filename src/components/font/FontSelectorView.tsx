import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CircleHelp,
  ClipboardPaste,
  Copy,
  FolderKanban,
  Heart,
  LayoutDashboard,
  Library,
  ListFilter,
  Lock,
  Plus,
  RotateCw,
  Search,
  Settings2,
  Shuffle,
  Sparkles,
  Star,
  Trash2,
  Type,
  Unlock,
  X,
} from 'lucide-react';
import type { FontImportSectionProps } from './FontImportSection';
import type { ProjectSectionProps } from './ProjectSection';
import type { CreateFontMixSectionProps } from './CreateFontMixSection';
import type { FontLibraryListProps } from './FontLibraryList';
import type { FontCollectionsSectionProps } from './FontCollectionsSection';
import type { FontFavoritesSectionProps } from './FontFavoritesSection';
import type { DashboardSectionProps } from './FontDashboardSection';
import type { FontSettingsSectionProps } from './FontSettingsSection';
import { categoryMatches, FONT_ROLE_OPTIONS, type Section } from './fontSelectorModel';
import { FontImportSection } from './FontImportSection';
import { ProjectSection } from './ProjectSection';
import { CreateFontMixSection } from './CreateFontMixSection';
import { FontLibraryList } from './FontLibraryList';
import { FontCollectionsSection } from './FontCollectionsSection';
import { FontFavoritesSection } from './FontFavoritesSection';
import { DashboardSection } from './FontDashboardSection';
import { FontSettingsSection } from './FontSettingsSection';
import { FontHowItWorksSection } from './FontHowItWorksSection';

const NAV_ITEMS: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'find', label: 'Create Font Mix', icon: Sparkles },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'fonts', label: 'My Fonts', icon: Library },
  { id: 'categories', label: 'Categories', icon: ListFilter },
  { id: 'combinations', label: 'Combinations', icon: Type },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'import', label: 'Add Fonts', icon: ClipboardPaste },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'how-it-works', label: 'How It Works', icon: CircleHelp },
];

interface FontSelectorToolbarProps { availableFontRoles: string[]; fontRoleFilter: string; setFontRoleFilter: (value: string) => void; fontCategoryFilter: string; setFontCategoryFilter: (value: string) => void; deleteAllFonts: () => void; search: string; }
type FontSelectorViewProps = FontImportSectionProps & ProjectSectionProps & CreateFontMixSectionProps & FontLibraryListProps & FontCollectionsSectionProps & FontFavoritesSectionProps & DashboardSectionProps & FontSettingsSectionProps & FontSelectorToolbarProps;

export function FontSelectorView({
  library,
  section,
  setSection,
  query,
  setQuery,
  notice,
  setNotice,
  availableFontRoles,
  fontRoleFilter,
  setFontRoleFilter,
  fontCategoryFilter,
  setFontCategoryFilter,
  filteredFonts,
  deleteAllFonts,
  popularCategories,
  search,
  importMode,
  setImportMode,
  draftText,
  setDraftText,
  draftCategories,
  setDraftCategories,
  newCategory,
  setNewCategory,
  addCategory,
  deleteCategory,
  draftTags,
  setDraftTags,
  draftDescription,
  setDraftDescription,
  prepareDraft,
  handlePaste,
  draft,
  setDraft,
  saveDraft,
  updateDraftFont,
  onToast,
  organizedText,
  setOrganizedText,
  organizedDraft,
  setOrganizedDraft,
  organizedCombinationDraft,
  setOrganizedCombinationDraft,
  organizedErrors,
  setOrganizedErrors,
  mergedImportDuplicates,
  setMergedImportDuplicates,
  mergedCombinationDuplicates,
  setMergedCombinationDuplicates,
  reviewOrganizedImport,
  updateOrganizedCombination,
  categoryResolutions,
  setCategoryResolutions,
  unknownImportCategories,
  importCandidates,
  importCombinationCandidates,
  unresolvedImportCategories,
  duplicateImportNames,
  saveOrganizedImport,
  updateOrganizedEntry,
  existingFontForImport,
  newCombination,
  setNewCombination,
  addCombination,
  filteredCombinations,
  setLibrary,
  fontsByName,
  fontsById,
  markUsed,
  compareIds,
  setCompareIds,
  persistFontUpdate,
  toggleFontFavorite,
  addFontToProject,
  deleteFont,
  newProject,
  setNewProject,
  projectStyle,
  setProjectStyle,
  projectPurpose,
  setProjectPurpose,
  createProject,
  updateProject,
  exportProjectCardPng,
  activePreset,
  findStyle,
  setFindStyle,
  setRecommendations,
  findProject,
  setFindProject,
  selectedMixCount,
  findFonts,
  recommendations,
  shuffleFontMix,
  requiredMixComplete,
  saveRecommendation,
  lockedRoles,
  setLockedRoles,
  rerollRole,
  exportLibrary,
  importLibrary,
  categoryMatches
}: FontSelectorViewProps) {
  return (
    <main className="font-selector-page min-h-[calc(100vh-60px)] bg-[#080b11] px-3 py-5 text-[#edf2fa] sm:px-5 lg:px-8 lg:py-7">
      <datalist id="font-role-options">{FONT_ROLE_OPTIONS.map((role) => <option key={role} value={role} />)}</datalist>
      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="font-selector-panel h-fit rounded-2xl border border-[#30394a] bg-[#111722] p-3 lg:sticky lg:top-[84px]">
          <div className="mb-3 flex items-center gap-2 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-300/15 text-violet-100"><Type className="h-4 w-4" /></div>
            <div><p className="text-xs font-bold text-white">Font Selector</p><p className="text-[10px] text-[#b2bfd0]">Your type, your system</p></div>
          </div>
          <nav aria-label="Font Selector sections" className="grid grid-cols-2 gap-1 lg:grid-cols-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => { setSection(id); setQuery(''); setNotice(''); }} aria-current={section === id ? 'page' : undefined} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${section === id ? 'bg-[#30264a] text-[#f3eaff] shadow-inner shadow-violet-300/10' : 'text-[#c1ccdb] hover:bg-white/[0.07] hover:text-white'}`}>
              <Icon className="h-4 w-4" />{label}
              {id === 'favorites' && <span className="ml-auto text-[10px] text-[#aebbd0]">{library.fonts.filter((font) => font.favorite).length + library.combinations.filter((item) => item.favorite).length + library.projects.filter((item) => item.favorite).length}</span>}
            </button>)}
          </nav>
          <div className="mt-4 rounded-xl border border-[#303c50] bg-[#0c111a] p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#e3eaf4]"><CircleHelp className="h-3.5 w-3.5 text-violet-200" /> Your list, your source</div>
            <p className="mt-1.5 text-[10px] leading-4 text-[#b2bfd0]">Your video presets build mixes only from fonts and classifications you add.</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">{section === 'find' ? 'Video font mix generator' : 'Mix tools · font library'}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{NAV_ITEMS.find((item) => item.id === section)?.label}</h1>
              <p className="mt-1 text-xs text-[#c0cada]">{section === 'find' ? 'Build a controlled video typography system from the fonts you classify.' : 'Manage the fonts, roles, and saved mixes that power your generator.'}</p>
            </div>
            <button type="button" onClick={() => { setSection('import'); setNotice(''); }} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${section === 'find' ? 'border border-[#46536a] bg-[#151e2c] text-[#e4eaf3] hover:border-violet-300/40' : 'bg-violet-300 text-[#171222] shadow-lg shadow-violet-950/20 hover:bg-violet-200'}`}><Plus className="h-4 w-4" />Add Fonts</button>
          </header>

          {notice && <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-violet-300/25 bg-[#201936] px-4 py-3 text-xs font-medium leading-5 text-[#f0e9ff]"><span>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')} className="shrink-0 text-violet-200 hover:text-white"><X className="h-4 w-4" /></button></div>}

          {(section === 'fonts' || section === 'favorites' || section === 'categories') && (
            <div className="mb-4 space-y-3">
              {section === 'fonts' && <section aria-label="Available font roles and categories" className="rounded-xl border border-[#303c50] bg-[#111722] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">Your classifications</p>
                <p className="mt-1.5 text-xs leading-5 text-[#d5deea]"><span className="font-semibold text-white">Roles:</span> {availableFontRoles.join(', ') || 'None yet'}</p>
                <p className="mt-1 text-xs leading-5 text-[#d5deea]"><span className="font-semibold text-white">Categories:</span> {library.categories.join(', ') || 'None yet'}</p>
              </section>}
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <label className="relative block w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a4b1c4]" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fonts, categories, tags, notes..." className="w-full rounded-xl border border-[#354156] bg-[#111722] py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#8d9cb1] focus:border-violet-300/60" />
                  </label>
                  {section === 'fonts' && <>
                    <label className="sr-only" htmlFor="font-library-role-filter">Filter fonts by role</label>
                    <select id="font-library-role-filter" aria-label="Filter fonts by role" value={fontRoleFilter} onChange={(event) => setFontRoleFilter(event.target.value)} className="w-full rounded-xl border border-[#354156] bg-[#111722] px-3 py-2.5 text-xs text-white outline-none focus:border-violet-300/60">
                      <option value="">All roles</option>
                      {availableFontRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <label className="sr-only" htmlFor="font-library-category-filter">Filter fonts by category</label>
                    <select id="font-library-category-filter" aria-label="Filter fonts by category" value={fontCategoryFilter} onChange={(event) => setFontCategoryFilter(event.target.value)} className="w-full rounded-xl border border-[#354156] bg-[#111722] px-3 py-2.5 text-xs text-white outline-none focus:border-violet-300/60">
                      <option value="">All categories</option>
                      {library.categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    {(fontRoleFilter || fontCategoryFilter) && <button type="button" onClick={() => { setFontRoleFilter(''); setFontCategoryFilter(''); }} className="justify-self-start rounded-lg border border-[#46536a] px-3 py-2 text-[11px] font-semibold text-[#d4ddea] hover:border-violet-300/40 sm:col-span-2">Clear role and category filters</button>}
                  </>}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="whitespace-nowrap text-[11px] font-semibold text-[#bcc8d8]"><ListFilter className="mr-1 inline h-3.5 w-3.5" />{filteredFonts.length} font records</span>
                  {section === 'fonts' && library.fonts.length > 0 && <button type="button" onClick={deleteAllFonts} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300/30 px-3 py-2 text-[11px] font-semibold text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-300/10"><Trash2 className="h-3.5 w-3.5" />Delete All Fonts</button>}
                </div>
              </div>
            </div>
          )}

          {section === 'dashboard' && <DashboardSection library={library} popularCategories={popularCategories} setSection={setSection} setQuery={setQuery} />}{section === 'import' && <FontImportSection library={library} importMode={importMode} setImportMode={setImportMode} draftText={draftText} setDraftText={setDraftText} draftCategories={draftCategories} setDraftCategories={setDraftCategories} newCategory={newCategory} setNewCategory={setNewCategory} addCategory={addCategory} draftTags={draftTags} setDraftTags={setDraftTags} draftDescription={draftDescription} setDraftDescription={setDraftDescription} prepareDraft={prepareDraft} handlePaste={handlePaste} draft={draft} setDraft={setDraft} saveDraft={saveDraft} updateDraftFont={updateDraftFont} onToast={onToast} organizedText={organizedText} setOrganizedText={setOrganizedText} organizedDraft={organizedDraft} setOrganizedDraft={setOrganizedDraft} organizedCombinationDraft={organizedCombinationDraft} setOrganizedCombinationDraft={setOrganizedCombinationDraft} organizedErrors={organizedErrors} setOrganizedErrors={setOrganizedErrors} mergedImportDuplicates={mergedImportDuplicates} setMergedImportDuplicates={setMergedImportDuplicates} mergedCombinationDuplicates={mergedCombinationDuplicates} setMergedCombinationDuplicates={setMergedCombinationDuplicates} reviewOrganizedImport={reviewOrganizedImport} updateOrganizedCombination={updateOrganizedCombination} categoryResolutions={categoryResolutions} setCategoryResolutions={setCategoryResolutions} unknownImportCategories={unknownImportCategories} importCandidates={importCandidates} importCombinationCandidates={importCombinationCandidates} unresolvedImportCategories={unresolvedImportCategories} duplicateImportNames={duplicateImportNames} saveOrganizedImport={saveOrganizedImport} updateOrganizedEntry={updateOrganizedEntry} existingFontForImport={existingFontForImport} notice={notice} setNotice={setNotice} />}

                    {(section === 'fonts' || section === 'favorites' || section === 'categories') && <FontLibraryList section={section} library={library} compareIds={compareIds} setCompareIds={setCompareIds} fontsById={fontsById} query={query} search={search} setQuery={setQuery} setSection={setSection} categoryMatches={categoryMatches} filteredFonts={filteredFonts} filteredCombinations={filteredCombinations} setLibrary={setLibrary} fontsByName={fontsByName} markUsed={markUsed} persistFontUpdate={persistFontUpdate} toggleFontFavorite={toggleFontFavorite} addFontToProject={addFontToProject} deleteFont={deleteFont} />}

          <FontCollectionsSection section={section} library={library} newCategory={newCategory} setNewCategory={setNewCategory} addCategory={addCategory} deleteCategory={deleteCategory} newCombination={newCombination} setNewCombination={setNewCombination} addCombination={addCombination} query={query} setQuery={setQuery} filteredCombinations={filteredCombinations} setLibrary={setLibrary} fontsByName={fontsByName} fontsById={fontsById} markUsed={markUsed} />

          {section === 'find' && <CreateFontMixSection activePreset={activePreset} findStyle={findStyle} setFindStyle={setFindStyle} setRecommendations={setRecommendations} findProject={findProject} setFindProject={setFindProject} selectedMixCount={selectedMixCount} library={library} findFonts={findFonts} recommendations={recommendations} shuffleFontMix={shuffleFontMix} requiredMixComplete={requiredMixComplete} saveRecommendation={saveRecommendation} lockedRoles={lockedRoles} setLockedRoles={setLockedRoles} rerollRole={rerollRole} />}

          {section === 'projects' && <ProjectSection library={library} newProject={newProject} setNewProject={setNewProject} projectStyle={projectStyle} setProjectStyle={setProjectStyle} projectPurpose={projectPurpose} setProjectPurpose={setProjectPurpose} createProject={createProject} fontsById={fontsById} fontsByName={fontsByName} updateProject={updateProject} setLibrary={setLibrary} markUsed={markUsed} exportProjectCardPng={exportProjectCardPng} />}

          {section === 'favorites' && <FontFavoritesSection library={library} filteredFonts={filteredFonts} compareIds={compareIds} setCompareIds={setCompareIds} fontsByName={fontsByName} fontsById={fontsById} setLibrary={setLibrary} markUsed={markUsed} persistFontUpdate={persistFontUpdate} toggleFontFavorite={toggleFontFavorite} addFontToProject={addFontToProject} deleteFont={deleteFont} setSection={setSection} />}{section === 'settings' && <FontSettingsSection library={library} exportLibrary={exportLibrary} importLibrary={importLibrary} />}{section === 'how-it-works' && <FontHowItWorksSection  />}
        </section>
      </div>
    </main>
  );
}
