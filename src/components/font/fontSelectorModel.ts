export const STORAGE_KEY = 'palettelab_font_selector';
export const DEFAULT_CATEGORIES = [
  'Sans Serif',
  'Serif',
  'Display',
  'Handwritten',
  'Script',
  'Monospace',
  'Decorative',
  'Bold',
  'Minimal',
  'Cinematic Fonts',
  'Italic Fonts',
  'Bold Fonts',
  'Tall Fonts',
];
export const STYLE_OPTIONS = ['Cinematic', 'Bold', 'Minimal', 'Modern', 'Luxury', 'Editorial', 'Playful', 'Documentary', 'Viral / Reels', 'Clean'];
export const ROLE_DETAILS = [
  { id: 'primary', label: 'Primary', description: 'Used for most text.' },
  { id: 'secondary', label: 'Secondary', description: 'Used for supporting information.' },
  { id: 'accent', label: 'Accent', description: 'Used sparingly to create emphasis.' },
  { id: 'supporting', label: 'Supporting', description: 'Optional font for special elements.' },
] as const;
export const FONT_ROLE_OPTIONS = ['Primary', 'Hook', 'Supporting', 'Accent', 'Headline', 'Subheadline', 'Emphasis'];
export const ORGANIZED_IMPORT_EXAMPLE = `FONT: Inter Black
CATEGORIES: Cinematic Fonts, Bold Fonts
ROLES: Primary, Hook
TAGS: Bold
DESCRIPTION:

FONT: Apple Garamond
CATEGORIES: Cinematic Fonts
ROLES: Supporting
TAGS: Serif, Elegant
DESCRIPTION:

FONT: Autography
CATEGORIES: Handwritten, Script, Italic Fonts
ROLES: Accent, Emphasis
TAGS: Elegant, Decorative
DESCRIPTION:

COMBINATION: Creator Reel
FONTS: Inter Black, Autography
BEST FOR: Reels
DESCRIPTION:`;
export const CATEGORY_ACTION_CREATE = '__create__';
export const CATEGORY_ACTION_REMOVE = '__remove__';

export type Section = 'dashboard' | 'fonts' | 'categories' | 'combinations' | 'find' | 'projects' | 'favorites' | 'import' | 'settings' | 'how-it-works';

export interface FontKnowledge {
  name: string;
  categories: string[];
  roles: string[];
  tags: string[];
  description: string;
  notes: string;
}

export interface FontEntry extends FontKnowledge {
  id: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export type DuplicateAction = 'skip' | 'update' | 'keep';

export interface OrganizedImportEntry extends FontKnowledge {
  importId: string;
  duplicateAction: DuplicateAction;
}

export interface OrganizedCombinationEntry {
  importId: string;
  name: string;
  fontNames: string[];
  bestFor: string;
  description: string;
}

export interface CombinationEntry {
  id: string;
  name: string;
  fontNames: string[];
  bestFor: string;
  categories: string[];
  tags: string[];
  description: string;
  notes: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectSet {
  id: string;
  name: string;
  style: string;
  purpose: string;
  fontIds: string[];
  fontRoles: string[];
  combinationId: string;
  notes: string;
  favorite: boolean;
  exportSections: ProjectCardSections;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectCardSections {
  name: boolean;
  style: boolean;
  purpose: boolean;
  fonts: boolean;
  fontDetails: boolean;
  notes: boolean;
}

export const DEFAULT_PROJECT_CARD_SECTIONS: ProjectCardSections = {
  name: true,
  style: true,
  purpose: true,
  fonts: true,
  fontDetails: true,
  notes: true,
};
export const PROJECT_CARD_OPTIONS: [keyof ProjectCardSections, string][] = [
  ['name', 'Project name'],
  ['style', 'Style'],
  ['purpose', 'Purpose'],
  ['fonts', 'Fonts and roles'],
  ['fontDetails', 'Font categories, tags, and descriptions'],
  ['notes', 'Notes'],
];

export interface LibraryState {
  fonts: FontEntry[];
  categories: string[];
  combinations: CombinationEntry[];
  projects: ProjectSet[];
  recent: string[];
}

export interface Recommendation {
  font: FontEntry;
  roleId: string;
  role: string;
  roleDescription: string;
  matchedLabels: string[];
}

export interface MixRole {
  id: string;
  label: string;
  description: string;
  criteria: string[];
}

export interface VideoPreset {
  id: string;
  label: string;
  summary: string;
  minFonts: number;
  maxFonts: number;
  roles: MixRole[];
}

export const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: 'cinematic',
    label: 'Cinematic Reel',
    summary: 'A dramatic headline, readable supporting font, and expressive accent.',
    minFonts: 3,
    maxFonts: 3,
    roles: [
      { id: 'primary', label: 'Primary / Hook', description: 'The lead font for the opening hook and main headline.', criteria: ['primary', 'hook', 'bold', 'display', 'cinematic', 'headline', 'emphasis'] },
      { id: 'supporting', label: 'Supporting', description: 'A readable contrast for captions and supporting text.', criteria: ['supporting', 'subheadline', 'serif', 'elegant', 'readable', 'clean', 'sans'] },
      { id: 'accent', label: 'Accent', description: 'An expressive but controlled font for occasional emphasis.', criteria: ['accent', 'script', 'handwritten', 'italic', 'decorative', 'emphasis'] },
    ],
  },
  {
    id: 'talking-head',
    label: 'Talking Head Reel',
    summary: 'A clear primary, readable captions, and a subtle accent.',
    minFonts: 3,
    maxFonts: 3,
    roles: [
      { id: 'primary', label: 'Primary / Hook', description: 'A strong font for the opening hook and key phrases.', criteria: ['primary', 'hook', 'bold', 'display', 'headline', 'emphasis'] },
      { id: 'supporting', label: 'Supporting', description: 'A clean, readable font for spoken captions.', criteria: ['supporting', 'subheadline', 'clean', 'readable', 'sans', 'minimal'] },
      { id: 'accent', label: 'Accent', description: 'A subtle contrasting style for occasional emphasis.', criteria: ['accent', 'script', 'handwritten', 'italic', 'decorative', 'emphasis'] },
    ],
  },
  {
    id: 'luxury',
    label: 'Luxury',
    summary: 'An elegant headline, restrained supporting font, and refined accent.',
    minFonts: 3,
    maxFonts: 3,
    roles: [
      { id: 'headline', label: 'Headline', description: 'The elegant lead font for the main message.', criteria: ['headline', 'primary', 'elegant', 'serif', 'luxury', 'editorial'] },
      { id: 'supporting', label: 'Supporting', description: 'A restrained, readable font for supporting text.', criteria: ['supporting', 'subheadline', 'clean', 'readable', 'sans', 'minimal'] },
      { id: 'accent', label: 'Accent', description: 'A refined contrasting style for subtle emphasis.', criteria: ['accent', 'script', 'handwritten', 'italic', 'decorative', 'emphasis'] },
    ],
  },
  {
    id: 'viral',
    label: 'Fast / Viral Reel',
    summary: 'A powerful hook, clean supporting text, and a distinctive accent.',
    minFonts: 3,
    maxFonts: 3,
    roles: [
      { id: 'hook', label: 'Hook', description: 'An extremely bold font for fast, attention-grabbing hooks.', criteria: ['hook', 'primary', 'bold', 'display', 'headline', 'viral'] },
      { id: 'supporting', label: 'Supporting', description: 'A clean, readable font for quick captions.', criteria: ['supporting', 'subheadline', 'clean', 'readable', 'sans', 'minimal'] },
      { id: 'accent', label: 'Accent', description: 'A distinctive style for a few standout words.', criteria: ['accent', 'emphasis', 'script', 'handwritten', 'italic', 'decorative'] },
    ],
  },
  {
    id: 'podcast',
    label: 'Podcast',
    summary: 'A strong episode title, readable supporting font, and controlled accent.',
    minFonts: 3,
    maxFonts: 3,
    roles: [
      { id: 'headline', label: 'Headline', description: 'A bold font for episode hooks and key quotes.', criteria: ['primary', 'headline', 'hook', 'bold', 'display', 'emphasis'] },
      { id: 'supporting', label: 'Supporting', description: 'A highly readable font for longer supporting captions.', criteria: ['supporting', 'subheadline', 'readable', 'clean', 'sans', 'minimal'] },
      { id: 'accent', label: 'Accent', description: 'A controlled contrasting style for selected episode details.', criteria: ['accent', 'script', 'handwritten', 'italic', 'decorative', 'emphasis'] },
    ],
  },
];

export const EMPTY_STATE: LibraryState = {
  fonts: [],
  categories: DEFAULT_CATEGORIES,
  combinations: [],
  projects: [],
  recent: [],
};

export const makeId = () => crypto.randomUUID();
export const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
export const keyFor = (value: string) => normalize(value).toLocaleLowerCase();

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseOrganizedImport(text: string): {
  entries: FontKnowledge[];
  combinations: Omit<OrganizedCombinationEntry, 'importId'>[];
  errors: string[];
  mergedDuplicates: string[];
  mergedCombinationDuplicates: string[];
} {
  const entries: FontKnowledge[] = [];
  const combinations: Omit<OrganizedCombinationEntry, 'importId'>[] = [];
  const errors: string[] = [];
  const byName = new Map<string, FontKnowledge>();
  const combinationsByName = new Map<string, Omit<OrganizedCombinationEntry, 'importId'>>();
  let current: FontKnowledge | null = null;
  let currentCombination: Omit<OrganizedCombinationEntry, 'importId'> | null = null;
  let lastField = '';

  const finishEntry = () => {
    if (!current) return;
    const name = normalize(current.name);
    if (!name) {
      errors.push('A FONT record is missing its font name.');
      current = null;
      return;
    }
    const key = keyFor(name);
    const prior = byName.get(key);
    if (prior) {
      prior.categories = [...new Set([...prior.categories, ...current.categories])];
      prior.roles = [...new Set([...prior.roles, ...current.roles])];
      prior.tags = [...new Set([...prior.tags, ...current.tags])];
      prior.description ||= current.description;
    } else {
      const entry = { ...current, name };
      byName.set(key, entry);
      entries.push(entry);
    }
    current = null;
  };

  const finishCombination = () => {
    if (!currentCombination) return;
    const name = normalize(currentCombination.name);
    if (!name) {
      errors.push('A COMBINATION record is missing its name.');
      currentCombination = null;
      return;
    }
    const key = keyFor(name);
    const prior = combinationsByName.get(key);
    if (prior) {
      prior.fontNames = [...new Map([...prior.fontNames, ...currentCombination.fontNames]
        .map((fontName) => [keyFor(fontName), normalize(fontName)] as const)).values()];
      prior.bestFor ||= currentCombination.bestFor;
      prior.description ||= currentCombination.description;
    } else {
      const combination = { ...currentCombination, name };
      combinationsByName.set(key, combination);
      combinations.push(combination);
    }
    currentCombination = null;
  };

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    const field = line.match(/^([A-Z]+(?:\s+[A-Z]+)*)\s*:\s*(.*)$/i);
    if (!field) {
      if (current && lastField === 'DESCRIPTION') current.description = normalize(`${current.description} ${line}`);
      else errors.push(`Line ${index + 1} is not a recognized field and was ignored.`);
      continue;
    }
    const label = field[1].toUpperCase();
    const value = field[2].trim();
    if (label === 'COMBINATION') {
      finishEntry();
      finishCombination();
      currentCombination = { name: value, fontNames: [], bestFor: '', description: '' };
      lastField = 'COMBINATION';
      continue;
    }
    if (label === 'FONT') {
      finishCombination();
      finishEntry();
      current = { name: value, categories: [], roles: [], tags: [], description: '', notes: '' };
      lastField = 'FONT';
      continue;
    }
    if (currentCombination) {
      lastField = label;
      if (label === 'FONTS') {
        currentCombination.fontNames = [...new Set(value.split(',').map(normalize).filter(Boolean))];
      } else if (label === 'BEST FOR') {
        currentCombination.bestFor = value;
      } else if (label === 'DESCRIPTION') {
        currentCombination.description = value;
      } else {
        errors.push(`Line ${index + 1}: unknown combination field "${label}" was ignored.`);
      }
      continue;
    }
    if (!current) {
      errors.push(`Line ${index + 1}: add a FONT: line before ${label}.`);
      continue;
    }
    lastField = label;
    if (label === 'CATEGORIES' || label === 'ROLES' || label === 'TAGS') {
      const values = [...new Set(value.split(',').map(normalize).filter(Boolean))];
      if (label === 'CATEGORIES') current.categories = values;
      if (label === 'ROLES') current.roles = values;
      if (label === 'TAGS') current.tags = values;
    } else if (label === 'DESCRIPTION') {
      current.description = value;
    } else {
      errors.push(`Line ${index + 1}: unknown field "${label}" was ignored.`);
    }
  }
  finishCombination();
  finishEntry();

  const counts = new Map<string, number>();
  text.split(/\r?\n/).forEach((line) => {
    const font = line.match(/^\s*FONT\s*:\s*(.+?)\s*$/i);
    if (font) counts.set(keyFor(font[1]), (counts.get(keyFor(font[1])) ?? 0) + 1);
  });
  const mergedDuplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => entries.find((entry) => keyFor(entry.name) === key)?.name ?? key);

  const combinationCounts = new Map<string, number>();
  text.split(/\r?\n/).forEach((line) => {
    const combination = line.match(/^\s*COMBINATION\s*:\s*(.+?)\s*$/i);
    if (combination) combinationCounts.set(keyFor(combination[1]), (combinationCounts.get(keyFor(combination[1])) ?? 0) + 1);
  });
  const mergedCombinationDuplicates = [...combinationCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => combinations.find((item) => keyFor(item.name) === key)?.name ?? key);

  return { entries, combinations, errors, mergedDuplicates, mergedCombinationDuplicates };
}

export function normalizeFont(value: unknown): FontEntry | null {
  if (!value || typeof value !== 'object') return null;
  const font = value as Record<string, unknown>;
  if (typeof font.name !== 'string' || !font.name.trim()) return null;
  const oldCategory = typeof font.category === 'string' ? [font.category] : [];
  return {
    id: typeof font.id === 'string' ? font.id : makeId(),
    name: normalize(font.name),
    categories: isStringArray(font.categories) ? font.categories : oldCategory,
    roles: isStringArray(font.roles) ? font.roles : [],
    tags: isStringArray(font.tags) ? font.tags : [],
    description: typeof font.description === 'string' ? font.description : '',
    notes: typeof font.notes === 'string' ? font.notes : '',
    favorite: font.favorite === true,
    createdAt: typeof font.createdAt === 'number' ? font.createdAt : typeof font.addedAt === 'number' ? font.addedAt : Date.now(),
    updatedAt: typeof font.updatedAt === 'number' ? font.updatedAt : Date.now(),
  };
}

export function normalizeCombination(value: unknown): CombinationEntry | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.name !== 'string' || !item.name.trim()) return null;
  const legacyFonts = item.fonts && typeof item.fonts === 'object'
    ? Object.values(item.fonts).filter((font): font is string => typeof font === 'string' && Boolean(font))
    : [];
  return {
    id: typeof item.id === 'string' ? item.id : makeId(),
    name: normalize(item.name),
    fontNames: isStringArray(item.fontNames) ? item.fontNames : legacyFonts,
    bestFor: typeof item.bestFor === 'string' ? item.bestFor : '',
    categories: isStringArray(item.categories) ? item.categories : [],
    tags: isStringArray(item.tags) ? item.tags : [],
    description: typeof item.description === 'string' ? item.description : '',
    notes: typeof item.notes === 'string' ? item.notes : '',
    favorite: item.favorite === true,
    createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
    updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
  };
}

export function normalizeProject(value: unknown): ProjectSet | null {
  if (!value || typeof value !== 'object') return null;
  const project = value as Record<string, unknown>;
  if (typeof project.name !== 'string' || !project.name.trim()) return null;
  const fonts = project.fonts && typeof project.fonts === 'object'
    ? Object.values(project.fonts).filter((font): font is string => typeof font === 'string' && Boolean(font))
    : [];
  return {
    id: typeof project.id === 'string' ? project.id : makeId(),
    name: normalize(project.name),
    style: typeof project.style === 'string' ? project.style : '',
    purpose: typeof project.purpose === 'string' ? project.purpose : '',
    fontIds: isStringArray(project.fontIds) ? project.fontIds : fonts,
    fontRoles: isStringArray(project.fontRoles) ? project.fontRoles : [],
    combinationId: typeof project.combinationId === 'string' ? project.combinationId : '',
    notes: typeof project.notes === 'string' ? project.notes : '',
    favorite: project.favorite === true,
    exportSections: project.exportSections && typeof project.exportSections === 'object'
      ? { ...DEFAULT_PROJECT_CARD_SECTIONS, ...project.exportSections as Partial<ProjectCardSections> }
      : { ...DEFAULT_PROJECT_CARD_SECTIONS },
    createdAt: typeof project.createdAt === 'number' ? project.createdAt : Date.now(),
    updatedAt: typeof project.updatedAt === 'number' ? project.updatedAt : Date.now(),
  };
}

export function readLibrary(): LibraryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return EMPTY_STATE;
    const value = saved as Record<string, unknown>;
    const savedCategories = Array.isArray(value.categories)
      ? value.categories.filter((item): item is string => typeof item === 'string')
      : [];
    const categories = [...new Set([...DEFAULT_CATEGORIES, ...savedCategories])];
    return {
      fonts: Array.isArray(value.fonts) ? value.fonts.map(normalizeFont).filter((font): font is FontEntry => font !== null) : [],
      categories,
      combinations: Array.isArray(value.combinations) ? value.combinations.map(normalizeCombination).filter((item): item is CombinationEntry => item !== null) : [],
      projects: Array.isArray(value.projects) ? value.projects.map(normalizeProject).filter((item): item is ProjectSet => item !== null) : [],
      recent: isStringArray(value.recent) ? value.recent : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function createFont(entry: FontKnowledge, now = Date.now()): FontEntry {
  return { ...entry, id: makeId(), favorite: false, createdAt: now, updatedAt: now };
}

export function categoryMatches(left: string, right: string) {
  return keyFor(left).replace(/\s+fonts?$/, '') === keyFor(right).replace(/\s+fonts?$/, '');
}

export function isHighlyDecorative(font: FontEntry) {
  return [...font.categories, ...font.tags].some((label) =>
    ['decorative', 'script', 'handwritten', 'calligraphy', 'ornate'].some((term) => keyFor(label).includes(term)),
  );
}

export function getFontTrait(font: FontEntry, terms: string[]) {
  const text = keyFor([
    font.name,
    ...font.categories,
    ...font.roles,
    ...font.tags,
  ].join(' '));
  return terms.find((term) => text.includes(term)) ?? '';
}

export function getFontTraits(font: FontEntry) {
  const family = getFontTrait(font, ['handwritten', 'script', 'sans serif', 'sans-serif', 'sans', 'serif']);
  const weight = getFontTrait(font, ['extra bold', 'extrabold', 'black', 'heavy', 'bold', 'light', 'thin']);
  const structure = getFontTrait(font, ['display', 'minimal', 'clean', 'readable']);
  const personality = getFontTrait(font, ['decorative', 'playful', 'elegant', 'editorial', 'cinematic', 'modern']);
  const shape = getFontTrait(font, ['condensed', 'tall', 'expanded', 'italic']);
  return [family, weight, structure, personality, shape];
}

export function getPairContrastScore(left: FontEntry, right: FontEntry) {
  const leftTraits = getFontTraits(left);
  const rightTraits = getFontTraits(right);
  const sharedTraitPenalties = [8, 16, 9, 7, 6];
  let score = 0;
  for (let index = 0; index < Math.max(leftTraits.length, rightTraits.length); index += 1) {
    const leftTrait = leftTraits[index];
    const rightTrait = rightTraits[index];
    if (leftTrait && rightTrait) score += leftTrait === rightTrait ? -sharedTraitPenalties[index] : 5;
    else if (leftTrait || rightTrait) score += 2;
  }
  return score;
}

export function getMixSignature(mix: Recommendation[]) {
  return mix.map((item) => item.font.id).sort().join('|');
}

export function generateFontMix(
  fonts: FontEntry[],
  preset: VideoPreset,
  count: number,
  recent: string[],
  previousIds: string[] = [],
  lockedRoles: Record<string, string> = {},
  previouslyShown: ReadonlySet<string> = new Set(),
): Recommendation[] {
  const roles = preset.roles.slice(0, Math.min(Math.max(count, preset.minFonts), preset.maxFonts));
  const candidatesByRole = roles.map((role) => {
    const candidates = fonts.map((font) => {
      const labels = [...font.roles, ...font.categories, ...font.tags];
      const matchedLabels = labels.filter((label) => {
        const normalizedLabel = keyFor(label);
        return normalizedLabel && role.criteria.some((criterion) =>
          normalizedLabel.includes(criterion) || criterion.includes(normalizedLabel),
        );
      });
      return { font, matchedLabels: [...new Set(matchedLabels)] };
    }).filter(({ font, matchedLabels }) =>
      matchedLabels.length > 0 || lockedRoles[role.id] === font.id,
    );
    const lockedFontId = lockedRoles[role.id];
    const candidateScore = (item: typeof candidates[number]) => {
      const normalizedRole = keyFor(role.id);
      const directRoleMatch = item.font.roles.some((fontRole) => keyFor(fontRole) === normalizedRole) ? 12 : 0;
      const visualBonus = role.id === 'accent' && isHighlyDecorative(item.font)
        ? preset.id === 'talking-head' || preset.id === 'podcast' ? 3 : 7
        : 0;
      const luxuryPenalty = preset.id === 'luxury'
        && [...item.font.categories, ...item.font.tags].some((label) => ['playful', 'cartoon'].some((term) => keyFor(label).includes(term)))
        ? 8
        : 0;
      return item.matchedLabels.length * 4
        + directRoleMatch
        + visualBonus
        + (item.font.favorite ? 3 : 0)
        - (recent.includes(item.font.id) ? 1 : 0)
        - (previousIds.includes(item.font.id) ? 24 : 0)
        - luxuryPenalty;
    };
    const ranked = candidates.sort((left, right) =>
      candidateScore(right) - candidateScore(left) || left.font.name.localeCompare(right.font.name),
    );
    if (lockedFontId) return ranked.filter((item) => item.font.id === lockedFontId);
    return ranked;
  });

  const maximumCandidates = Math.max(0, ...candidatesByRole.map((candidates) => candidates.length));
  for (let candidateLimit = Math.min(48, maximumCandidates); candidateLimit > 0;) {
    let best: Recommendation[] = [];
    let bestScore = Number.NEGATIVE_INFINITY;
    const findCombination = (roleIndex: number, selected: Recommendation[]) => {
      if (roleIndex >= roles.length) {
        if (previouslyShown.has(getMixSignature(selected))) return;
        let score = selected.reduce((total, item) => {
          const role = roles.find((candidate) => candidate.id === item.roleId);
          const directRoleMatch = item.font.roles.some((fontRole) => keyFor(fontRole) === keyFor(item.roleId)) ? 12 : 0;
          const accentStyle = item.roleId === 'accent' && isHighlyDecorative(item.font)
            ? preset.id === 'talking-head' || preset.id === 'podcast' ? 3 : 7
            : 0;
          const readableSupport = item.roleId === 'supporting'
            && getFontTrait(item.font, ['clean', 'readable', 'minimal', 'sans', 'serif'])
            ? 4
            : 0;
          const dramaticLead = (item.roleId === 'primary' || item.roleId === 'headline' || item.roleId === 'hook')
            && getFontTrait(item.font, ['bold', 'black', 'heavy', 'display'])
            ? 4
            : 0;
          const luxuryPenalty = preset.id === 'luxury'
            && [...item.font.categories, ...item.font.tags].some((label) => ['playful', 'cartoon'].some((term) => keyFor(label).includes(term)))
            ? 8
            : 0;
          return total
            + item.matchedLabels.length * 4
            + directRoleMatch
            + accentStyle
            + readableSupport
            + dramaticLead
            + (item.font.favorite ? 3 : 0)
            - (recent.includes(item.font.id) ? 1 : 0)
            - (previousIds.includes(item.font.id) ? 24 : 0)
            - luxuryPenalty
            + (role ? 1 : 0);
        }, 0);
        for (let left = 0; left < selected.length; left += 1) {
          for (let right = left + 1; right < selected.length; right += 1) {
            score += getPairContrastScore(selected[left].font, selected[right].font);
          }
        }
        if (score > bestScore) {
          best = selected;
          bestScore = score;
        }
        return;
      }
      const role = roles[roleIndex];
      const candidates = candidatesByRole[roleIndex].slice(0, candidateLimit);
      for (const candidate of candidates) {
        if (selected.some((item) => item.font.id === candidate.font.id)) continue;
        findCombination(roleIndex + 1, [...selected, {
          font: candidate.font,
          roleId: role.id,
          role: role.label,
          roleDescription: role.description,
          matchedLabels: candidate.matchedLabels,
        }]);
      }
    };

    findCombination(0, []);
    if (best.length) return best;
    if (candidateLimit === maximumCandidates) break;
    candidateLimit = Math.min(maximumCandidates, candidateLimit * 2);
  }
  return [];
}

export function explainMixRole(recommendation: Recommendation, mix: Recommendation[]) {
  const mainFont = mix.find((item) => ['primary', 'headline', 'hook'].includes(item.roleId));
  const supportingFont = mix.find((item) => item.roleId === 'supporting');
  if (recommendation.roleId === 'accent') {
    const expressiveStyle = getFontTrait(recommendation.font, ['script', 'handwritten', 'italic', 'decorative']);
    return expressiveStyle
      ? `Its ${expressiveStyle} style adds visual personality without competing with ${mainFont?.font.name ?? 'the main font'}.`
      : `Its distinct classifications add a controlled visual note beside ${mainFont?.font.name ?? 'the main font'}.`;
  }
  if (recommendation.roleId === 'supporting') {
    const readableStyle = getFontTrait(recommendation.font, ['clean', 'readable', 'minimal', 'sans', 'serif']);
    return readableStyle
      ? `Its ${readableStyle} structure keeps supporting text readable and balances ${mainFont?.font.name ?? 'the lead font'}.`
      : `Its supporting classification gives the main font a clearer, more readable counterpoint.`;
  }
  const labels = [recommendation.font.name, ...recommendation.font.categories, ...recommendation.font.roles, ...recommendation.font.tags].map(keyFor);
  const isSerif = labels.some((label) => label === 'serif' || (label.includes('serif') && !label.includes('sans')));
  const weight = getFontTrait(recommendation.font, ['extra bold', 'extrabold', 'black', 'heavy', 'bold']);
  const isDisplay = labels.some((label) => label.includes('display'));
  const leadStyle = recommendation.roleId === 'headline' && isSerif
    ? 'elegant serif'
    : weight
      ? `${weight === 'black' || weight === 'heavy' ? 'heavy' : weight}${isDisplay ? ' display' : ''}`
      : isDisplay ? 'dramatic display' : isSerif ? 'elegant serif' : 'distinctive';
  return leadStyle
    ? `Its ${leadStyle} style gives the ${recommendation.role.toLowerCase()} a clear visual lead over ${supportingFont?.font.name ?? 'the supporting font'}.`
    : `Its ${recommendation.role.toLowerCase()} classification makes it the main voice, distinct from the supporting and accent fonts.`;
}

