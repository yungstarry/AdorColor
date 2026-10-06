import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { exportProjectCardPng as exportProjectCardPngImage } from './projectCardPng';
import { FontSelectorView } from './FontSelectorView';
import {
  CATEGORY_ACTION_CREATE, CATEGORY_ACTION_REMOVE, DEFAULT_CATEGORIES, DEFAULT_PROJECT_CARD_SECTIONS,
  FONT_ROLE_OPTIONS, STORAGE_KEY, VIDEO_PRESETS, categoryMatches,
  createFont, generateFontMix, getMixSignature, isStringArray,
  keyFor, makeId, normalize, normalizeCombination,
  normalizeFont, normalizeProject, parseOrganizedImport, readLibrary,
  type CombinationEntry, type DuplicateAction, type FontEntry, type FontKnowledge,
  type LibraryState, type OrganizedCombinationEntry, type OrganizedImportEntry,
  type ProjectSet, type Recommendation, type Section,
} from './fontSelectorModel';

export function FontSelector({ onToast }: { onToast: (message: string) => void }) {
  const [library, setLibrary] = useState<LibraryState>(readLibrary);
  const [section, setSection] = useState<Section>('find');
  const [query, setQuery] = useState('');
  const [importMode, setImportMode] = useState<'manual' | 'organized'>('manual');
  const [organizedText, setOrganizedText] = useState('');
  const [organizedDraft, setOrganizedDraft] = useState<OrganizedImportEntry[] | null>(null);
  const [organizedCombinationDraft, setOrganizedCombinationDraft] = useState<OrganizedCombinationEntry[]>([]);
  const [categoryResolutions, setCategoryResolutions] = useState<Record<string, string>>({});
  const [organizedErrors, setOrganizedErrors] = useState<string[]>([]);
  const [mergedImportDuplicates, setMergedImportDuplicates] = useState<string[]>([]);
  const [mergedCombinationDuplicates, setMergedCombinationDuplicates] = useState<string[]>([]);
  const [fontRoleFilter, setFontRoleFilter] = useState('');
  const [fontCategoryFilter, setFontCategoryFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [draftText, setDraftText] = useState('');
  const [draft, setDraft] = useState<FontKnowledge[] | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftTags, setDraftTags] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [newCombination, setNewCombination] = useState('');
  const [newProject, setNewProject] = useState('');
  const [projectStyle, setProjectStyle] = useState('');
  const [projectPurpose, setProjectPurpose] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [shownMixes, setShownMixes] = useState<string[]>([]);
  const [lockedRoles, setLockedRoles] = useState<Record<string, string>>({});
  const [findProject, setFindProject] = useState('');
  const [findStyle, setFindStyle] = useState('cinematic');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch {
      setNotice('Could not save your font knowledge. Browser storage may be full.');
    }
  }, [library]);

  const fontsByName = useMemo(() => new Map(library.fonts.map((font) => [keyFor(font.name), font])), [library.fonts]);
  const fontsById = useMemo(() => new Map(library.fonts.map((font) => [font.id, font])), [library.fonts]);
  const availableFontRoles = useMemo(() => [...new Map(
    [...FONT_ROLE_OPTIONS, ...library.fonts.flatMap((font) => font.roles)]
      .map((role) => [keyFor(role), normalize(role)] as const)
      .filter(([key]) => Boolean(key)),
  ).values()].sort((left, right) => left.localeCompare(right)), [library.fonts]);
  const popularCategories = useMemo(() => library.categories.map((category) => ({
    category,
    count: library.fonts.filter((font) => font.categories.some((item) => categoryMatches(item, category))).length,
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 6), [library.categories, library.fonts]);

  const search = query.trim().toLocaleLowerCase();
  const filteredFonts = library.fonts.filter((font) => {
    const matchesSearch = !search || [
      font.name, font.description, font.notes, ...font.roles, ...font.categories, ...font.tags,
    ].some((item) => item.toLocaleLowerCase().includes(search));
    if (!matchesSearch) return false;
    if (section === 'fonts' && fontRoleFilter && !font.roles.some((role) => keyFor(role) === keyFor(fontRoleFilter))) return false;
    if (section === 'fonts' && fontCategoryFilter && !font.categories.some((category) => categoryMatches(category, fontCategoryFilter))) return false;
    if (section === 'favorites') return font.favorite;
    if (section === 'categories' && search) return font.categories.some((item) => item.toLocaleLowerCase().includes(search));
    return true;
  });
  const filteredCombinations = library.combinations.filter((item) =>
    !search || [item.name, item.description, item.notes, item.bestFor, ...item.categories, ...item.tags, ...item.fontNames]
      .some((value) => value.toLocaleLowerCase().includes(search)),
  );
  const activePreset = VIDEO_PRESETS.find((item) => item.id === findStyle) ?? VIDEO_PRESETS[0];
  const selectedMixCount = activePreset.maxFonts;
  const requiredMixComplete = Boolean(recommendations)
    && recommendations?.length === 3
    && new Set(recommendations.map((item) => item.font.id)).size === 3
    && recommendations.every((item) => library.fonts.some((font) => font.id === item.font.id))
    && activePreset.roles.slice(0, selectedMixCount).every((role) =>
      recommendations?.some((item) => item.roleId === role.id),
    )
    && recommendations.some((item) => item.roleId === 'accent');
  const importCandidates = organizedDraft?.filter((entry) => entry.duplicateAction !== 'skip') ?? [];
  const importCombinationCandidates = organizedCombinationDraft;
  const unknownImportCategories = [...new Map(importCandidates
    .flatMap((entry) => entry.categories)
    .filter((category) => !library.categories.some((existing) => keyFor(existing) === keyFor(category)))
    .map((category) => [keyFor(category), category] as const)).values()];
  const duplicateImportNames = organizedDraft?.filter((entry, index, entries) =>
    entries.findIndex((candidate) => keyFor(candidate.name) === keyFor(entry.name)) !== index,
  ).map((entry) => entry.name) ?? [];
  const unresolvedImportCategories = unknownImportCategories.filter((category) => !categoryResolutions[keyFor(category)]);
  const existingFontForImport = (entry: FontKnowledge) => library.fonts.find((font) => keyFor(font.name) === keyFor(entry.name));

  const persistFontUpdate = (id: string, update: Partial<FontEntry>) => {
    setLibrary((current) => ({
      ...current,
      fonts: current.fonts.map((font) => font.id === id ? { ...font, ...update, updatedAt: Date.now() } : font),
    }));
  };

  const toggleFontFavorite = (font: FontEntry) => persistFontUpdate(font.id, { favorite: !font.favorite });

  const markUsed = (ids: string[]) => setLibrary((current) => ({
    ...current,
    recent: [...new Set([...ids, ...current.recent])].slice(0, 20),
  }));

  const prepareDraft = (text: string) => {
    setDraftText(text);
    const knownFonts = new Set(library.fonts.map((font) => keyFor(font.name)));
    const seen = new Set<string>();
    const names = text.split(/\r?\n/)
      .map((line) => normalize(line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')))
      .filter((name) => {
        if (!name || knownFonts.has(keyFor(name)) || seen.has(keyFor(name))) return false;
        seen.add(keyFor(name));
        return true;
      });
    const tags = [...new Set(draftTags.split(',').map(normalize).filter(Boolean))];
    setDraft(names.map((name) => ({
      name,
      categories: [...draftCategories],
      roles: [],
      tags,
      description: draftDescription.trim(),
      notes: '',
    })));
    setNotice(names.length
      ? `Found ${names.length} new font${names.length === 1 ? '' : 's'}. Review the names and details before saving.`
      : 'No new font names found. Remove duplicates or add a font name on each line.');
  };

  const updateDraftFont = (index: number, update: Partial<FontKnowledge>) => {
    setDraft((current) => current?.map((font, itemIndex) => itemIndex === index ? { ...font, ...update } : font) ?? null);
  };

  const saveDraft = () => {
    if (!draft) return;
    const fonts = draft.filter((font) => font.name.trim()).map((font) => createFont({
      ...font,
      name: normalize(font.name),
      categories: [...new Set(font.categories.map(normalize).filter(Boolean))],
      roles: [...new Set(font.roles.map(normalize).filter(Boolean))],
      tags: [...new Set(font.tags.map(normalize).filter(Boolean))],
    }));
    const existingNames = new Set(library.fonts.map((font) => keyFor(font.name)));
    const savedNames = new Set(existingNames);
    const uniqueFonts = fonts.filter((font) => {
      const key = keyFor(font.name);
      if (savedNames.has(key)) return false;
      savedNames.add(key);
      return true;
    });
    setLibrary((current) => ({
      ...current,
      fonts: [...uniqueFonts, ...current.fonts],
    }));
    setDraft(null);
    setDraftText('');
    setNotice(`Saved ${uniqueFonts.length} font${uniqueFonts.length === 1 ? '' : 's'} to My Fonts.`);
  };

  const reviewOrganizedImport = () => {
    const parsed = parseOrganizedImport(organizedText);
    if (!parsed.entries.length && !parsed.combinations.length) {
      setOrganizedDraft(null);
      setOrganizedCombinationDraft([]);
      setOrganizedErrors(parsed.errors.length ? parsed.errors : ['No FONT: or COMBINATION: records found. Add at least one record and try again.']);
      setMergedImportDuplicates([]);
      setMergedCombinationDuplicates([]);
      return;
    }
    setOrganizedDraft(parsed.entries.map((entry) => ({
      ...entry,
      importId: makeId(),
      duplicateAction: library.fonts.some((font) => keyFor(font.name) === keyFor(entry.name)) ? 'skip' : 'keep',
    })));
    setOrganizedCombinationDraft(parsed.combinations.map((combination) => ({
      ...combination,
      importId: makeId(),
    })));
    setOrganizedErrors(parsed.errors);
    setMergedImportDuplicates(parsed.mergedDuplicates);
    setMergedCombinationDuplicates(parsed.mergedCombinationDuplicates);
    setCategoryResolutions({});
    setNotice('');
  };

  const updateOrganizedEntry = (importId: string, update: Partial<FontKnowledge>) => {
    setOrganizedDraft((current) => current?.map((entry) => {
      if (entry.importId !== importId) return entry;
      if (typeof update.name !== 'string') return { ...entry, ...update };
      const hadExistingMatch = library.fonts.some((font) => keyFor(font.name) === keyFor(entry.name));
      const hasNextMatch = library.fonts.some((font) => keyFor(font.name) === keyFor(update.name ?? ''));
      const duplicateAction = hadExistingMatch !== hasNextMatch
        ? hasNextMatch ? 'skip' : 'keep'
        : entry.duplicateAction;
      return { ...entry, ...update, duplicateAction };
    }) ?? null);
  };

  const updateOrganizedCombination = (importId: string, update: Partial<Omit<OrganizedCombinationEntry, 'importId'>>) => {
    setOrganizedCombinationDraft((current) => current.map((item) => item.importId === importId ? { ...item, ...update } : item));
  };

  const saveOrganizedImport = () => {
    if (!organizedDraft) return;
    if (duplicateImportNames.length) {
      setNotice(`Resolve duplicate names in the review before importing: ${[...new Set(duplicateImportNames)].join(', ')}.`);
      return;
    }
    if (unresolvedImportCategories.length) {
      setNotice(`Choose whether to create, map, or remove each unknown category: ${unresolvedImportCategories.join(', ')}.`);
      return;
    }
    const now = Date.now();
    const newCategories = unknownImportCategories
      .filter((category) => categoryResolutions[keyFor(category)] === CATEGORY_ACTION_CREATE);
    const processedEntries = importCandidates.map((entry) => {
      const categories = entry.categories.flatMap((category) => {
        if (library.categories.some((existing) => keyFor(existing) === keyFor(category))) return [library.categories.find((existing) => keyFor(existing) === keyFor(category)) ?? category];
        const resolution = categoryResolutions[keyFor(category)];
        if (resolution === CATEGORY_ACTION_REMOVE) return [];
        if (resolution === CATEGORY_ACTION_CREATE) return [normalize(category)];
        if (resolution.startsWith('map:')) return [resolution.slice(4)];
        return [];
      });
      return {
        ...entry,
        name: normalize(entry.name),
        categories: [...new Set(categories)],
        roles: [...new Set(entry.roles.map(normalize).filter(Boolean))],
        tags: [...new Set(entry.tags.map(normalize).filter(Boolean))],
        description: entry.description.trim(),
      };
    });
    const updates = new Map<string, FontEntry>();
    const additions: FontEntry[] = [];
    for (const entry of processedEntries) {
      const existing = library.fonts.find((font) => keyFor(font.name) === keyFor(entry.name));
      if (entry.duplicateAction === 'update' && existing) {
        updates.set(existing.id, {
          ...existing,
          categories: entry.categories,
          roles: entry.roles,
          tags: entry.tags,
          description: entry.description,
          updatedAt: now,
        });
      } else {
        additions.push(createFont({
          name: entry.name,
          categories: entry.categories,
          roles: entry.roles,
          tags: entry.tags,
          description: entry.description,
          notes: '',
        }, now));
      }
    }
    const combinationUpdates = new Map<string, CombinationEntry>();
    const combinationAdditions: CombinationEntry[] = [];
    for (const combination of importCombinationCandidates) {
      const existing = library.combinations.find((item) => keyFor(item.name) === keyFor(combination.name));
      if (existing) {
        combinationUpdates.set(existing.id, {
          ...existing,
          fontNames: [...new Map([...existing.fontNames, ...combination.fontNames]
            .map((fontName) => [keyFor(fontName), normalize(fontName)] as const)).values()],
          bestFor: combination.bestFor || existing.bestFor,
          description: combination.description || existing.description,
          updatedAt: now,
        });
      } else {
        combinationAdditions.push({
          id: makeId(),
          name: normalize(combination.name),
          fontNames: [...new Set(combination.fontNames.map(normalize).filter(Boolean))],
          bestFor: normalize(combination.bestFor),
          categories: [],
          tags: [],
          description: combination.description.trim(),
          notes: '',
          favorite: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    setLibrary((current) => ({
      ...current,
      categories: [...new Set([...current.categories, ...newCategories])],
      fonts: [...additions, ...current.fonts.map((font) => updates.get(font.id) ?? font)],
      combinations: [...combinationAdditions, ...current.combinations.map((item) => combinationUpdates.get(item.id) ?? item)],
    }));
    const updatedCount = updates.size;
    const addedCount = additions.length;
    const skippedCount = (organizedDraft.length - importCandidates.length);
    setOrganizedDraft(null);
    setOrganizedCombinationDraft([]);
    setOrganizedText('');
    setCategoryResolutions({});
    setOrganizedErrors([]);
    setMergedImportDuplicates([]);
    setMergedCombinationDuplicates([]);
    setNotice(`Organized import complete: ${addedCount} font${addedCount === 1 ? '' : 's'} added, ${updatedCount} updated, ${skippedCount} skipped, ${combinationAdditions.length} combination${combinationAdditions.length === 1 ? '' : 's'} added, ${combinationUpdates.size} updated.`);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        onToast('Clipboard has no text. Paste your font list into the text area instead.');
        return;
      }
      setDraftText(text);
      setSection('import');
      setDraft(null);
      onToast('Font list pasted. Select Review list to check the names before saving.');
    } catch {
      onToast('Clipboard access was denied. Focus the font list box and press Ctrl+V (or Cmd+V) instead.');
    }
  };

  const addCategory = () => {
    const category = normalize(newCategory);
    if (!category || library.categories.some((item) => keyFor(item) === keyFor(category))) return;
    setLibrary((current) => ({ ...current, categories: [...current.categories, category] }));
    setDraftCategories((current) => [...new Set([...current, category])]);
    setNewCategory('');
  };

  const deleteCategory = (category: string) => {
    if (!window.confirm(`Remove "${category}" from your categories? Fonts will keep their names and notes, but lose this category.`)) return;
    setLibrary((current) => ({
      ...current,
      categories: current.categories.filter((item) => item !== category),
      fonts: current.fonts.map((font) => ({ ...font, categories: font.categories.filter((item) => item !== category) })),
      combinations: current.combinations.map((combo) => ({ ...combo, categories: combo.categories.filter((item) => item !== category) })),
    }));
  };

  const addCombination = () => {
    const name = normalize(newCombination);
    if (!name || library.combinations.some((item) => keyFor(item.name) === keyFor(name))) return;
    const combo: CombinationEntry = {
      id: makeId(), name, fontNames: [], bestFor: '', categories: [], tags: [], notes: '', description: '',
      favorite: false, createdAt: Date.now(), updatedAt: Date.now(),
    };
    setLibrary((current) => ({ ...current, combinations: [combo, ...current.combinations] }));
    setNewCombination('');
  };

  const createProject = () => {
    const name = normalize(newProject);
    if (!name) return;
    setLibrary((current) => ({
      ...current,
      projects: [{
        id: makeId(), name, style: projectStyle, purpose: projectPurpose, fontIds: [],
        fontRoles: [],
        combinationId: '', notes: '', favorite: false, exportSections: { ...DEFAULT_PROJECT_CARD_SECTIONS },
        createdAt: Date.now(), updatedAt: Date.now(),
      }, ...current.projects],
    }));
    setNewProject('');
    setProjectStyle('');
    setProjectPurpose('');
    setNotice(`Project set "${name}" created.`);
  };

  const updateProject = (id: string, update: Partial<ProjectSet>) => setLibrary((current) => ({
    ...current,
    projects: current.projects.map((project) => project.id === id ? { ...project, ...update, updatedAt: Date.now() } : project),
  }));

  const findFonts = () => {
    const preset = VIDEO_PRESETS.find((item) => item.id === findStyle) ?? VIDEO_PRESETS[0];
    const ranked = generateFontMix(library.fonts, preset, selectedMixCount, library.recent, [], lockedRoles);
    setRecommendations(ranked);
    setShownMixes(ranked.length === 3 ? [getMixSignature(ranked)] : []);
    const missingRoles = preset.roles.slice(0, selectedMixCount).filter((role) =>
      !ranked.some((item) => item.roleId === role.id),
    );
    if (!library.fonts.length) {
      setNotice('Add your font names and classify their roles, categories, or tags before creating a mix.');
    } else if (missingRoles.length) {
      setNotice(`No complete mix yet. In My Fonts, assign a matching role or category/tag for ${missingRoles.map((role) => `${role.label} (${role.criteria.slice(0, 3).join(', ')})`).join(' and ')}.`);
    } else {
      markUsed(ranked.map((item) => item.font.id));
      setNotice(`Created a balanced ${preset.label} mix with a main font, supporting font, and accent.`);
    }
  };

  const shuffleFontMix = () => {
    const preset = VIDEO_PRESETS.find((item) => item.id === findStyle) ?? VIDEO_PRESETS[0];
    const previousIds = recommendations?.filter((item) => lockedRoles[item.roleId] !== item.font.id).map((item) => item.font.id) ?? [];
    const shown = new Set(shownMixes);
    if (recommendations?.length === 3) shown.add(getMixSignature(recommendations));
    const next = generateFontMix(library.fonts, preset, selectedMixCount, library.recent, previousIds, lockedRoles, shown);
    if (next.length === 3) {
      const signature = getMixSignature(next);
      setRecommendations(next);
      setShownMixes((current) => current.includes(signature) ? current : [...current, signature]);
      markUsed(next.map((item) => item.font.id));
      setNotice(`Showing a new balanced mix (${shown.size + 1} unique mixes explored). Shuffle again to keep exploring.`);
    } else {
      setNotice('You have explored every unique balanced mix available with these locks. Change a lock or add more classified fonts to continue.');
    }
  };

  const rerollRole = (roleId: string) => {
    const currentMix = recommendations;
    if (!currentMix || lockedRoles[roleId]) return;
    const preset = VIDEO_PRESETS.find((item) => item.id === findStyle) ?? VIDEO_PRESETS[0];
    const role = preset.roles.find((item) => item.id === roleId);
    const currentRecommendation = currentMix.find((item) => item.roleId === roleId);
    if (!role || !currentRecommendation) return;
    const roleLocks = Object.fromEntries(currentMix
      .filter((item) => item.roleId !== roleId)
      .map((item) => [item.roleId, item.font.id]));
    const next = generateFontMix(
      library.fonts,
      preset,
      selectedMixCount,
      library.recent,
      [currentRecommendation.font.id],
      { ...lockedRoles, ...roleLocks },
    );
    const updatedRole = next.find((item) => item.roleId === roleId);
    if (next.length !== 3 || !updatedRole || updatedRole.font.id === currentRecommendation.font.id) {
      setNotice(`No alternate font matches ${role.label} while keeping the other roles fixed. Add or classify another font to re-roll this role.`);
      return;
    }
    setRecommendations(next);
    markUsed([updatedRole.font.id]);
    setNotice(`Re-rolled ${role.label}; the rest of the mix stayed the same.`);
  };

  const saveRecommendation = () => {
    if (!recommendations?.length) return;
    const preset = VIDEO_PRESETS.find((item) => item.id === findStyle) ?? VIDEO_PRESETS[0];
    const missingRequired = recommendations.length !== 3
      || new Set(recommendations.map((item) => item.font.id)).size !== 3
      || recommendations.some((item) => !library.fonts.some((font) => font.id === item.font.id))
      || preset.roles.slice(0, selectedMixCount).some((role) =>
        !recommendations.some((item) => item.roleId === role.id),
      )
      || !recommendations.some((item) => item.roleId === 'accent');
    if (missingRequired) {
      setNotice('A mix must contain three unique library fonts assigned to its main, supporting, and accent roles before it can be saved.');
      return;
    }
    const name = normalize(findProject) || `${preset.label} Font Mix`;
    const ids = recommendations.map((item) => item.font.id);
    const item: ProjectSet = {
      id: makeId(), name, style: preset.label, purpose: 'Video typography mix', fontIds: ids,
      fontRoles: recommendations.map((match) => match.role),
      combinationId: '', notes: `Created with the ${preset.label} preset. Roles: ${recommendations.map((match) => `${match.role} — ${match.font.name}`).join('; ')}.`,
      favorite: false, exportSections: { ...DEFAULT_PROJECT_CARD_SECTIONS },
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setLibrary((current) => ({ ...current, projects: [item, ...current.projects], recent: [...new Set([...ids, ...current.recent])].slice(0, 20) }));
    setSection('projects');
    setRecommendations(null);
    setNotice(`Video typography mix "${name}" saved to Projects.`);
  };

  const exportProjectCardPng = (project: ProjectSet) => exportProjectCardPngImage(project, fontsById, onToast);

  const exportLibrary = () => {
    const blob = new Blob([JSON.stringify({
      format: 'PaletteLab Font Knowledge Library',
      version: 3,
      exportedAt: new Date().toISOString(),
      ...library,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'font-knowledge-library.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Font names, categories, combinations, projects, favorites, and notes exported.');
  };

  const importLibrary = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as Record<string, unknown>;
      const next: LibraryState = {
        fonts: Array.isArray(imported.fonts) ? imported.fonts.map(normalizeFont).filter((font): font is FontEntry => font !== null) : [],
        categories: Array.isArray(imported.categories)
          ? [...new Set([...DEFAULT_CATEGORIES, ...imported.categories.filter((item): item is string => typeof item === 'string')])]
          : DEFAULT_CATEGORIES,
        combinations: Array.isArray(imported.combinations) ? imported.combinations.map(normalizeCombination).filter((item): item is CombinationEntry => item !== null) : [],
        projects: Array.isArray(imported.projects) ? imported.projects.map(normalizeProject).filter((item): item is ProjectSet => item !== null) : [],
        recent: isStringArray(imported.recent) ? imported.recent : [],
      };
      if (!Array.isArray(imported.fonts)) throw new Error('This JSON file does not contain a font knowledge library.');
      setLibrary(next);
      setNotice('Font knowledge library imported.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not import this library file.');
    }
  };

  const addFontToProject = (font: FontEntry, projectId: string) => {
    const project = library.projects.find((item) => item.id === projectId);
    if (!project) return;
    const fontIds = [...project.fontIds];
    if (!fontIds.includes(font.id) && fontIds.filter(Boolean).length < 4) fontIds.push(font.id);
    updateProject(project.id, { fontIds });
    markUsed([font.id]);
    setNotice(`Added ${font.name} to ${project.name}.`);
  };

  const deleteFont = (id: string) => {
    const font = fontsById.get(id);
    if (!font || !window.confirm(`Remove "${font.name}" from your font knowledge library?`)) return;
    setLibrary((current) => ({
      ...current,
      fonts: current.fonts.filter((item) => item.id !== id),
      recent: current.recent.filter((item) => item !== id),
      combinations: current.combinations.map((combo) => ({
        ...combo,
        fontNames: combo.fontNames.filter((name) => keyFor(name) !== keyFor(font.name)),
      })),
      projects: current.projects.map((project) => ({ ...project, fontIds: project.fontIds.filter((item) => item !== id) })),
    }));
    setCompareIds((current) => current.filter((item) => item !== id));
  };

  const deleteAllFonts = () => {
    const fontCount = library.fonts.length;
    if (!fontCount || !window.confirm(`Delete all ${fontCount} font records? This also removes font references from saved combinations and project sets. Your combinations, project sets, and categories will remain.`)) return;
    setLibrary((current) => ({
      ...current,
      fonts: [],
      recent: [],
      combinations: current.combinations.map((combo) => ({ ...combo, fontNames: [] })),
      projects: current.projects.map((project) => ({ ...project, fontIds: [] })),
    }));
    setCompareIds([]);
    setLockedRoles({});
    setRecommendations(null);
    setNotice(`Deleted all ${fontCount} font records. Your combinations, project sets, and categories were kept.`);
  };

  return (
    <FontSelectorView
      {...{
        library, section, setSection, query, setQuery, notice,
        setNotice, availableFontRoles, fontRoleFilter, setFontRoleFilter, fontCategoryFilter, setFontCategoryFilter,
        filteredFonts, deleteAllFonts, popularCategories, search, importMode, setImportMode,
        draftText, setDraftText, draftCategories, setDraftCategories, newCategory, setNewCategory,
        addCategory, deleteCategory, draftTags, setDraftTags, draftDescription, setDraftDescription,
        prepareDraft, handlePaste, draft, setDraft, saveDraft, updateDraftFont,
        onToast, organizedText, setOrganizedText, organizedDraft, setOrganizedDraft, organizedCombinationDraft,
        setOrganizedCombinationDraft, organizedErrors, setOrganizedErrors, mergedImportDuplicates, setMergedImportDuplicates, mergedCombinationDuplicates,
        setMergedCombinationDuplicates, reviewOrganizedImport, updateOrganizedCombination, categoryResolutions, setCategoryResolutions, unknownImportCategories,
        importCandidates, importCombinationCandidates, unresolvedImportCategories, duplicateImportNames, saveOrganizedImport, updateOrganizedEntry,
        existingFontForImport, newCombination, setNewCombination, addCombination, filteredCombinations, setLibrary,
        fontsByName, fontsById, markUsed, compareIds, setCompareIds, persistFontUpdate,
        toggleFontFavorite, addFontToProject, deleteFont, newProject, setNewProject, projectStyle,
        setProjectStyle, projectPurpose, setProjectPurpose, createProject, updateProject, exportProjectCardPng,
        activePreset, findStyle, setFindStyle, setRecommendations, findProject, setFindProject,
        selectedMixCount, findFonts, recommendations, shuffleFontMix, requiredMixComplete, saveRecommendation,
        lockedRoles, setLockedRoles, rerollRole, exportLibrary, importLibrary, categoryMatches,
      }}
    />
  );
}