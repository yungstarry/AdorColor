import { ChangeEvent, useEffect, useMemo, useState } from 'react';
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
import ORGANIZER_PROMPT from './fontOrganizerPrompt';

const STORAGE_KEY = 'palettelab_font_selector';
const DEFAULT_CATEGORIES = [
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
const STYLE_OPTIONS = ['Cinematic', 'Bold', 'Minimal', 'Modern', 'Luxury', 'Editorial', 'Playful', 'Documentary', 'Viral / Reels', 'Clean'];
const ROLE_DETAILS = [
  { id: 'primary', label: 'Primary', description: 'Used for most text.' },
  { id: 'secondary', label: 'Secondary', description: 'Used for supporting information.' },
  { id: 'accent', label: 'Accent', description: 'Used sparingly to create emphasis.' },
  { id: 'supporting', label: 'Supporting', description: 'Optional font for special elements.' },
] as const;
const FONT_ROLE_OPTIONS = ['Primary', 'Hook', 'Supporting', 'Accent', 'Headline', 'Subheadline', 'Emphasis'];
const ORGANIZED_IMPORT_EXAMPLE = `FONT: Inter Black
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
const CATEGORY_ACTION_CREATE = '__create__';
const CATEGORY_ACTION_REMOVE = '__remove__';

type Section = 'dashboard' | 'fonts' | 'categories' | 'combinations' | 'find' | 'projects' | 'favorites' | 'import' | 'settings' | 'how-it-works';

interface FontKnowledge {
  name: string;
  categories: string[];
  roles: string[];
  tags: string[];
  description: string;
  notes: string;
}

interface FontEntry extends FontKnowledge {
  id: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

type DuplicateAction = 'skip' | 'update' | 'keep';

interface OrganizedImportEntry extends FontKnowledge {
  importId: string;
  duplicateAction: DuplicateAction;
}

interface OrganizedCombinationEntry {
  importId: string;
  name: string;
  fontNames: string[];
  bestFor: string;
  description: string;
}

interface CombinationEntry {
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

interface ProjectSet {
  id: string;
  name: string;
  style: string;
  purpose: string;
  fontIds: string[];
  fontRoles: string[];
  combinationId: string;
  notes: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

interface LibraryState {
  fonts: FontEntry[];
  categories: string[];
  combinations: CombinationEntry[];
  projects: ProjectSet[];
  recent: string[];
}

interface Recommendation {
  font: FontEntry;
  roleId: string;
  role: string;
  roleDescription: string;
  matchedLabels: string[];
}

interface MixRole {
  id: string;
  label: string;
  description: string;
  criteria: string[];
}

interface VideoPreset {
  id: string;
  label: string;
  summary: string;
  minFonts: number;
  maxFonts: number;
  roles: MixRole[];
}

const VIDEO_PRESETS: VideoPreset[] = [
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

const EMPTY_STATE: LibraryState = {
  fonts: [],
  categories: DEFAULT_CATEGORIES,
  combinations: [],
  projects: [],
  recent: [],
};

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

const makeId = () => crypto.randomUUID();
const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
const keyFor = (value: string) => normalize(value).toLocaleLowerCase();

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseOrganizedImport(text: string): {
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

function normalizeFont(value: unknown): FontEntry | null {
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

function normalizeCombination(value: unknown): CombinationEntry | null {
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

function normalizeProject(value: unknown): ProjectSet | null {
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
    createdAt: typeof project.createdAt === 'number' ? project.createdAt : Date.now(),
    updatedAt: typeof project.updatedAt === 'number' ? project.updatedAt : Date.now(),
  };
}

function readLibrary(): LibraryState {
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

function createFont(entry: FontKnowledge, now = Date.now()): FontEntry {
  return { ...entry, id: makeId(), favorite: false, createdAt: now, updatedAt: now };
}

function categoryMatches(left: string, right: string) {
  return keyFor(left).replace(/\s+fonts?$/, '') === keyFor(right).replace(/\s+fonts?$/, '');
}

function isHighlyDecorative(font: FontEntry) {
  return [...font.categories, ...font.tags].some((label) =>
    ['decorative', 'script', 'handwritten', 'calligraphy', 'ornate'].some((term) => keyFor(label).includes(term)),
  );
}

function getFontTrait(font: FontEntry, terms: string[]) {
  const text = keyFor([
    font.name,
    ...font.categories,
    ...font.roles,
    ...font.tags,
  ].join(' '));
  return terms.find((term) => text.includes(term)) ?? '';
}

function getFontTraits(font: FontEntry) {
  const family = getFontTrait(font, ['handwritten', 'script', 'sans serif', 'sans-serif', 'sans', 'serif']);
  const weight = getFontTrait(font, ['extra bold', 'extrabold', 'black', 'heavy', 'bold', 'light', 'thin']);
  const structure = getFontTrait(font, ['display', 'minimal', 'clean', 'readable']);
  const personality = getFontTrait(font, ['decorative', 'playful', 'elegant', 'editorial', 'cinematic', 'modern']);
  const shape = getFontTrait(font, ['condensed', 'tall', 'expanded', 'italic']);
  return [family, weight, structure, personality, shape];
}

function getPairContrastScore(left: FontEntry, right: FontEntry) {
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

function getMixSignature(mix: Recommendation[]) {
  return mix.map((item) => item.font.id).sort().join('|');
}

function generateFontMix(
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

function explainMixRole(recommendation: Recommendation, mix: Recommendation[]) {
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

function FontChips({ values, empty = 'No categories yet' }: { values: string[]; empty?: string }) {
  return values.length
    ? <div className="flex flex-wrap gap-1.5">{values.map((value) => <span key={value} className="rounded-md border border-[#354156] bg-[#192233] px-2 py-1 text-[10px] font-medium text-[#d5deec]">{value}</span>)}</div>
    : <span className="text-[11px] text-[#93a1b5]">{empty}</span>;
}

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
        combinationId: '', notes: '', favorite: false, createdAt: Date.now(), updatedAt: Date.now(),
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
      favorite: false, createdAt: Date.now(), updatedAt: Date.now(),
    };
    setLibrary((current) => ({ ...current, projects: [item, ...current.projects], recent: [...new Set([...ids, ...current.recent])].slice(0, 20) }));
    setSection('projects');
    setRecommendations(null);
    setNotice(`Video typography mix "${name}" saved to Projects.`);
  };

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

  const renderFontCard = (font: FontEntry) => (
    <article key={font.id} className="overflow-hidden rounded-2xl border border-[#303c50] bg-[#121925] shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:border-violet-300/50">
      <div className="border-b border-[#303c50] bg-gradient-to-br from-[#202b3e] to-[#131b29] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">Font record</p>
            <input aria-label="Font name" value={font.name} onChange={(event) => persistFontUpdate(font.id, { name: event.target.value })} className="mt-2 w-full break-words bg-transparent text-xl font-bold tracking-tight text-white outline-none focus:ring-1 focus:ring-violet-300/50" />
          </div>
          <button type="button" onClick={() => toggleFontFavorite(font)} aria-label={`${font.favorite ? 'Unfavorite' : 'Favorite'} ${font.name}`} className={`rounded-xl border p-2.5 ${font.favorite ? 'border-rose-300/30 bg-rose-300/10 text-rose-300' : 'border-[#455168] text-[#aab7ca] hover:text-rose-300'}`}>
            <Heart className="h-4 w-4" fill={font.favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-[#e3e9f3]">Aa <span className="text-base font-normal text-[#b8c4d5]">SAMPLE TYPE</span></p>
        <p className="mt-2 text-[10px] text-[#b8c4d5]">Metadata preview · actual font file not required</p>
      </div>
      <div className="space-y-4 p-4">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-200">Roles
          <input list="font-role-options" value={font.roles.join(', ')} onChange={(event) => persistFontUpdate(font.id, { roles: [...new Set(event.target.value.split(',').map(normalize).filter(Boolean))] })} placeholder="Primary, Hook, Supporting, Accent..." className="mt-2 w-full rounded-lg border border-violet-300/25 bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
        </label>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#adbbce]">Categories</p>
          <FontChips values={font.categories} />
          <select
            aria-label={`Add category to ${font.name}`}
            value=""
            onChange={(event) => {
              const category = event.target.value;
              if (category && !font.categories.includes(category)) persistFontUpdate(font.id, { categories: [...font.categories, category] });
            }}
            className="mt-2 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2 text-xs text-white outline-none focus:border-violet-300/60"
          >
            <option value="">+ Add a category</option>
            {library.categories.filter((category) => !font.categories.includes(category)).map((category) => <option key={category}>{category}</option>)}
          </select>
          {font.categories.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{font.categories.map((category) => <button key={category} type="button" title={`Remove ${category}`} onClick={() => persistFontUpdate(font.id, { categories: font.categories.filter((item) => item !== category) })} className="rounded-md bg-[#1b2636] px-2 py-1 text-[10px] text-[#d0d9e6] hover:bg-rose-400/15 hover:text-rose-200">{category} ×</button>)}</div>}
        </div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#adbbce]">Tags
          <input value={font.tags.join(', ')} onChange={(event) => persistFontUpdate(font.id, { tags: [...new Set(event.target.value.split(',').map(normalize).filter(Boolean))] })} placeholder="Bold, Editorial, Reels" className="mt-2 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
        </label>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#adbbce]">Description
          <input value={font.description} onChange={(event) => persistFontUpdate(font.id, { description: event.target.value })} placeholder="What makes this font useful?" className="mt-2 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
        </label>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#adbbce]">Personal notes
          <textarea value={font.notes} onChange={(event) => persistFontUpdate(font.id, { notes: event.target.value })} rows={2} placeholder="Use for large cinematic titles..." className="mt-2 w-full resize-y rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8391a5] focus:border-violet-300/60" />
        </label>
        <div className="flex items-center justify-between border-t border-[#303c50] pt-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCompareIds((current) => current.includes(font.id) ? current.filter((id) => id !== font.id) : current.length < 4 ? [...current, font.id] : current)} className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${compareIds.includes(font.id) ? 'border-violet-300/50 bg-violet-300/10 text-violet-100' : 'border-[#46536a] text-[#c3cede] hover:border-violet-300/30'}`}>{compareIds.includes(font.id) ? '✓ Comparing' : 'Compare'}</button>
            {library.projects.length > 0 && <select aria-label={`Add ${font.name} to project`} value="" onChange={(event) => {
              const project = library.projects.find((item) => item.id === event.target.value);
              if (!project) return;
              const nextFontIds = [...project.fontIds];
              if (!nextFontIds.includes(font.id) && nextFontIds.filter(Boolean).length < 4) nextFontIds.push(font.id);
              updateProject(project.id, { fontIds: nextFontIds });
              markUsed([font.id]);
              setNotice(`Added ${font.name} to ${project.name}.`);
            }} className="max-w-32 rounded-lg border border-[#46536a] bg-[#0b111b] px-2 py-2 text-[10px] text-white">
              <option value="">Add to project</option>{library.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>}
          </div>
          <button type="button" onClick={() => deleteFont(font.id)} aria-label={`Delete ${font.name}`} className="rounded-lg p-2 text-[#96a4b8] hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </article>
  );

  const renderCombinationCard = (combo: CombinationEntry) => (
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

          {section === 'dashboard' && <div className="space-y-5">
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
          </div>}

          {section === 'import' && <div className="space-y-5">
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
          </div>}

          {(section === 'fonts' || section === 'favorites' || section === 'categories') && <>
            {compareIds.length > 0 && <section className="mb-5 rounded-2xl border border-violet-300/25 bg-[#151a27] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-white">Compare font knowledge <span className="text-xs font-normal text-[#bdc8d8]">· {compareIds.length}/4</span></h2><button type="button" onClick={() => setCompareIds([])} className="text-xs font-semibold text-[#bcc8d8] hover:text-white">Clear</button></div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{compareIds.map((id) => {
                const font = fontsById.get(id); if (!font) return null;
                return <article key={id} className="rounded-xl border border-[#354156] bg-[#0d131d] p-3"><div className="flex justify-between"><h3 className="text-sm font-bold text-white">{font.name}</h3><button type="button" onClick={() => setCompareIds((current) => current.filter((item) => item !== id))} aria-label={`Remove ${font.name} from comparison`} className="text-[#a6b3c6] hover:text-white"><X className="h-3.5 w-3.5" /></button></div><div className="mt-3"><FontChips values={font.roles} empty="No roles assigned" /></div><div className="mt-2"><FontChips values={font.categories} /></div><div className="mt-2"><FontChips values={font.tags} empty="No tags" /></div><p className="mt-3 text-xs leading-5 text-[#d0d9e5]">{font.description || font.notes || 'No notes yet.'}</p></article>;
              })}</div>
            </section>}
            {section === 'categories' && <div className="mb-4 flex flex-wrap gap-2">{library.categories.map((category) => <button key={category} type="button" onClick={() => setQuery(query === category ? '' : category)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${query === category ? 'border-violet-200 bg-violet-300/15 text-white' : 'border-[#3c495e] bg-[#151d29] text-[#e0e7f1] hover:border-violet-300/40'}`}>{category} <span className="ml-1 text-[#bac6d5]">{library.fonts.filter((font) => font.categories.some((item) => categoryMatches(item, category))).length}</span></button>)}</div>}
              {section === 'fonts' && search && filteredCombinations.length > 0 && <section className="mb-5 rounded-2xl border border-[#303c50] bg-[#111722] p-4"><h2 className="mb-3 text-sm font-bold text-white">Matching combinations</h2><div className="grid gap-3 xl:grid-cols-2">{filteredCombinations.map(renderCombinationCard)}</div></section>}
              {filteredFonts.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredFonts.map(renderFontCard)}</div> : <div className="rounded-2xl border border-dashed border-[#49566b] bg-[#111722] px-5 py-12 text-center"><Library className="mx-auto h-7 w-7 text-[#b2bfd0]" /><p className="mt-3 text-sm font-bold text-white">{section === 'favorites' ? 'No favorite fonts yet' : query ? 'No fonts match this search' : 'No font knowledge added yet'}</p><p className="mt-1 text-xs text-[#bdc8d8]">Add your own font names to organize and get recommendations.</p><button type="button" onClick={() => setSection('import')} className="mt-4 rounded-lg bg-violet-300 px-3.5 py-2 text-xs font-bold text-[#171222]">Add Fonts</button></div>}
          </>}

          {section === 'categories' && <section className="mt-5 rounded-2xl border border-[#303c50] bg-[#111722] p-4"><h2 className="text-sm font-bold text-white">Manage categories</h2><form onSubmit={(event) => { event.preventDefault(); addCategory(); }} className="mt-3 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Create a category, e.g. YouTube Fonts" className="min-w-0 flex-1 rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8795aa]" /><button className="inline-flex items-center gap-1.5 rounded-lg bg-[#253147] px-3 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add</button></form><div className="mt-3 flex flex-wrap gap-2">{library.categories.map((category) => <span key={category} className="inline-flex items-center gap-2 rounded-lg border border-[#3a465b] bg-[#192233] px-2.5 py-1.5 text-[10px] text-white">{category}<button type="button" aria-label={`Delete category ${category}`} onClick={() => deleteCategory(category)} className="text-[#a4b1c4] hover:text-rose-300"><X className="h-3 w-3" /></button></span>)}</div></section>}

          {section === 'combinations' && <div className="space-y-4">
            <form onSubmit={(event) => { event.preventDefault(); addCombination(); }} className="flex gap-2 rounded-2xl border border-[#303c50] bg-[#111722] p-4"><input value={newCombination} onChange={(event) => setNewCombination(event.target.value)} placeholder="Combination name, e.g. Cinematic 3Mix" className="min-w-0 flex-1 rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8795aa]" /><button className="inline-flex items-center gap-1.5 rounded-lg bg-violet-300 px-3.5 text-xs font-bold text-[#171222]"><Plus className="h-3.5 w-3.5" />Create</button></form>
            <label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a4b1c4]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search combinations and font names..." className="w-full rounded-xl border border-[#354156] bg-[#111722] py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#8d9cb1]" /></label>
            {filteredCombinations.length ? <div className="grid gap-4 xl:grid-cols-2">{filteredCombinations.map(renderCombinationCard)}</div> : <p className="rounded-2xl border border-dashed border-[#49566b] bg-[#111722] p-8 text-center text-xs text-[#bdc8d8]">No combinations saved yet. Create one or detect combinations from pasted notes.</p>}
          </div>}

          {section === 'find' && <div className="space-y-4">
            <section className="rounded-2xl border border-violet-300/30 bg-gradient-to-br from-[#171728] to-[#111722] p-4 sm:p-6">
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Font mix generator for videos</p>
                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Create a Font Mix</h2>
                <p className="mt-2 text-sm leading-6 text-[#c7d1df]">Choose a video preset. Each mix pairs a main font with readable support and a contrasting accent from your own library.</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#bec9d8]">What are you making?
                  <select value={findStyle} onChange={(event) => {
                    const preset = VIDEO_PRESETS.find((item) => item.id === event.target.value) ?? VIDEO_PRESETS[0];
                    setFindStyle(preset.id);
                    setRecommendations(null);
                  }} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none">
                    {VIDEO_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#bec9d8]">Video / project name <span className="font-normal normal-case tracking-normal text-[#8997ab]">· optional</span>
                  <input value={findProject} onChange={(event) => setFindProject(event.target.value)} placeholder="e.g. Launch teaser" className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-3 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8795aa]" />
                </label>
                <label className="rounded-xl border border-[#354156] bg-[#0c111a]/80 p-3 sm:col-span-2">
                  <span className="flex items-center justify-between text-xs font-bold text-white"><span>Mix structure</span><span className="text-violet-200">3 fonts · Main + Support + Accent</span></span>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
                    {['Main', 'Support', 'Accent'].map((role) => <span key={role} className="rounded-lg border border-[#354156] bg-[#151e2c] px-2 py-2 text-[#d8dff0]">{role}</span>)}
                  </div>
                </label>
              </div>
              <div className="mt-4 rounded-xl border border-[#303c50] bg-[#0c111a]/80 p-3.5">
                <p className="text-xs font-bold text-white">{activePreset.label} rules · {activePreset.minFonts} fonts</p>
                <p className="mt-1 text-xs leading-5 text-[#bdc8d8]">{activePreset.summary}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{activePreset.roles.slice(0, selectedMixCount).map((role) => <div key={role.id} className="rounded-lg border border-[#354156] bg-[#141d2a] p-2.5"><p className="text-[10px] font-bold uppercase tracking-wide text-violet-200">{role.label}</p><p className="mt-1 text-[10px] leading-4 text-[#c3cedc]">{role.description}</p></div>)}</div>
              </div>
              <button type="button" onClick={findFonts} disabled={library.fonts.length === 0} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-300 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-[#171222] shadow-lg shadow-violet-950/20 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="h-4 w-4" />Create Mix</button>
            </section>
            {recommendations && <section className="rounded-2xl border border-violet-300/30 bg-[#121722] p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">Your Mix</p><h2 className="mt-1 text-base font-bold text-white">{findProject.trim() || activePreset.label}</h2><p className="mt-1 text-xs text-[#bdc8d8]">{recommendations.length} of up to {activePreset.maxFonts} fonts · {activePreset.label} · selected from your library</p></div><div className="flex flex-wrap gap-2">{recommendations.length > 0 && <><button type="button" onClick={shuffleFontMix} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#46536a] bg-[#192334] px-3.5 py-2 text-xs font-bold text-white"><Shuffle className="h-4 w-4" />Shuffle Mix</button><button type="button" disabled={!requiredMixComplete} onClick={saveRecommendation} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-300 px-3.5 py-2 text-xs font-bold text-[#171222] disabled:cursor-not-allowed disabled:opacity-40"><Heart className="h-4 w-4" />Save Mix</button></>}</div></div>
              {recommendations.length === 3 ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{recommendations.map((item) =>
                <article key={`${item.roleId}-${item.font.id}`} className="rounded-xl border border-[#354156] bg-[#0c121b] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">{item.role}</p><h3 className="mt-2 text-lg font-bold text-white">{item.font.name}</h3></div>
                    <div className="flex gap-1.5">
                      <button type="button" disabled={lockedRoles[item.roleId] === item.font.id} onClick={() => rerollRole(item.roleId)} aria-label={`Re-roll ${item.role}`} title={`Re-roll ${item.role} only`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#46536a] px-2.5 py-2 text-[10px] font-semibold text-[#c3cede] hover:border-violet-300/30 disabled:cursor-not-allowed disabled:opacity-45"><RotateCw className="h-3.5 w-3.5" />Re-roll</button>
                      <button type="button" aria-pressed={lockedRoles[item.roleId] === item.font.id} aria-label={`${lockedRoles[item.roleId] === item.font.id ? 'Unlock' : 'Lock'} ${item.font.name} in the ${item.role} role`} onClick={() => setLockedRoles((current) => {
                        const next = { ...current };
                        if (next[item.roleId] === item.font.id) delete next[item.roleId];
                        else next[item.roleId] = item.font.id;
                        return next;
                      })} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-semibold ${lockedRoles[item.roleId] === item.font.id ? 'border-violet-200/50 bg-violet-300/15 text-violet-100' : 'border-[#46536a] text-[#c3cede] hover:border-violet-300/30'}`}>
                        {lockedRoles[item.roleId] === item.font.id ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}{lockedRoles[item.roleId] === item.font.id ? 'Locked' : 'Lock'}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#bdc8d8]">{item.roleDescription}</p>
                  <p className="mt-2 text-xs leading-5 text-[#e0d7ff]"><span className="font-semibold">Why this role:</span> {explainMixRole(item, recommendations)}</p>
                  <div className="mt-3"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#c2cede]">Matched your classifications</p><FontChips values={item.matchedLabels} /></div>
                </article>
              )}</div> : <p className="mt-4 rounded-lg border border-amber-200/20 bg-amber-200/[0.08] p-3 text-xs leading-5 text-amber-100">This preset needs matching library fonts for its main, supporting, and accent roles. Assign those roles or add suitable categories and tags in My Fonts.</p>}
              {recommendations.length > 0 && <div className="mt-4 rounded-xl border border-[#354156] bg-[#0c111a] p-4">
                <h3 className="text-xs font-bold text-white">Why this mix?</h3>
                <p className="mt-2 text-xs leading-5 text-[#cbd5e2]">The mix separates the visual jobs: a lead font establishes hierarchy, a supporting font improves readability, and an accent adds a controlled point of personality. Classification matches remain listed with each font.</p>
                <p className="mt-2 text-[10px] text-[#929fb2]">This explanation is generated from your saved classifications and preset rules. No AI is used.</p>
              </div>}
              {recommendations.length > 0 && !requiredMixComplete && <p className="mt-4 rounded-lg border border-amber-200/20 bg-amber-200/[0.08] p-3 text-xs leading-5 text-amber-100">This mix is incomplete and cannot be saved yet. It must contain three unique library fonts for the main, supporting, and accent roles.</p>}
            </section>}
          </div>}

          {section === 'projects' && <div className="space-y-4">
            <form onSubmit={(event) => { event.preventDefault(); createProject(); }} className="rounded-2xl border border-[#303c50] bg-[#111722] p-4">
              <h2 className="text-sm font-bold text-white">Create Project Font Set</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1.1fr_1fr_1.5fr_auto]">
                <input value={newProject} onChange={(event) => setNewProject(event.target.value)} placeholder="Project name" className="rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8795aa]" />
                <select value={projectStyle} onChange={(event) => setProjectStyle(event.target.value)} className="rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white"><option value="">Style</option>{[...STYLE_OPTIONS, ...VIDEO_PRESETS.map((preset) => preset.label)].map((item) => <option key={item}>{item}</option>)}</select>
                <input value={projectPurpose} onChange={(event) => setProjectPurpose(event.target.value)} placeholder="Purpose, e.g. Reels + captions" className="rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8795aa]" />
                <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-300 px-3 py-2.5 text-xs font-bold text-[#171222]"><Plus className="h-4 w-4" />Create</button>
              </div>
            </form>
            {library.projects.length ? <div className="grid gap-4 xl:grid-cols-2">{library.projects.map((project) => {
              const pickedFonts = project.fontIds.map((id) => fontsById.get(id)).filter((font): font is FontEntry => Boolean(font));
              return <article key={project.id} className="rounded-2xl border border-[#303c50] bg-[#111722] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3"><div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2"><input value={project.name} aria-label="Project Font Set name" onChange={(event) => updateProject(project.id, { name: event.target.value })} className="w-full bg-transparent text-base font-bold text-white outline-none" /><select aria-label="Project style" value={project.style} onChange={(event) => updateProject(project.id, { style: event.target.value })} className="rounded-lg border border-[#354156] bg-[#0b111b] px-2 py-2 text-[10px] text-white"><option value="">Choose style</option>{[...STYLE_OPTIONS, ...VIDEO_PRESETS.map((preset) => preset.label)].map((style) => <option key={style}>{style}</option>)}</select><input value={project.purpose} aria-label="Project purpose" onChange={(event) => updateProject(project.id, { purpose: event.target.value })} placeholder="Headings, captions, thumbnails..." className="rounded-lg border border-[#354156] bg-[#0b111b] px-2 py-2 text-[10px] text-white outline-none placeholder:text-[#8795aa] sm:col-span-2" /></div><button type="button" onClick={() => updateProject(project.id, { favorite: !project.favorite })} aria-label={`${project.favorite ? 'Unfavorite' : 'Favorite'} project set`} className={project.favorite ? 'text-amber-300' : 'text-[#a8b5c8] hover:text-amber-300'}><Star className="h-4 w-4" fill={project.favorite ? 'currentColor' : 'none'} /></button><button type="button" onClick={() => setLibrary((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== project.id) }))} aria-label={`Delete project ${project.name}`} className="text-[#9eacc0] hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{ROLE_DETAILS.map((role, index) => {
                  const currentId = project.fontIds[index] ?? '';
                  return <label key={role.id} className="block text-[10px] font-bold text-[#c0cada]">{project.fontRoles[index] || role.label}<span className="ml-1 font-normal text-[#9eacc0]">· {role.description}</span>
                    <select value={currentId} onChange={(event) => {
                      const next = [...project.fontIds];
                      next[index] = event.target.value;
                      updateProject(project.id, next.some(Boolean) ? { fontIds: next } : { fontIds: [] });
                      if (event.target.value) markUsed([event.target.value]);
                    }} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal text-white"><option value="">Choose from My Fonts</option>{library.fonts.map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select>
                  </label>;
                })}</div>
                {pickedFonts.length > 2 && <p className="mt-3 rounded-lg border border-amber-200/20 bg-amber-200/[0.08] p-3 text-xs leading-5 text-amber-100">You’re using {pickedFonts.length} fonts in this project. For a more consistent visual identity, consider using 1–2 fonts. This is only a recommendation.</p>}
                {library.combinations.length > 0 && <label className="mt-3 block text-[10px] font-bold text-[#c0cada]">Saved combination
                  <select value={project.combinationId} onChange={(event) => {
                    const combo = library.combinations.find((item) => item.id === event.target.value);
                    if (!combo) { updateProject(project.id, { combinationId: '' }); return; }
                    const matched = combo.fontNames.map((name) => fontsByName.get(keyFor(name))?.id).filter((id): id is string => Boolean(id));
                    updateProject(project.id, { combinationId: combo.id, fontIds: matched.slice(0, 4) });
                  }} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal text-white"><option value="">None</option>{library.combinations.map((combo) => <option key={combo.id} value={combo.id}>{combo.name}</option>)}</select>
                </label>}
                <label className="mt-3 block text-[10px] font-bold text-[#c0cada]">Notes<textarea value={project.notes} onChange={(event) => updateProject(project.id, { notes: event.target.value })} rows={2} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal text-white outline-none" /></label>
                <div className="mt-3 flex flex-wrap gap-1.5">{pickedFonts.map((font, index) => <span key={font.id} className="rounded-md bg-[#202b3b] px-2 py-1 text-[10px] text-white">{project.fontRoles[index] || ROLE_DETAILS[index]?.label}: {font.name}</span>)}</div>
              </article>;
            })}</div> : <div className="rounded-2xl border border-dashed border-[#49566b] bg-[#111722] p-8 text-center"><FolderKanban className="mx-auto h-7 w-7 text-[#b2bfd0]" /><p className="mt-3 text-sm font-bold text-white">No project mixes yet</p><p className="mt-1 text-xs text-[#bdc8d8]">Create one here or build and save a video-specific mix from Create Font Mix.</p></div>}
          </div>}

          {section === 'favorites' && <div className="space-y-6">
            <section><h2 className="mb-3 text-sm font-bold text-white">Favorite Fonts</h2>{filteredFonts.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredFonts.map(renderFontCard)}</div> : <p className="rounded-xl border border-[#303c50] bg-[#111722] p-5 text-xs text-[#c0cada]">No favorite fonts yet.</p>}</section>
            <section><h2 className="mb-3 text-sm font-bold text-white">Favorite Combinations</h2>{library.combinations.filter((item) => item.favorite).length ? <div className="grid gap-4 xl:grid-cols-2">{library.combinations.filter((item) => item.favorite).map(renderCombinationCard)}</div> : <p className="rounded-xl border border-[#303c50] bg-[#111722] p-5 text-xs text-[#c0cada]">No favorite combinations yet.</p>}</section>
            <section><h2 className="mb-3 text-sm font-bold text-white">Favorite Project Sets</h2>{library.projects.filter((item) => item.favorite).length ? <div className="grid gap-3 sm:grid-cols-2">{library.projects.filter((item) => item.favorite).map((item) => <button key={item.id} type="button" onClick={() => setSection('projects')} className="rounded-xl border border-[#303c50] bg-[#111722] p-4 text-left"><p className="text-sm font-bold text-white">{item.name}</p><p className="mt-1 text-xs text-[#bdc8d8]">{item.fontIds.map((id) => fontsById.get(id)?.name).filter(Boolean).join(' · ')}</p></button>)}</div> : <p className="rounded-xl border border-[#303c50] bg-[#111722] p-5 text-xs text-[#c0cada]">No favorite project sets yet.</p>}</section>
          </div>}

          {section === 'settings' && <div className="max-w-2xl space-y-4">
            <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-5"><div className="flex items-center gap-3"><ArrowDownToLine className="h-5 w-5 text-violet-200" /><div><h2 className="text-sm font-bold text-white">Export Font Knowledge</h2><p className="mt-1 text-xs text-[#bdc8d8]">Save your font records, categories, combinations, project sets, favorites, and notes.</p></div></div><button type="button" onClick={exportLibrary} className="mt-4 rounded-lg border border-[#46536a] bg-[#192334] px-3.5 py-2 text-xs font-bold text-white hover:border-violet-300/40">Export library JSON</button></section>
            <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-5"><div className="flex items-center gap-3"><ArrowUpFromLine className="h-5 w-5 text-violet-200" /><div><h2 className="text-sm font-bold text-white">Import Font Knowledge</h2><p className="mt-1 text-xs text-[#bdc8d8]">Restore a previously exported JSON library.</p></div></div><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#46536a] bg-[#192334] px-3.5 py-2 text-xs font-bold text-white hover:border-violet-300/40">Choose library JSON<input type="file" accept=".json,application/json" onChange={(event) => void importLibrary(event)} className="sr-only" /></label></section>
            <section className="rounded-2xl border border-[#303c50] bg-[#111722] p-5"><h2 className="text-sm font-bold text-white">Local storage</h2><p className="mt-2 text-xs leading-5 text-[#bdc8d8]">{library.fonts.length} font records · {library.categories.length} categories · {library.combinations.length} combinations · {library.projects.length} project sets. Your information is stored in this browser. Only names and metadata are saved; font files are not imported or uploaded.</p></section>
          </div>}

          {section === 'how-it-works' && <div className="max-w-3xl space-y-4">
            <section className="rounded-2xl border border-violet-300/25 bg-gradient-to-br from-[#171728] to-[#111722] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">Your library powers every recommendation</p>
              <h2 className="mt-2 text-lg font-bold text-white">How Font Selector works</h2>
              <p className="mt-2 text-xs leading-5 text-[#c7d1df]">Font Selector uses your font names and the classifications you provide to build reusable typography mixes for video. It does not fetch fonts, upload your data, or use AI to generate recommendations.</p>
            </section>
            {[
              { title: '1. Add your font names', body: 'Use Add Fonts to paste a simple list or use Organized Import for structured font records and combinations. The organized-import parser runs locally in your browser.' },
              { title: '2. Classify your library', body: 'Assign roles such as Primary, Hook, Supporting, or Accent. Add categories and tags that describe each font. These labels tell the generator what each font is suited for.' },
              { title: '3. Choose a video preset', body: 'Open Create Font Mix, choose a format such as Cinematic Reel, Talking Head Reel, Luxury, Fast / Viral Reel, or Podcast, then select how many fonts you want in the mix.' },
              { title: '4. Generate and refine', body: 'The deterministic matching rules select only fonts in your library whose roles or classifications fit the chosen preset. Shuffle for another valid mix, lock fonts you want to keep, or re-roll a single role.' },
              { title: '5. Save and reuse', body: 'Save a complete mix as a project set, organize combinations, and use Favorites to keep useful choices close at hand. Your library changes are saved in this browser and remain after refresh.' },
              { title: '6. Back up when needed', body: 'Open Settings to export your font knowledge as JSON. Import that file later to restore your fonts, categories, combinations, and project sets on this or another browser.' },
            ].map((step) => <section key={step.title} className="rounded-xl border border-[#303c50] bg-[#111722] p-4"><h3 className="text-sm font-bold text-white">{step.title}</h3><p className="mt-1.5 text-xs leading-5 text-[#bdc8d8]">{step.body}</p></section>)}
          </div>}
        </section>
      </div>
    </main>
  );
}
