import { Palette, PaletteColor, FilterState } from '../types';
import {
  buildPaletteColor,
  getColorTemperature,
  getContrastRatio,
  hslToRgb,
  rgbToHex,
  rgbToHsl,
  hexToRgb,
  simulateColorBlindness,
} from '../utils/colorUtils';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces',
];

const CREATORS = [
  'Elena Rostova', 'Marcus Vance', 'Sora Takahashi', 'Devon Miles',
  'Amara Lopez', 'Julian Sterling', 'Nikos Katsaros', 'Chloe Dupont',
  'Arjun Mehta', 'Amber Hollister', 'Freja Lindqvist', 'Leo Rossi',
  'Yuki Morita', 'Matteo Colombo', 'Bella Thorne', 'Henrik Vanger',
  'Zane Archer', 'Lina Gropius', 'Dimitri Costa', 'Claire Beaumont',
];

const WHITE_SHADES = [
  '#FFFFFF', '#FAFAFA', '#F8F9FA', '#FDFBF7', '#F4F5F7', '#F5F5F0',
  '#F1F5F9', '#F9FAFB', '#F8FAFC', '#FEFEFE', '#FAF8F5', '#F5F7FA'
];

const BLACK_SHADES = [
  '#000000', '#0A0A0A', '#111827', '#0F172A', '#18181B', '#121212',
  '#09090B', '#141414', '#1A1A1A', '#0D1117'
];

const GRAY_SHADES = [
  '#64748B', '#94A3B8', '#CBD5E1', '#71717A', '#A1A1AA', '#6B7280',
  '#9CA3AF', '#868E96', '#ADB5BD', '#CED4DA'
];

const COLOR_HUE_RANGES: Record<string, [number, number]> = {
  Red: [345, 15],
  Orange: [16, 45],
  Brown: [20, 45],
  Yellow: [46, 70],
  Green: [71, 155],
  Turquoise: [156, 185],
  Blue: [186, 255],
  Violet: [256, 300],
  Pink: [301, 344],
};

const NAME_PREFIXES = [
  'Velvet', 'Nordic', 'Solar', 'Midnight', 'Ethereal', 'Ceramic', 'Alpine',
  'Tuscan', 'Kyoto', 'Riviera', 'Oceanic', 'Cyber', 'Heirloom', 'Glacier',
  'Golden', 'Muted', 'Vintage', 'Artisan', 'Botanical', 'Neon', 'Terracotta',
  'Obsidian', 'Prism', 'Chalk', 'Saffron', 'Bioluminescent', 'Emerald', 'Blush'
];

const NAME_SUFFIXES = [
  'Glow', 'Horizon', 'Breeze', 'Mist', 'Hearth', 'Dusk', 'Dawn', 'Shadow',
  'Canopy', 'Drift', 'Studio', 'Sanctuary', 'Palette', 'Tones', 'Spectrum',
  'Aura', 'Echo', 'Tide', 'Lumina', 'Essence', 'Atmosphere', 'Contrast', 'Harmony'
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Check if a hex color belongs to a category
export function colorBelongsToCategory(hex: string, category: string): boolean {
  const cat = category.toLowerCase();
  const hexUp = hex.toUpperCase();

  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  if (cat === 'white') {
    return (
      hexUp === '#FFFFFF' ||
      WHITE_SHADES.includes(hexUp) ||
      l >= 84 ||
      (l >= 80 && s <= 30)
    );
  }

  if (cat === 'black') {
    return (
      hexUp === '#000000' ||
      BLACK_SHADES.includes(hexUp) ||
      l <= 16
    );
  }

  if (cat === 'gray') {
    return (s <= 18 && l >= 17 && l <= 83) || GRAY_SHADES.includes(hexUp);
  }

  if (s < 14) return false;

  if (cat === 'red') return h >= 345 || h <= 15;
  if (cat === 'orange') return h > 15 && h <= 45 && l >= 45;
  if (cat === 'brown') return (h >= 15 && h <= 50) && l < 45;
  if (cat === 'yellow') return h > 45 && h <= 70;
  if (cat === 'green') return h > 70 && h <= 155;
  if (cat === 'turquoise') return h > 155 && h <= 185;
  if (cat === 'blue') return h > 185 && h <= 255;
  if (cat === 'violet') return h > 255 && h <= 300;
  if (cat === 'pink') return h > 300 && h < 345;

  return false;
}

// Generate a specific single procedural palette deterministically by index and context
export function generateProceduralPaletteByIndex(
  index: number,
  filterContext?: {
    requiredColor?: string;
    requiredStyle?: string;
    requiredTopic?: string;
    requiredColorCount?: number | null;
  }
): Palette {
  const seed = (index + 1) * 31.4159;
  const r1 = pseudoRandom(seed * 1);
  const r3 = pseudoRandom(seed * 3);
  const r4 = pseudoRandom(seed * 4);
  const r5 = pseudoRandom(seed * 5);

  let colorCount = 5;
  if (filterContext?.requiredColorCount) {
    colorCount = filterContext.requiredColorCount;
  } else if (filterContext?.requiredStyle && filterContext.requiredStyle.includes('Colors')) {
    colorCount = parseInt(filterContext.requiredStyle, 10);
  } else {
    if (r1 < 0.08) colorCount = 3;
    else if (r1 < 0.22) colorCount = 4;
    else if (r1 < 0.70) colorCount = 5;
    else if (r1 < 0.85) colorCount = 6;
    else if (r1 < 0.94) colorCount = 7;
    else colorCount = 8;
  }

  let baseHue = Math.floor(r3 * 360);
  let baseSat = Math.floor(30 + r4 * 60);
  let baseLit = Math.floor(25 + r5 * 55);

  const colorsHex: string[] = [];

  if (filterContext?.requiredColor) {
    const rc = filterContext.requiredColor;
    if (rc === 'White') {
      colorsHex.push(WHITE_SHADES[Math.floor(pseudoRandom(seed * 9) * WHITE_SHADES.length)]);
    } else if (rc === 'Black') {
      colorsHex.push(BLACK_SHADES[Math.floor(pseudoRandom(seed * 9) * BLACK_SHADES.length)]);
    } else if (rc === 'Gray') {
      colorsHex.push(GRAY_SHADES[Math.floor(pseudoRandom(seed * 9) * GRAY_SHADES.length)]);
    } else if (COLOR_HUE_RANGES[rc]) {
      const [minH, maxH] = COLOR_HUE_RANGES[rc];
      const targetH = minH > maxH ? (r3 > 0.5 ? minH + r4 * (360 - minH) : r4 * maxH) : minH + r4 * (maxH - minH);
      const rgb = hslToRgb(targetH, 65, rc === 'Brown' ? 32 : 50);
      colorsHex.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  }

  while (colorsHex.length < colorCount) {
    const c = colorsHex.length;
    const step = c / (colorCount - 1 || 1);
    const h = (baseHue + c * 48 + 360) % 360;
    const lit = Math.max(15, Math.min(88, Math.round(18 + step * 68)));
    const sat = Math.max(20, Math.min(92, Math.round(baseSat + (c % 2 === 0 ? 10 : -10))));
    const rgb = hslToRgb(h, sat, lit);
    colorsHex.push(rgbToHex(rgb.r, rgb.g, rgb.b));
  }

  const prefix = NAME_PREFIXES[Math.floor(pseudoRandom(seed * 7) * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(pseudoRandom(seed * 8) * NAME_SUFFIXES.length)];
  const name = filterContext?.requiredColor
    ? `${filterContext.requiredColor} ${suffix}`
    : `${prefix} ${suffix}`;

  const styles: string[] = [`${colorCount} Colors`];
  if (baseSat < 45) styles.push('Pastel');
  if (baseSat > 70) styles.push('Bright');
  if (baseLit < 35) styles.push('Dark');
  if (baseHue <= 75 || baseHue >= 315) styles.push('Warm');
  else styles.push('Cold');

  if (filterContext?.requiredStyle && !styles.includes(filterContext.requiredStyle)) {
    styles.push(filterContext.requiredStyle);
  }

  const topicName = filterContext?.requiredTopic || 'Design';
  const topics = [topicName];

  const tags = Array.from(new Set([...styles, ...topics, prefix]));
  const creator = CREATORS[Math.floor(pseudoRandom(seed * 11) * CREATORS.length)];
  const avatar = AVATARS[Math.floor(pseudoRandom(seed * 12) * AVATARS.length)];
  const likes = Math.floor(400 + pseudoRandom(seed * 13) * 16000);
  const views = Math.floor(likes * (2.5 + pseudoRandom(seed * 14) * 4));

  return {
    id: `pal-p-${index + 1}`,
    name,
    colors: colorsHex.map((hex) => buildPaletteColor(hex)),
    tags,
    styles,
    topics,
    creator: {
      id: `user-${(index % CREATORS.length) + 1}`,
      name: creator,
      avatar,
    },
    likes,
    views,
    createdAt: new Date(Date.now() - (index * 1800000)).toISOString(),
    isPublic: true,
    isFavorite: false,
  };
}

export function getPalettesForFilter(
  filterState: FilterState,
  offset: number,
  limit: number
): { palettes: Palette[]; totalCount: number } {
  const targetFilterColor = filterState.selectedColors[0];
  const targetFilterStyle = filterState.selectedStyles[0];
  const targetFilterTopic = filterState.selectedTopics[0];

  let totalCount = 10000000;
  if (targetFilterColor && targetFilterStyle && targetFilterTopic) {
    totalCount = 684200;
  } else if ((targetFilterColor && targetFilterStyle) || (targetFilterColor && targetFilterTopic)) {
    totalCount = 745800;
  } else if (targetFilterColor || targetFilterStyle || targetFilterTopic) {
    totalCount = 833330;
  }

  const advanced = filterState.advanced;
  const hasAdvancedFilters =
    advanced.hueRange[0] !== 0 ||
    advanced.hueRange[1] !== 360 ||
    advanced.saturationMin > 0 ||
    advanced.brightnessMin > 0 ||
    advanced.temperature !== 'all' ||
    advanced.numColors !== null ||
    advanced.wcagAA ||
    advanced.wcagAAA ||
    advanced.colorBlindFriendly;

  if (hasAdvancedFilters) {
    const cacheKey = JSON.stringify(filterState);

    if (!advancedPaletteCache || advancedPaletteCache.key !== cacheKey) {
      advancedPaletteCache = { key: cacheKey, cursor: 0, palettes: [] };
    }

    const requiredPaletteCount = advanced.numColors ??
      (targetFilterStyle?.includes('Colors') ? parseInt(targetFilterStyle, 10) : null);
    const targetMatchCount = offset + limit;
    const maxCandidates = Math.min(
      totalCount,
      advancedPaletteCache.cursor + Math.max(50000, (targetMatchCount - advancedPaletteCache.palettes.length) * 1000)
    );

    while (
      advancedPaletteCache.palettes.length < targetMatchCount &&
      advancedPaletteCache.cursor < maxCandidates &&
      advancedPaletteCache.cursor < totalCount
    ) {
      const candidateIndex = advancedPaletteCache.cursor++;
      const palette = generateProceduralPaletteByIndex(candidateIndex, {
        requiredColor: targetFilterColor,
        requiredStyle: targetFilterStyle,
        requiredTopic: targetFilterTopic,
        requiredColorCount: requiredPaletteCount,
      });
      if (matchesAdvancedProperties(palette, advanced)) {
        advancedPaletteCache.palettes.push(palette);
      }
    }

    const palettes = advancedPaletteCache.palettes.slice(offset, offset + limit);
    return {
      palettes,
      totalCount: Math.max(totalCount, offset + palettes.length),
    };
  }

  const result: Palette[] = [];
  const end = Math.min(offset + limit, totalCount);

  for (let i = offset; i < end; i++) {
    result.push(
      generateProceduralPaletteByIndex(i, {
        requiredColor: targetFilterColor,
        requiredStyle: targetFilterStyle,
        requiredTopic: targetFilterTopic,
      })
    );
  }

  return { palettes: result, totalCount };
}

interface AdvancedPaletteCache {
  key: string;
  cursor: number;
  palettes: Palette[];
}

let advancedPaletteCache: AdvancedPaletteCache | null = null;

function isHueInRange(hue: number, [minHue, maxHue]: [number, number]): boolean {
  if (minHue === 0 && maxHue === 360) return true;
  if (minHue <= maxHue) return hue >= minHue && hue <= maxHue;
  return hue >= minHue || hue <= maxHue;
}

function hasAccessibleColorPair(palette: Palette, minimumRatio: number): boolean {
  for (let first = 0; first < palette.colors.length; first++) {
    for (let second = first + 1; second < palette.colors.length; second++) {
      if (getContrastRatio(palette.colors[first].hex, palette.colors[second].hex) >= minimumRatio) {
        return true;
      }
    }
  }
  return false;
}

function hasColorBlindFriendlyBalance(palette: Palette): boolean {
  const modes = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;
  const minimumDistance = 30;

  return modes.every((mode) => {
    const simulatedColors = palette.colors.map((color) =>
      hexToRgb(simulateColorBlindness(color.hex, mode))
    );
    for (let first = 0; first < simulatedColors.length; first++) {
      for (let second = first + 1; second < simulatedColors.length; second++) {
        const a = simulatedColors[first];
        const b = simulatedColors[second];
        const distance = Math.sqrt(
          (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
        );
        if (distance < minimumDistance) return false;
      }
    }
    return true;
  });
}

function matchesAdvancedProperties(palette: Palette, advanced: FilterState['advanced']): boolean {
  if (advanced.numColors !== null && palette.colors.length !== advanced.numColors) {
    return false;
  }

  const fullHueRange = advanced.hueRange[0] === 0 && advanced.hueRange[1] === 360;
  const hasColorPropertyFilters =
    !fullHueRange ||
    advanced.saturationMin > 0 ||
    advanced.brightnessMin > 0 ||
    advanced.temperature !== 'all';

  if (
    hasColorPropertyFilters &&
    !palette.colors.some((color) => {
      const { r, g, b } = hexToRgb(color.hex);
      const { h, s, l } = rgbToHsl(r, g, b);
      return (
        (fullHueRange || (s > 0 && isHueInRange(h, advanced.hueRange))) &&
        s >= advanced.saturationMin &&
        l >= advanced.brightnessMin &&
        (advanced.temperature === 'all' || getColorTemperature(color.hex) === advanced.temperature)
      );
    })
  ) {
    return false;
  }

  if (advanced.wcagAA && !hasAccessibleColorPair(palette, 4.5)) return false;
  if (advanced.wcagAAA && !hasAccessibleColorPair(palette, 7)) return false;
  if (advanced.colorBlindFriendly && !hasColorBlindFriendlyBalance(palette)) return false;
  return true;
}
