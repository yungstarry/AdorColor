import { PaletteColor } from '../types';

// Convert HEX to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert RGB to HSL
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to RGB
export function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  h = h % 360;
  if (h < 0) h += 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else if (h >= 300 && h < 360) {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

// Convert RGB to CMYK
export function rgbToCmyk(
  r: number,
  g: number,
  b: number
): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

// Calculate relative luminance according to WCAG 2.1
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const sRGB = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

// Calculate contrast ratio between two hex colors
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

// Determine if a color is light or dark
export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return getRelativeLuminance(r, g, b) > 0.45;
}

// Color Temperature: 'warm' or 'cool'
export function getColorTemperature(hex: string): 'warm' | 'cool' {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  if (hsl.h <= 85 || hsl.h >= 320) {
    return 'warm';
  }
  return 'cool';
}

// Color Blindness Simulation
export function simulateColorBlindness(
  hex: string,
  mode: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
): string {
  if (mode === 'normal') return hex;

  const { r, g, b } = hexToRgb(hex);

  // Gamma expansion
  const gammaExpand = (v: number) => Math.pow(v / 255, 2.2);
  const gammaCompress = (v: number) =>
    Math.round(Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2) * 255);

  const lr = gammaExpand(r);
  const lg = gammaExpand(g);
  const lb = gammaExpand(b);

  let sr = lr;
  let sg = lg;
  let sb = lb;

  if (mode === 'protanopia') {
    sr = 0.56667 * lr + 0.43333 * lg;
    sg = 0.55833 * lr + 0.44167 * lg;
    sb = 0.24167 * lg + 0.75833 * lb;
  } else if (mode === 'deuteranopia') {
    sr = 0.625 * lr + 0.375 * lg;
    sg = 0.7 * lr + 0.3 * lg;
    sb = 0.3 * lg + 0.7 * lb;
  } else if (mode === 'tritanopia') {
    sr = 0.95 * lr + 0.05 * lg;
    sg = 0.43333 * lg + 0.56667 * lb;
    sb = 0.475 * lg + 0.525 * lb;
  } else if (mode === 'achromatopsia') {
    const gray = 0.299 * lr + 0.587 * lg + 0.114 * lb;
    sr = gray;
    sg = gray;
    sb = gray;
  }

  return rgbToHex(gammaCompress(sr), gammaCompress(sg), gammaCompress(sb));
}

// Curated naming database
const NAMED_COLORS: { name: string; hex: string }[] = [
  { name: 'Charcoal Black', hex: '#121212' },
  { name: 'Onyx', hex: '#0B0C10' },
  { name: 'Midnight', hex: '#264653' },
  { name: 'Persian Green', hex: '#2A9D8F' },
  { name: 'Saffron Gold', hex: '#E9C46A' },
  { name: 'Sandy Coral', hex: '#F4A261' },
  { name: 'Burnt Sienna', hex: '#E76F51' },
  { name: 'Cerulean Blue', hex: '#2A75D3' },
  { name: 'Royal Indigo', hex: '#3B49DF' },
  { name: 'Ultramarine', hex: '#1E40AF' },
  { name: 'Electric Violet', hex: '#7C3AED' },
  { name: 'Rose Petal', hex: '#EC4899' },
  { name: 'Blush Pink', hex: '#F472B6' },
  { name: 'Crimson Wine', hex: '#991B1B' },
  { name: 'Ruby Scarlet', hex: '#DC2626' },
  { name: 'Tangerine', hex: '#EA580C' },
  { name: 'Amber Glow', hex: '#D97706' },
  { name: 'Lemon Drop', hex: '#FBBF24' },
  { name: 'Emerald Forest', hex: '#059669' },
  { name: 'Mint Fresh', hex: '#10B981' },
  { name: 'Sage Green', hex: '#84A98C' },
  { name: 'Seafoam Breeze', hex: '#52796F' },
  { name: 'Slate Gray', hex: '#64748B' },
  { name: 'Cool Steel', hex: '#94A3B8' },
  { name: 'Warm Putty', hex: '#D6D3D1' },
  { name: 'Soft Cream', hex: '#FDFBF7' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Deep Espresso', hex: '#3E2723' },
  { name: 'Terracotta Clay', hex: '#A0522D' },
  { name: 'Lilac Mist', hex: '#C084FC' },
  { name: 'Teal Shadow', hex: '#0D9488' },
  { name: 'Sky Azure', hex: '#38BDF8' },
];

// Find closest human color name
export function getColorName(hex: string): string {
  const { r: r1, g: g1, b: b1 } = hexToRgb(hex);
  let closestDist = Infinity;
  let closestName = 'Custom Tone';

  for (const item of NAMED_COLORS) {
    const { r: r2, g: g2, b: b2 } = hexToRgb(item.hex);
    const dist = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );
    if (dist < closestDist) {
      closestDist = dist;
      closestName = item.name;
    }
  }

  if (closestDist > 110) {
    const hsl = rgbToHsl(r1, g1, b1);
    if (hsl.s < 10) {
      if (hsl.l > 85) return 'Off-White';
      if (hsl.l < 20) return 'Rich Black';
      return 'Neutral Gray';
    }
    if (hsl.h < 20 || hsl.h >= 345) return 'Crimson Shade';
    if (hsl.h < 45) return 'Warm Amber';
    if (hsl.h < 70) return 'Sunlight Yellow';
    if (hsl.h < 160) return 'Botanical Green';
    if (hsl.h < 200) return 'Lagoon Cyan';
    if (hsl.h < 260) return 'Nordic Blue';
    if (hsl.h < 315) return 'Amethyst Violet';
    return 'Rose Magenta';
  }

  return closestName;
}

// Build full PaletteColor object from HEX
export function buildPaletteColor(hex: string, locked = false): PaletteColor {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const cmyk = rgbToCmyk(r, g, b);
  const name = getColorName(hex);

  return {
    hex: hex.toUpperCase(),
    rgb: `${r}, ${g}, ${b}`,
    hsl: `${hsl.h}, ${hsl.s}%, ${hsl.l}%`,
    cmyk: `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`,
    name,
    locked,
  };
}

// Generate random pleasant hex
export function getRandomHex(): string {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(40 + Math.random() * 50); // 40-90%
  const l = Math.floor(25 + Math.random() * 55); // 25-80%
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// Color Harmonies
export function generateHarmonicColors(
  baseHex: string,
  mode:
    | 'analogous'
    | 'complementary'
    | 'triadic'
    | 'monochromatic'
    | 'split-complementary'
    | 'random',
  count: number = 5
): string[] {
  const { r, g, b } = hexToRgb(baseHex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const results: string[] = [baseHex];

  if (mode === 'random') {
    while (results.length < count) {
      results.push(getRandomHex());
    }
    return results;
  }

  if (mode === 'monochromatic') {
    const step = 60 / (count + 1);
    for (let i = 1; i < count; i++) {
      const newL = Math.max(
        15,
        Math.min(90, Math.round(l + (i % 2 === 0 ? 1 : -1) * i * step))
      );
      const newS = Math.max(
        20,
        Math.min(95, Math.round(s + (i % 2 === 0 ? -10 : 10)))
      );
      const rgb = hslToRgb(h, newS, newL);
      results.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  } else if (mode === 'analogous') {
    const angleStep = 25;
    for (let i = 1; i < count; i++) {
      const offset = (i % 2 === 1 ? 1 : -1) * Math.ceil(i / 2) * angleStep;
      const newH = (h + offset + 360) % 360;
      const rgb = hslToRgb(newH, s, l);
      results.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  } else if (mode === 'complementary') {
    const compH = (h + 180) % 360;
    const rgbComp = hslToRgb(compH, s, l);
    results.push(rgbToHex(rgbComp.r, rgbComp.g, rgbComp.b));
    while (results.length < count) {
      const idx = results.length;
      const targetH = idx % 2 === 0 ? h : compH;
      const newL = Math.max(20, Math.min(85, (l + idx * 15) % 90));
      const rgb = hslToRgb(targetH, s, newL);
      results.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  } else if (mode === 'triadic') {
    const h1 = (h + 120) % 360;
    const h2 = (h + 240) % 360;
    const rgb1 = hslToRgb(h1, s, l);
    const rgb2 = hslToRgb(h2, s, l);
    results.push(rgbToHex(rgb1.r, rgb1.g, rgb1.b));
    results.push(rgbToHex(rgb2.r, rgb2.g, rgb2.b));
    while (results.length < count) {
      const newL = Math.min(90, Math.max(15, l + 20));
      const rgb = hslToRgb(h, s, newL);
      results.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  } else if (mode === 'split-complementary') {
    const h1 = (h + 150) % 360;
    const h2 = (h + 210) % 360;
    results.push(
      rgbToHex(hslToRgb(h1, s, l).r, hslToRgb(h1, s, l).g, hslToRgb(h1, s, l).b)
    );
    results.push(
      rgbToHex(hslToRgb(h2, s, l).r, hslToRgb(h2, s, l).g, hslToRgb(h2, s, l).b)
    );
    while (results.length < count) {
      const rgb = hslToRgb(h, Math.max(20, s - 20), Math.min(85, l + 25));
      results.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  }

  return results.slice(0, count);
}

// Extract dominant colors from an Image via Canvas
export function extractColorsFromImage(
  imgElement: HTMLImageElement,
  numColors: number = 6
): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const maxDimension = 150;
  let width = imgElement.naturalWidth || imgElement.width || 300;
  let height = imgElement.naturalHeight || imgElement.height || 200;

  if (width > height) {
    if (width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    }
  } else {
    if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imgElement, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const colorBuckets: {
    [key: string]: { count: number; r: number; g: number; b: number };
  } = {};

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue;

    const qr = Math.floor(r / 24) * 24;
    const qg = Math.floor(g / 24) * 24;
    const qb = Math.floor(b / 24) * 24;
    const key = `${qr}-${qg}-${qb}`;

    if (!colorBuckets[key]) {
      colorBuckets[key] = { count: 0, r, g, b };
    }
    colorBuckets[key].count++;
  }

  const sorted = Object.values(colorBuckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, numColors * 3);

  const selected: string[] = [];
  for (const item of sorted) {
    const hex = rgbToHex(item.r, item.g, item.b);
    const isDistinct = selected.every((existingHex) => {
      const rgbE = hexToRgb(existingHex);
      const diff = Math.sqrt(
        Math.pow(item.r - rgbE.r, 2) +
          Math.pow(item.g - rgbE.g, 2) +
          Math.pow(item.b - rgbE.b, 2)
      );
      return diff > 50;
    });

    if (isDistinct) {
      selected.push(hex);
      if (selected.length >= numColors) break;
    }
  }

  while (selected.length < numColors) {
    selected.push(getRandomHex());
  }

  return selected;
}

// Generate CSS variables string
export function generateCssSnippet(palette: PaletteColor[], name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return (
    `/* PaletteLab: ${name} */\n:root {\n` +
    palette
      .map((c, i) => `  --color-${slug}-${i + 1}: ${c.hex}; /* ${c.name} */`)
      .join('\n') +
    `\n}`
  );
}

// Generate Tailwind color snippet
export function generateTailwindSnippet(palette: PaletteColor[], name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const colorsObj = palette.reduce((acc, c, i) => {
    acc[`'${slug}-${(i + 1) * 100}'`] = `'${c.hex}'`;
    return acc;
  }, {} as Record<string, string>);

  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(
    colorsObj,
    null,
    6
  ).replace(/"/g, '')}\n    }\n  }\n}`;
}

// Generate SVG file content
export function generateSvgDataUrl(
  palette: PaletteColor[],
  width = 1000,
  height = 400
): string {
  const barWidth = width / palette.length;
  const rects = palette
    .map(
      (c, i) =>
        `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="${c.hex}" />` +
        `<text x="${i * barWidth + barWidth / 2}" y="${height - 24}" fill="${
          isLightColor(c.hex) ? '#111827' : '#FFFFFF'
        }" font-family="system-ui, sans-serif" font-weight="600" font-size="14" text-anchor="middle">${c.hex}</text>`
    )
    .join('');

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${rects}
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
}
