import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bookmark,
  ClipboardPaste,
  Copy,
  Download,
  Eye,
  Film,
  Heart,
  Layers,
  MessageCircle,
  Monitor,
  Music2,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Type,
  Video,
} from "lucide-react";
import { Palette, PaletteColor } from "../../types";
import {
  buildPaletteColor,
  generateHarmonicColors,
  rgbToHex,
} from "../../utils/colorUtils";

/* ─────────────────────────────────────────────────────────────
 * Props (unchanged, so App and VideoBriefStudio need no edits)
 * ───────────────────────────────────────────────────────────── */

interface PaletteVisualizerProps {
  palette: Palette;
  onPaletteChange?: (palette: Palette) => void;
  onOpenInContrast?: (palette: Palette) => void;
  onCreateVideoBrief: (
    palette: Palette,
    visualizerImageDataUrl: string,
  ) => void;
  onToast: (msg: string) => void;
}

/* ─────────────────────────────────────────────────────────────
 * Types and option lists
 * ───────────────────────────────────────────────────────────── */

type RGB = [number, number, number];
type Icon = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;
type TemplateId = "reel" | "thumbnail" | "lower" | "title" | "captions";
type AspectId = "9:16" | "4:5" | "1:1" | "16:9" | "21:9";
type BackdropId = "palette" | "solid" | "day" | "night" | "busy";
type GuideId = "off" | "safe" | "thirds";
type VisionId = "none" | "value" | "protan" | "deutan" | "tritan";
type TextMode = "auto" | "light" | "dark" | "palette";
type InspectorTab = "roles" | "legibility" | "scopes" | "handoff";
type HandoffFormat =
  | "spec"
  | "hex"
  | "rgb255"
  | "rgb01"
  | "hsl"
  | "css"
  | "ass"
  | "srt"
  | "json";

const TEMPLATES: { id: TemplateId; label: string; icon: Icon }[] = [
  { id: "reel", label: "Reel / Short", icon: Smartphone },
  { id: "thumbnail", label: "Thumbnail", icon: Monitor },
  { id: "lower", label: "Lower third", icon: Film },
  { id: "title", label: "Title card", icon: Type },
  { id: "captions", label: "Captions", icon: MessageCircle },
];

const ASPECTS: Record<AspectId, { w: number; h: number; hint: string }> = {
  "9:16": { w: 338, h: 600, hint: "Reels, TikTok, Shorts" },
  "4:5": { w: 480, h: 600, hint: "Feed portrait" },
  "1:1": { w: 540, h: 540, hint: "Square" },
  "16:9": { w: 800, h: 450, hint: "YouTube, HD" },
  "21:9": { w: 840, h: 360, hint: "Cinematic" },
};
const ASPECT_IDS = Object.keys(ASPECTS) as AspectId[];

const BACKDROPS: { id: BackdropId; label: string; title: string }[] = [
  { id: "palette", label: "Palette", title: "Palette gradient" },
  { id: "solid", label: "Solid", title: "Solid dominant color" },
  { id: "day", label: "Day", title: "Bright footage stand-in" },
  { id: "night", label: "Night", title: "Dark footage stand-in" },
  { id: "busy", label: "Busy", title: "High-detail stress test" },
];

const GUIDES: { id: GuideId; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "safe", label: "Safe zones" },
  { id: "thirds", label: "Thirds" },
];

const VISIONS: { id: VisionId; label: string; title: string }[] = [
  { id: "none", label: "Normal", title: "True color" },
  { id: "value", label: "Value", title: "Black and white value check" },
  { id: "protan", label: "Protan", title: "Protanopia (red-weak)" },
  { id: "deutan", label: "Deutan", title: "Deuteranopia (green-weak)" },
  { id: "tritan", label: "Tritan", title: "Tritanopia (blue-weak)" },
];

const TEXT_MODES: { id: TextMode; label: string; title: string }[] = [
  { id: "auto", label: "Auto", title: "Black or white, whichever reads best" },
  { id: "light", label: "White", title: "Always white text" },
  { id: "dark", label: "Black", title: "Always near-black text" },
  { id: "palette", label: "Palette", title: "Best-contrast palette color" },
];

const INSPECTOR_TABS: { id: InspectorTab; label: string; icon: Icon }[] = [
  { id: "roles", label: "Roles", icon: Layers },
  { id: "legibility", label: "Legibility", icon: Eye },
  { id: "scopes", label: "Scopes", icon: Activity },
  { id: "handoff", label: "Handoff", icon: Download },
];

const HANDOFF_FORMATS: { id: HandoffFormat; label: string }[] = [
  { id: "spec", label: "60-30-10 spec" },
  { id: "hex", label: "HEX (CapCut, Premiere)" },
  { id: "rgb255", label: "RGB 0 to 255 (Final Cut)" },
  { id: "rgb01", label: "RGB 0 to 1 (After Effects, Fusion)" },
  { id: "hsl", label: "HSL" },
  { id: "css", label: "CSS variables" },
  { id: "ass", label: "ASS subtitles (Aegisub)" },
  { id: "srt", label: "SRT font tags" },
  { id: "json", label: "JSON" },
];

const isOneOf =
  <T extends string>(list: readonly T[]) =>
  (v: unknown): v is T =>
    typeof v === "string" && (list as readonly string[]).includes(v);
const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isString = (v: unknown): v is string => typeof v === "string";

/* ─────────────────────────────────────────────────────────────
 * Capture settings (vector SVG snapshot for the Video Brief)
 * ───────────────────────────────────────────────────────────── */

const CAPTURE_SCALE = 3;
const MAX_CAPTURE_SIDE = 5000;

const ALWAYS_COPY_PROPERTY =
  /^(font|color$|line-height|letter-spacing|text-|white-space|word-|direction|visibility|fill|stroke|list-style|-webkit-text|-webkit-box|box-decoration|paint-order|tab-size|border-spacing|quotes|caption|empty-cells|cursor|pointer-events|width|height|min-|max-|inline-size|block-size|top|left|right|bottom|margin|padding|display|position|flex|grid|gap|overflow|box-sizing|align|justify|order|z-index|transform|opacity|background|border|outline|box-shadow|filter|backdrop|-webkit-backdrop|mix-blend|object-|aspect-ratio)/;

const defaultStyleCache = new Map<string, Record<string, string>>();

const getDefaultStyle = (source: Element): Record<string, string> | null => {
  if (source.namespaceURI !== "http://www.w3.org/1999/xhtml") return null;
  const key = source.tagName;
  const cached = defaultStyleCache.get(key);
  if (cached) return cached;

  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;";
  const probe = document.createElement(key);
  host.appendChild(probe);
  document.body.appendChild(host);
  const computed = getComputedStyle(probe);
  const snapshot: Record<string, string> = {};
  for (let index = 0; index < computed.length; index += 1) {
    const property = computed[index];
    snapshot[property] = computed.getPropertyValue(property);
  }
  document.body.removeChild(host);
  defaultStyleCache.set(key, snapshot);
  return snapshot;
};

/**
 * Captures an element as a self-contained, resolution-independent SVG data URL.
 * Anything marked data-capture-skip (guides, hints) is left out, and any
 * color-vision filter is removed so the brief always shows true colors.
 */
const captureElementAsSvg = async (element: HTMLElement): Promise<string> => {
  const bounds = element.getBoundingClientRect();
  const width = Math.ceil(bounds.width);
  const height = Math.ceil(Math.max(bounds.height, element.scrollHeight));
  if (!width || !height)
    throw new Error("The visualizer preview is not ready to export.");

  const clone = element.cloneNode(true) as HTMLElement;
  const copyStyles = (source: Element, target: Element) => {
    const sourceStyle = getComputedStyle(source);
    const targetStyle = (target as HTMLElement).style;
    const defaults = getDefaultStyle(source);
    for (let index = 0; index < sourceStyle.length; index += 1) {
      const property = sourceStyle[index];
      const value = sourceStyle.getPropertyValue(property);
      if (
        defaults &&
        !ALWAYS_COPY_PROPERTY.test(property) &&
        defaults[property] === value
      ) {
        continue;
      }
      targetStyle.setProperty(
        property,
        value,
        sourceStyle.getPropertyPriority(property),
      );
    }
    if (
      source instanceof HTMLInputElement &&
      target instanceof HTMLInputElement
    ) {
      target.value = source.value;
      target.setAttribute("value", source.value);
    } else if (
      source instanceof HTMLTextAreaElement &&
      target instanceof HTMLTextAreaElement
    ) {
      target.value = source.value;
      target.textContent = source.value;
    } else if (
      source instanceof HTMLSelectElement &&
      target instanceof HTMLSelectElement
    ) {
      target.value = source.value;
      Array.from(target.options).forEach((option) => {
        if (option.value === source.value) option.setAttribute("selected", "");
        else option.removeAttribute("selected");
      });
    }
    Array.from(source.children).forEach((child, index) => {
      const clonedChild = target.children[index];
      if (clonedChild) copyStyles(child, clonedChild);
    });
  };
  copyStyles(element, clone);

  clone
    .querySelectorAll("[data-capture-skip]")
    .forEach((node) => node.parentNode?.removeChild(node));
  clone.querySelectorAll<HTMLElement>("[data-cvd-target]").forEach((node) => {
    node.style.filter = "none";
  });

  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.margin = "0";
  clone.style.transform = "none";
  if (
    !clone.style.backgroundColor ||
    clone.style.backgroundColor === "rgba(0, 0, 0, 0)"
  ) {
    clone.style.backgroundColor = "#ffffff";
  }
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  const scale = Math.max(
    1,
    Math.min(CAPTURE_SCALE, MAX_CAPTURE_SIDE / Math.max(width, height)),
  );
  const outputWidth = Math.ceil(width * scale);
  const outputHeight = Math.ceil(height * scale);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const image = new Image();
  image.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(
        new Error("The visualizer preview could not be rendered for export."),
      );
  });

  return dataUrl;
};

/* ─────────────────────────────────────────────────────────────
 * Color math (local, so no other file has to change)
 * ───────────────────────────────────────────────────────────── */

const INK = "#0B0F19";
const PAPER = "#FFFFFF";

const hexToRgb = (hex: string): RGB => {
  let h = hex.trim().replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length === 8) h = h.slice(0, 6);
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHexStr = ([r, g, b]: RGB): string =>
  "#" +
  [r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const relLuminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

const contrast = (a: string, b: string) => {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** Rec. 709 luma of the gamma-encoded color, 0 to 1 (what a waveform shows). */
const lumaPrime = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

const rgbToHsl = ([r, g, b]: RGB): [number, number, number] => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return [h, s, l];
};

const toLab = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
};

const deltaE = (a: string, b: string) => {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
};

const mixHex = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHexStr([
    ca[0] + (cb[0] - ca[0]) * t,
    ca[1] + (cb[1] - ca[1]) * t,
    ca[2] + (cb[2] - ca[2]) * t,
  ]);
};

/* Machado et al. (2009), severity 1.0. Row-major 3x3. */
const CVD_MATRICES: Record<"protan" | "deutan" | "tritan", number[]> = {
  protan: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882,
    -0.048116, 1.051998,
  ],
  deutan: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182,
    0.04294, 0.968881,
  ],
  tritan: [
    1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733,
    0.691367, 0.3039,
  ],
};

const simulateVision = (hex: string, mode: VisionId): string => {
  if (mode === "none") return hex;
  const [r, g, b] = hexToRgb(hex);
  if (mode === "value") {
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return rgbToHexStr([y, y, y]);
  }
  const m = CVD_MATRICES[mode];
  return rgbToHexStr([
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ]);
};

const visionFilterValue = (mode: VisionId): string => {
  if (mode === "none") return "none";
  if (mode === "value") return "grayscale(1)";
  return `url(#plv-${mode})`;
};

/** Picks dominant / secondary / accent automatically from the colors' character. */
const smartRoles = (hexes: string[]): [number, number, number] => {
  const n = hexes.length;
  if (n < 3) return getPermutationForVariety(0, n);
  const hsl = hexes.map((h) => rgbToHsl(hexToRgb(h)));
  const argmax = (indices: number[], score: (i: number) => number) =>
    indices.reduce((best, i) => (score(i) > score(best) ? i : best));
  const all = hexes.map((_, i) => i);
  const acc = argmax(all, (i) => hsl[i][1] * (1 - Math.abs(2 * hsl[i][2] - 1)));
  const rest = all.filter((i) => i !== acc);
  const dom = argmax(
    rest,
    (i) => Math.abs(hsl[i][2] - 0.5) + (1 - hsl[i][1]) * 0.25,
  );
  const rest2 = rest.filter((i) => i !== dom);
  const sec = argmax(rest2, (i) => contrast(hexes[i], hexes[dom]));
  return [dom, sec, acc];
};

/* ─────────────────────────────────────────────────────────────
 * Small helpers
 * ───────────────────────────────────────────────────────────── */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function useStoredState<T>(
  key: string,
  initial: T,
  validate?: (v: unknown) => v is T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed: unknown = JSON.parse(raw);
      if (validate && !validate(parsed)) return initial;
      return parsed as T;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage can be full or blocked; the visualizer still works */
    }
  }, [key, value]);
  return [value, setValue];
}

const downloadText = (text: string, filename: string, mime = "text/plain") => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "palette";

const textGrade = (ratio: number) => {
  if (ratio >= 7)
    return { label: "AAA", cls: "bg-emerald-50 text-emerald-700" };
  if (ratio >= 4.5) return { label: "AA", cls: "bg-emerald-50 text-emerald-700" };
  if (ratio >= 3)
    return { label: "Large text only", cls: "bg-amber-50 text-amber-800" };
  return { label: "Fails", cls: "bg-red-50 text-red-700" };
};

const shapeGrade = (ratio: number) => {
  if (ratio >= 3) return { label: "Clear", cls: "bg-emerald-50 text-emerald-700" };
  if (ratio >= 1.8) return { label: "Weak", cls: "bg-amber-50 text-amber-800" };
  return { label: "Blends in", cls: "bg-red-50 text-red-700" };
};

const colorFlags = (hex: string): string[] => {
  const out: string[] = [];
  const y = lumaPrime(hex) * 255;
  if (y < 16) out.push("Below legal black");
  if (y > 235) out.push("Above legal white");
  const [r, g, b] = hexToRgb(hex);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  if (sat > 0.92 && mx > 215) out.push("Hot saturation, may bleed");
  return out;
};

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string; icon?: Icon; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl bg-gray-100 p-0.5">
      {options.map((o) => {
        const Ic = o.icon;
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            title={o.title ?? o.label}
            onClick={() => onChange(o.id)}
            className={`flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] transition-colors ${
              on
                ? "bg-white font-bold text-gray-900 shadow-xs"
                : "font-semibold text-gray-500 hover:text-gray-900"
            }`}
          >
            {Ic && <Ic className="h-3.5 w-3.5" />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="min-w-0">
    <div className="mb-1 text-[10px] font-bold text-gray-400">{label}</div>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
 * Scopes
 * ───────────────────────────────────────────────────────────── */

const VectorScope: React.FC<{ colors: string[] }> = ({ colors }) => {
  const c = 120;
  const R = 100;
  const k = R * 1.85;
  const pos = (hex: string) => {
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return { x: c + ((b - y) / 1.8556) * k, y: c - ((r - y) / 1.5748) * k };
  };
  const targets: [string, string][] = [
    ["R", "#BF0000"],
    ["Mg", "#BF00BF"],
    ["B", "#0000BF"],
    ["Cy", "#00BFBF"],
    ["G", "#00BF00"],
    ["Yl", "#BFBF00"],
  ];
  const skin = (123 * Math.PI) / 180;
  return (
    <svg
      viewBox="0 0 240 240"
      className="mx-auto w-full max-w-[240px]"
      role="img"
      aria-label="Vectorscope of the palette"
    >
      <circle cx={c} cy={c} r={R} fill="#0f172a" />
      <circle cx={c} cy={c} r={R * 0.5} fill="none" stroke="#334155" />
      <circle cx={c} cy={c} r={R} fill="none" stroke="#475569" />
      <line x1={c - R} y1={c} x2={c + R} y2={c} stroke="#1e293b" />
      <line x1={c} y1={c - R} x2={c} y2={c + R} stroke="#1e293b" />
      <line
        x1={c}
        y1={c}
        x2={c + R * Math.cos(skin)}
        y2={c - R * Math.sin(skin)}
        stroke="#f59e0b"
        strokeDasharray="4 3"
      />
      {targets.map(([label, hex]) => {
        const p = pos(hex);
        return (
          <g key={label}>
            <rect
              x={p.x - 7}
              y={p.y - 7}
              width={14}
              height={14}
              fill="none"
              stroke="#64748b"
            />
            <text x={p.x} y={p.y + 3} fontSize="8" textAnchor="middle" fill="#94a3b8">
              {label}
            </text>
          </g>
        );
      })}
      {colors.map((hex, i) => {
        const p = pos(hex);
        return (
          <g key={`${hex}-${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={7}
              fill={hex}
              stroke="#ffffff"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y - 11}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
              fill="#e2e8f0"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      <text x={c + R * Math.cos(skin) - 4} y={c - R * Math.sin(skin) - 4} fontSize="8" fill="#f59e0b">
        skin
      </text>
    </svg>
  );
};

const LumaBars: React.FC<{ colors: string[] }> = ({ colors }) => {
  const top = 8;
  const plotH = 132;
  const bottom = top + plotH;
  const left = 30;
  const w = 260;
  const slot = (w - left - 6) / Math.max(colors.length, 1);
  const y = (frac: number) => bottom - frac * plotH;
  return (
    <svg
      viewBox="0 0 260 164"
      className="w-full"
      role="img"
      aria-label="Luma levels of the palette"
    >
      <rect x={left} y={top} width={w - left - 6} height={plotH} fill="#0f172a" rx={6} />
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={left} x2={w - 6} y1={y(f)} y2={y(f)} stroke="#1e293b" />
          <text x={left - 5} y={y(f) + 3} fontSize="8" textAnchor="end" fill="#94a3b8">
            {Math.round(f * 100)}
          </text>
        </g>
      ))}
      <line x1={left} x2={w - 6} y1={y(16 / 255)} y2={y(16 / 255)} stroke="#f59e0b" strokeDasharray="3 3" />
      <line x1={left} x2={w - 6} y1={y(235 / 255)} y2={y(235 / 255)} stroke="#f59e0b" strokeDasharray="3 3" />
      {colors.map((hex, i) => {
        const bh = Math.max(2, lumaPrime(hex) * plotH);
        const bw = slot - 8;
        const x = left + 4 + i * slot;
        return (
          <g key={`${hex}-${i}`}>
            <rect x={x} y={bottom - bh} width={bw} height={bh} fill={hex} rx={3} stroke="#ffffff" strokeOpacity={0.5} />
            <text x={x + bw / 2} y={bottom + 13} fontSize="9" fontWeight="700" textAnchor="middle" fill="#475569">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────
 * Exported helpers (kept, other files may import them)
 * ───────────────────────────────────────────────────────────── */

export function getPaletteFingerprint(p: Palette | null | undefined): string {
  if (!p) return "";
  return `${p.id || "noid"}::${p.name || ""}::${(p.colors || []).map((c) => c.hex).join(",")}`;
}

export function getPermutationForVariety(
  varietyIndex: number,
  len: number,
): [number, number, number] {
  if (len < 2) return [0, 0, 0];
  if (len === 2) {
    return varietyIndex % 2 === 0 ? [0, 1, 1] : [1, 0, 0];
  }
  if (len === 3) {
    const p3: [number, number, number][] = [
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1],
      [0, 2, 1],
      [1, 0, 2],
      [2, 1, 0],
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1],
      [0, 2, 1],
    ];
    return p3[varietyIndex % 10];
  }

  const basePatterns: [number, number, number][] = [
    [0, 1, 2],
    [1, 2, 3 % len],
    [2, 3 % len, 4 % len],
    [3 % len, 4 % len, 0],
    [4 % len, 0, 1],
    [1, 0, 2],
    [2, 0, 1],
    [3 % len, 2, 1],
    [4 % len, 3 % len, 0],
    [2, 3 % len, 4 % len],
  ];

  const [d, s, a] = basePatterns[varietyIndex % 10];
  const dom = d % len;
  let sec = s % len;
  if (sec === dom) sec = (dom + 1) % len;
  let acc = a % len;
  while (acc === dom || acc === sec) {
    acc = (acc + 1) % len;
  }
  return [dom, sec, acc];
}

/* ─────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────── */

export const PaletteVisualizer: React.FC<PaletteVisualizerProps> = ({
  palette: initialPalette,
  onOpenInContrast,
  onCreateVideoBrief,
  onToast,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [creatingBrief, setCreatingBrief] = useState(false);

  const [tab, setTab] = useStoredState<InspectorTab>(
    "palettelab_viz2_tab",
    "roles",
    isOneOf(INSPECTOR_TABS.map((t) => t.id)),
  );
  const [template, setTemplate] = useStoredState<TemplateId>(
    "palettelab_viz2_template",
    "reel",
    isOneOf(TEMPLATES.map((t) => t.id)),
  );
  const [aspect, setAspect] = useStoredState<AspectId>(
    "palettelab_viz2_aspect",
    "9:16",
    isOneOf(ASPECT_IDS),
  );
  const [backdrop, setBackdrop] = useStoredState<BackdropId>(
    "palettelab_viz2_backdrop",
    "palette",
    isOneOf(BACKDROPS.map((b) => b.id)),
  );
  const [exposure, setExposure] = useStoredState<number>(
    "palettelab_viz2_exposure",
    50,
    isNumber,
  );
  const [guides, setGuides] = useStoredState<GuideId>(
    "palettelab_viz2_guides",
    "off",
    isOneOf(GUIDES.map((g) => g.id)),
  );
  const [platformUI, setPlatformUI] = useStoredState<boolean>(
    "palettelab_viz2_platform_ui",
    true,
    isBool,
  );
  const [vision, setVision] = useStoredState<VisionId>(
    "palettelab_viz2_vision",
    "none",
    isOneOf(VISIONS.map((v) => v.id)),
  );
  const [textMode, setTextMode] = useStoredState<TextMode>(
    "palettelab_viz2_text_mode",
    "auto",
    isOneOf(TEXT_MODES.map((t) => t.id)),
  );
  const [handoffFormat, setHandoffFormat] = useStoredState<HandoffFormat>(
    "palettelab_viz2_handoff",
    "spec",
    isOneOf(HANDOFF_FORMATS.map((f) => f.id)),
  );
  const [customInput, setCustomInput] = useStoredState<string>(
    "palettelab_visualizer_custom_input",
    "",
    isString,
  );
  const [varietyIdx, setVarietyIdx] = useStoredState<number>(
    "palettelab_reels_variety_idx",
    0,
    isNumber,
  );
  const [dominantRoleIdx, setDominantRoleIdx] = useStoredState<number>(
    "palettelab_reels_dominant_idx",
    0,
    isNumber,
  );
  const [secondaryRoleIdx, setSecondaryRoleIdx] = useStoredState<number>(
    "palettelab_reels_secondary_idx",
    1,
    isNumber,
  );
  const [accentRoleIdx, setAccentRoleIdx] = useStoredState<number>(
    "palettelab_reels_accent_idx",
    2,
    isNumber,
  );

  const [activePalette, setActivePalette] = useState<Palette>(initialPalette);
  const lastPropFingerprintRef = useRef(getPaletteFingerprint(initialPalette));

  /* Palette coming in from outside resets roles. */
  useEffect(() => {
    const fp = getPaletteFingerprint(initialPalette);
    if (initialPalette && fp !== lastPropFingerprintRef.current) {
      lastPropFingerprintRef.current = fp;
      setActivePalette(initialPalette);
      setDominantRoleIdx(0);
      setSecondaryRoleIdx(Math.min(1, initialPalette.colors.length - 1));
      setAccentRoleIdx(Math.min(2, initialPalette.colors.length - 1));
      setVarietyIdx(0);
      setCustomInput("");
    }
  }, [
    initialPalette,
    setDominantRoleIdx,
    setSecondaryRoleIdx,
    setAccentRoleIdx,
    setVarietyIdx,
    setCustomInput,
  ]);

  /* ── Colors and roles ── */
  const rawColors = activePalette.colors.map((c) => c.hex);
  const colors = rawColors.length ? rawColors : ["#264653", "#2A9D8F", "#E9C46A"];
  const last = colors.length - 1;
  const dI = Math.min(Math.max(dominantRoleIdx, 0), last);
  const sI = Math.min(Math.max(secondaryRoleIdx, 0), last);
  const aI = Math.min(Math.max(accentRoleIdx, 0), last);
  const bg = colors[dI];
  const card = colors[sI];
  const acc = colors[aI];
  const supporting = colors
    .map((_, i) => i)
    .filter((i) => i !== dI && i !== sI && i !== aI);
  const s1 = colors[supporting[0]] ?? card;
  const s2 = colors[supporting[1]] ?? colors[supporting[0]] ?? acc;

  const textOn = (surface: string): string => {
    if (textMode === "light") return PAPER;
    if (textMode === "dark") return INK;
    const best =
      contrast(surface, PAPER) >= contrast(surface, INK) ? PAPER : INK;
    if (textMode === "palette") {
      let pick = best;
      let ratio = 0;
      colors.forEach((c) => {
        if (c === surface) return;
        const r = contrast(surface, c);
        if (r > ratio) {
          ratio = r;
          pick = c;
        }
      });
      return ratio >= 4.5 ? pick : best;
    }
    return best;
  };
  const tBg = textOn(bg);
  const tCard = textOn(card);
  const tAcc = textOn(acc);
  const tS1 = textOn(s1);
  const tS2 = textOn(s2);

  const permutation = getPermutationForVariety(varietyIdx, colors.length);
  const isVariety =
    permutation[0] === dI && permutation[1] === sI && permutation[2] === aI;
  const roleLabel = isVariety ? `Variety #${varietyIdx + 1}` : "Custom roles";

  const roleTag = (idx: number) => {
    if (idx === dI) return { name: "Dominant 60%", color: "#1d4ed8" };
    if (idx === sI) return { name: "Secondary 30%", color: "#4338ca" };
    if (idx === aI) return { name: "Accent 10%", color: "#b45309" };
    const n = supporting.indexOf(idx) + 1;
    return { name: `Supporting ${n}`, color: "#047857" };
  };

  const roleList = [
    { name: "Dominant (60%)", hex: bg },
    { name: "Secondary (30%)", hex: card },
    { name: "Accent (10%)", hex: acc },
    ...supporting.map((i, n) => ({ name: `Supporting ${n + 1}`, hex: colors[i] })),
  ];

  /* ── Stage geometry. Sizes are in % of frame width, like real titles. ── */
  const { w: W, h: H } = ASPECTS[aspect];
  const u = Math.min(W, (H * 16) / 9) / 100;
  const P = (n: number) => `${(n * u).toFixed(2)}px`;
  const portrait = H > W;
  const tplMeta = TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0];
  const footage = backdrop === "day" || backdrop === "night" || backdrop === "busy";

  /* ── Actions ── */
  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onToast(message);
    } catch {
      onToast("Copy was blocked by the browser. Select the text and copy it manually.");
    }
  };

  const resetRoles = (len: number) => {
    setDominantRoleIdx(0);
    setSecondaryRoleIdx(Math.min(1, len - 1));
    setAccentRoleIdx(Math.min(2, len - 1));
    setVarietyIdx(0);
  };

  const selectVariety = (idx: number) => {
    setVarietyIdx(idx);
    const [d, s, a] = getPermutationForVariety(idx, colors.length);
    setDominantRoleIdx(d);
    setSecondaryRoleIdx(s);
    setAccentRoleIdx(a);
  };

  const applySmartRoles = () => {
    const [d, s, a] = smartRoles(colors);
    setDominantRoleIdx(d);
    setSecondaryRoleIdx(s);
    setAccentRoleIdx(a);
    onToast("Roles assigned from each color's brightness and saturation.");
  };

  const extractColors = (input: string): string[] => {
    if (!input) return [];
    const found: string[] = [];

    const rgbRegex = /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
    let rgbMatch;
    while ((rgbMatch = rgbRegex.exec(input)) !== null) {
      found.push(
        rgbToHex(
          parseInt(rgbMatch[1], 10),
          parseInt(rgbMatch[2], 10),
          parseInt(rgbMatch[3], 10),
        ),
      );
    }

    const hexWithHashRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    let hashMatch;
    while ((hashMatch = hexWithHashRegex.exec(input)) !== null) {
      let clean = hashMatch[1];
      if (clean.length === 3) {
        clean = clean
          .split("")
          .map((c) => c + c)
          .join("");
      }
      found.push(`#${clean.toUpperCase()}`);
    }

    if (found.length === 0) {
      const hexNoHashRegex = /\b([0-9a-fA-F]{6})\b/g;
      let noHashMatch;
      while ((noHashMatch = hexNoHashRegex.exec(input)) !== null) {
        found.push(`#${noHashMatch[1].toUpperCase()}`);
      }
    }

    return Array.from(new Set(found)).slice(0, 10);
  };

  const parseAndApplyHexes = (inputString: string) => {
    if (!inputString.trim()) {
      onToast("Please paste or type HEX color codes (e.g. #264653, #2A9D8F)");
      return;
    }
    const hexList = extractColors(inputString);
    if (hexList.length === 0) {
      onToast(
        "No valid HEX color codes found in your input. Try e.g. #264653, #2A9D8F",
      );
      return;
    }

    let finalHexes: string[];
    if (hexList.length === 1) {
      finalHexes = generateHarmonicColors(hexList[0], "complementary", 5);
      onToast(`Applied ${hexList[0]} and generated a harmonic palette.`);
    } else {
      finalHexes = hexList;
      onToast(`Applied ${finalHexes.length} colors to the visualizer.`);
    }

    const updatedColors: PaletteColor[] = finalHexes.map((hex) =>
      buildPaletteColor(hex),
    );
    const newPalette: Palette = {
      id: `custom-visual-${Date.now()}`,
      name:
        hexList.length === 1
          ? `Palette for ${hexList[0]}`
          : "Custom Pasted Palette",
      colors: updatedColors,
      tags: ["Custom Input"],
      styles: [`${updatedColors.length} Colors`],
      topics: ["Custom"],
      creator: { id: "me", name: "You", avatar: "" },
      likes: 1,
      views: 1,
      createdAt: new Date().toISOString(),
      isPublic: false,
    };

    setActivePalette(newPalette);
    try {
      localStorage.setItem(
        "palettelab_visualizer_active_palette",
        JSON.stringify(newPalette),
      );
    } catch {
      /* ignore */
    }
    resetRoles(updatedColors.length);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setCustomInput(text.trim());
        parseAndApplyHexes(text.trim());
      } else {
        onToast("Clipboard is empty. Copy some HEX colors first.");
      }
    } catch {
      onToast("Paste your colors into the input box instead (Ctrl+V or Cmd+V).");
    }
  };

  const handleResetToOriginal = () => {
    setActivePalette(initialPalette);
    setCustomInput("");
    resetRoles(initialPalette.colors.length);
    try {
      localStorage.setItem(
        "palettelab_visualizer_active_palette",
        JSON.stringify(initialPalette),
      );
    } catch {
      /* ignore */
    }
    onToast("Reset to the original palette.");
  };

  const handleCreateVideoBrief = async () => {
    const board = boardRef.current;
    if (!board || creatingBrief) return;
    setCreatingBrief(true);
    try {
      const visualizerImage = await captureElementAsSvg(board);
      onCreateVideoBrief(activePalette, visualizerImage);
    } catch (error) {
      console.error(
        "Unable to capture the visualizer preview for the video brief:",
        error,
      );
      onToast("Unable to include the visualizer preview. Please try again.");
    } finally {
      setCreatingBrief(false);
    }
  };

  /* Keyboard: arrows flip varieties, 1-5 switch template, G cycles guides. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("input, select, textarea, [contenteditable='true']"))
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        selectVariety((varietyIdx + 1) % 10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        selectVariety((varietyIdx + 9) % 10);
      } else if (/^[1-5]$/.test(e.key)) {
        setTemplate(TEMPLATES[Number(e.key) - 1].id);
      } else if (e.key.toLowerCase() === "g") {
        const order: GuideId[] = ["off", "safe", "thirds"];
        setGuides((g) => order[(order.indexOf(g) + 1) % order.length]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varietyIdx, colors.length]);

  /* ── Legibility data ── */
  const legRows: {
    label: string;
    fg: string;
    on: string;
    kind: "text" | "shape";
  }[] = [
    { label: "Text on canvas", fg: tBg, on: bg, kind: "text" },
    { label: "Text on card", fg: tCard, on: card, kind: "text" },
    { label: "Text on accent", fg: tAcc, on: acc, kind: "text" },
    { label: "Accent used as text on canvas", fg: acc, on: bg, kind: "text" },
    { label: "Accent used as text on card", fg: acc, on: card, kind: "text" },
    { label: "Card against canvas", fg: card, on: bg, kind: "shape" },
    { label: "Accent against canvas", fg: acc, on: bg, kind: "shape" },
  ];

  const collisions: [number, number, number][] = [];
  if (vision !== "none") {
    for (let i = 0; i < colors.length; i += 1) {
      for (let j = i + 1; j < colors.length; j += 1) {
        const de = deltaE(
          simulateVision(colors[i], vision),
          simulateVision(colors[j], vision),
        );
        if (de < 12) collisions.push([i, j, de]);
      }
    }
  }

  const notes: string[] = [];
  if (contrast(card, bg) < 1.5)
    notes.push("The card barely separates from the canvas. Add a stroke or pick another secondary.");
  if (contrast(acc, bg) < 3)
    notes.push("The accent blends into the canvas. It will not pop on hooks and CTAs.");
  if (contrast(acc, card) < 3)
    notes.push("The accent is weak on the card. Use it as a highlight pill, not as text color.");
  if (contrast(acc, bg) >= 4.5 && contrast(acc, card) >= 4.5)
    notes.push("The accent holds up as text on both canvas and card.");
  const weighted =
    0.6 * lumaPrime(bg) + 0.3 * lumaPrime(card) + 0.1 * lumaPrime(acc);
  const lookLabel =
    weighted < 0.25 ? "Dark, low-key" : weighted < 0.55 ? "Balanced" : "Bright, high-key";

  /* ── Handoff text ── */
  const buildHandoff = (fmt: HandoffFormat): string => {
    const pad = (s: string) => s.padEnd(17);
    switch (fmt) {
      case "spec":
        return [
          `/* ${activePalette.name}: 60-30-10 video color scheme (${roleLabel}) */`,
          ...roleList.map((r) => `${pad(r.name)} ${r.hex}`),
          "",
          `${pad("Text on canvas")} ${tBg}`,
          `${pad("Text on card")} ${tCard}`,
          `${pad("Text on accent")} ${tAcc}`,
        ].join("\n");
      case "hex":
        return roleList.map((r) => `${pad(r.name)} ${r.hex}`).join("\n");
      case "rgb255":
        return roleList
          .map((r) => {
            const [R, G, B] = hexToRgb(r.hex);
            return `${pad(r.name)} R ${R}  G ${G}  B ${B}`;
          })
          .join("\n");
      case "rgb01":
        return roleList
          .map((r) => {
            const [R, G, B] = hexToRgb(r.hex);
            return `${pad(r.name)} ${(R / 255).toFixed(4)}, ${(G / 255).toFixed(4)}, ${(B / 255).toFixed(4)}`;
          })
          .join("\n");
      case "hsl":
        return roleList
          .map((r) => {
            const [h, s, l] = rgbToHsl(hexToRgb(r.hex));
            return `${pad(r.name)} hsl(${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
          })
          .join("\n");
      case "css":
        return [
          ":root {",
          `  --pl-dominant: ${bg};`,
          `  --pl-secondary: ${card};`,
          `  --pl-accent: ${acc};`,
          ...supporting.map((i, n) => `  --pl-supporting-${n + 1}: ${colors[i]};`),
          `  --pl-text-on-dominant: ${tBg};`,
          `  --pl-text-on-secondary: ${tCard};`,
          `  --pl-text-on-accent: ${tAcc};`,
          "}",
        ].join("\n");
      case "ass": {
        const ass = (hex: string) => {
          const [R, G, B] = hexToRgb(hex);
          const h = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
          return `&H00${h(B)}${h(G)}${h(R)}`;
        };
        return [
          "; Colours in ASS order (&H00BBGGRR)",
          ...roleList.map((r) => `; ${pad(r.name)} ${ass(r.hex)}`),
          "",
          "[V4+ Styles]",
          "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
          `Style: PL-Caption,Arial,64,${ass(tBg)},&H000000FF,${ass(bg)},&H64000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,80,1`,
          `Style: PL-Highlight,Arial,64,${ass(acc)},&H000000FF,${ass(bg)},&H64000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,80,1`,
        ].join("\n");
      }
      case "srt":
        return [
          "Most editors and players read these font tags in SRT. Not all do.",
          "",
          ...roleList.map(
            (r) => `<font color="${r.hex}">${r.name}</font>`,
          ),
        ].join("\n");
      case "json":
        return JSON.stringify(
          {
            name: activePalette.name,
            roles: roleList.map((r) => ({
              role: r.name,
              hex: r.hex,
              rgb: hexToRgb(r.hex),
            })),
            textColors: { onDominant: tBg, onSecondary: tCard, onAccent: tAcc },
            colors,
          },
          null,
          2,
        );
    }
  };
  const handoffText = buildHandoff(handoffFormat);

  const gplText = [
    "GIMP Palette",
    `Name: ${activePalette.name}`,
    "Columns: 5",
    "#",
    ...roleList.map((r) => {
      const [R, G, B] = hexToRgb(r.hex);
      return `${String(R).padStart(3)} ${String(G).padStart(3)} ${String(B).padStart(3)} ${r.name}`;
    }),
  ].join("\n");

  /* ─────────────────────────────────────────────────────────
   * Stage pieces
   * ───────────────────────────────────────────────────────── */

  const pill = (fill: string, size = 2.6): React.CSSProperties => ({
    background: fill,
    color: textOn(fill),
    fontSize: P(size),
    fontWeight: 800,
    padding: `${P(size * 0.25)} ${P(size * 0.6)}`,
    borderRadius: P(size * 0.6),
    display: "inline-block",
    lineHeight: 1.2,
    letterSpacing: "0.01em",
  });

  const hl = (text: React.ReactNode, size: number) => (
    <span
      style={
        {
          background: acc,
          color: tAcc,
          padding: `0 ${P(size * 0.16)}`,
          borderRadius: P(size * 0.2),
          WebkitBoxDecorationBreak: "clone",
          boxDecorationBreak: "clone",
        } as React.CSSProperties
      }
    >
      {text}
    </span>
  );

  const renderBackdrop = () => {
    const fill: React.CSSProperties = { position: "absolute", inset: 0 };
    if (backdrop === "solid") return <div style={{ ...fill, background: bg }} />;
    if (backdrop === "palette")
      return (
        <div
          style={{
            ...fill,
            background: `linear-gradient(155deg, ${bg} 0%, ${bg} 58%, ${mixHex(bg, card, 0.45)} 100%)`,
          }}
        />
      );
    if (backdrop === "day")
      return (
        <div
          style={{
            ...fill,
            background: "linear-gradient(180deg,#6fb7ff 0%,#bfe3ff 55%,#fff0cf 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "66%",
              top: "12%",
              width: P(14),
              height: P(14),
              borderRadius: "50%",
              background: "#fff6c7",
            }}
          />
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "42%" }}
          >
            <path d="M0 40 L0 20 Q16 6 32 18 T64 16 T100 10 L100 40Z" fill="#5f9f6b" />
            <path d="M0 40 L0 30 Q22 18 44 29 T100 24 L100 40Z" fill="#3f7d4e" />
          </svg>
        </div>
      );
    if (backdrop === "night")
      return (
        <div
          style={{
            ...fill,
            background: "linear-gradient(180deg,#04060f 0%,#10193a 70%,#1d2c5e 100%)",
          }}
        >
          {[
            [12, 10],
            [28, 22],
            [44, 8],
            [58, 18],
            [86, 26],
            [74, 6],
          ].map(([x, y]) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: P(0.7),
                height: P(0.7),
                borderRadius: "50%",
                background: "#e5e9ff",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: "70%",
              top: "14%",
              width: P(9),
              height: P(9),
              borderRadius: "50%",
              background: "#f4f1de",
            }}
          />
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "40%" }}
          >
            <path d="M0 40 L0 18 Q18 4 34 16 T66 14 T100 8 L100 40Z" fill="#0d1430" />
            <path d="M0 40 L0 30 Q24 20 46 29 T100 24 L100 40Z" fill="#070b1d" />
          </svg>
        </div>
      );
    return (
      <div
        style={{
          ...fill,
          background:
            "repeating-linear-gradient(45deg,#f2f2f2 0 9px,#1f1f1f 9px 18px)",
        }}
      />
    );
  };

  const renderGuides = () => {
    if (guides === "off") return null;
    const base: React.CSSProperties = { position: "absolute", pointerEvents: "none" };
    if (guides === "thirds") {
      const line = "1px solid rgba(255,255,255,.75)";
      const shadow = "0 0 0 1px rgba(0,0,0,.35)";
      return (
        <div data-capture-skip style={{ ...base, inset: 0 }}>
          {[33.333, 66.666].map((p) => (
            <React.Fragment key={p}>
              <div style={{ ...base, left: `${p}%`, top: 0, bottom: 0, borderLeft: line, boxShadow: shadow }} />
              <div style={{ ...base, top: `${p}%`, left: 0, right: 0, borderTop: line, boxShadow: shadow }} />
            </React.Fragment>
          ))}
        </div>
      );
    }
    if (aspect === "9:16") {
      const zone: React.CSSProperties = {
        ...base,
        background: "rgba(239,68,68,.28)",
        color: "#fff",
        fontSize: 9,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
      return (
        <div data-capture-skip style={{ ...base, inset: 0 }}>
          <div style={{ ...zone, left: 0, right: 0, top: 0, height: "13%" }}>Top UI</div>
          <div style={{ ...zone, left: 0, right: 0, bottom: 0, height: "20%" }}>Caption and sound UI</div>
          <div style={{ ...zone, right: 0, top: "13%", bottom: "20%", width: "15%" }}>Buttons</div>
        </div>
      );
    }
    const dash = "1.5px dashed rgba(255,255,255,.9)";
    return (
      <div data-capture-skip style={{ ...base, inset: 0 }}>
        <div style={{ ...base, inset: "3.5%", border: dash, boxShadow: "0 0 0 1px rgba(0,0,0,.3)" }} />
        <div style={{ ...base, inset: "5%", border: "1.5px dashed rgba(250,204,21,.95)" }} />
        <div style={{ ...base, left: "5.5%", top: "5.5%", fontSize: 9, color: "#fde047", fontWeight: 700 }}>
          Title safe 90%
        </div>
      </div>
    );
  };

  /* Reel / short */
  const renderReel = () => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${P(4.5)} ${P(5)} ${P(5)}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: P(2.2) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={pill(s1, 2.6)}>Reels</span>
          <span style={{ fontSize: P(2.4), fontFamily: MONO, color: tBg, opacity: 0.7 }}>
            {roleLabel}
          </span>
        </div>
        <div
          style={{
            fontSize: P(6.4),
            fontWeight: 900,
            lineHeight: 1.08,
            color: tBg,
            letterSpacing: "-0.02em",
          }}
        >
          Stop picking {hl("random colors", 6.4)} for your reels
        </div>
      </div>

      <div
        style={{
          alignSelf: "center",
          textAlign: "center",
          maxWidth: platformUI ? "76%" : "86%",
          background: card,
          color: tCard,
          padding: `${P(3)} ${P(4.4)}`,
          borderRadius: P(3),
          fontSize: P(4.6),
          fontWeight: 800,
          lineHeight: 1.25,
          boxShadow: `0 ${P(1)} ${P(3)} rgba(0,0,0,.25)`,
        }}
      >
        <div style={{ fontSize: P(2), fontWeight: 700, opacity: 0.7, marginBottom: P(0.8) }}>
          Secondary card, 30%
        </div>
        The {hl("60-30-10 rule", 4.6)} keeps every frame on-brand.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: P(1.8), paddingRight: platformUI ? P(14) : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: P(2) }}>
          <div
            style={{
              width: P(7.5),
              height: P(7.5),
              borderRadius: "50%",
              background: card,
              color: tCard,
              fontSize: P(2.8),
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            PL
          </div>
          <span style={{ fontSize: P(3.2), fontWeight: 800, color: tBg }}>@palettelab.video</span>
          <span style={pill(acc, 2.8)}>Follow</span>
        </div>
        <div style={{ fontSize: P(3), color: tBg, opacity: 0.85, lineHeight: 1.25 }}>
          Color grade short-form with a palette that survives compression.
        </div>
        <div style={{ ...pill(s1, 2.6), display: "inline-flex", alignItems: "center", gap: P(1.2), alignSelf: "flex-start" }}>
          <Music2 style={{ width: P(2.8), height: P(2.8) }} />
          <span>Original sound</span>
        </div>
        <div style={{ height: P(0.9), borderRadius: P(0.5), background: `${tBg}40`, overflow: "hidden" }}>
          <div style={{ width: "58%", height: "100%", background: acc }} />
        </div>
      </div>

      {platformUI && (
        <div
          style={{
            position: "absolute",
            right: P(3),
            bottom: P(24),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: P(3.4),
            color: tBg,
          }}
        >
          {[
            { Ic: Heart, label: "148k" },
            { Ic: MessageCircle, label: "2.1k" },
            { Ic: Bookmark, label: "9.4k" },
            { Ic: Share2, label: "Share" },
          ].map(({ Ic, label }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: P(0.6) }}>
              <div
                style={{
                  width: P(9),
                  height: P(9),
                  borderRadius: "50%",
                  background: `${tBg}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ic style={{ width: P(4.6), height: P(4.6) }} />
              </div>
              <span style={{ fontSize: P(2.1), fontWeight: 700 }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* YouTube-style thumbnail */
  const renderThumbnail = () => {
    const showSubject = W >= H;
    return (
      <div style={{ position: "absolute", inset: 0, padding: P(4.5), display: "flex", alignItems: "center" }}>
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: P(2.2), alignItems: "flex-start", zIndex: 2 }}>
          <span style={pill(acc, 3)}>New</span>
          <div
            style={{
              fontSize: P(11),
              fontWeight: 900,
              lineHeight: 0.98,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              color: tBg,
            }}
          >
            Color that
            <br />
            {hl("converts", 11)}
            <br />
            faster
          </div>
          <div style={{ fontSize: P(3.2), fontWeight: 700, color: tBg, opacity: 0.85 }}>
            I tested the same edit in 5 palettes
          </div>
        </div>
        {showSubject && (
          <div style={{ flex: "0 0 38%", alignSelf: "stretch", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                marginLeft: `-${P(16)}`,
                bottom: `-${P(4.5)}`,
                width: P(32),
                height: P(20),
                borderRadius: "50% 50% 0 0",
                background: card,
                border: `${P(0.8)} solid ${acc}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                marginLeft: `-${P(7.5)}`,
                bottom: P(13),
                width: P(15),
                height: P(15),
                borderRadius: "50%",
                background: s1,
                border: `${P(0.8)} solid ${acc}`,
              }}
            />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            right: P(2),
            bottom: P(2),
            background: "#000000",
            color: "#FFFFFF",
            fontSize: P(2.6),
            fontWeight: 700,
            padding: `${P(0.4)} ${P(1)}`,
            borderRadius: P(0.6),
          }}
        >
          12:34
        </div>
      </div>
    );
  };

  /* Interview lower third with ticker */
  const renderLower = () => {
    const ltBottom = 10.5 * u + (portrait ? H * 0.14 : 0);
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <div
          style={{
            position: "absolute",
            left: "66%",
            bottom: 0,
            marginLeft: `-${P(20)}`,
            width: P(40),
            height: P(26),
            borderRadius: "50% 50% 0 0",
            background: "rgba(0,0,0,.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "66%",
            bottom: P(24),
            marginLeft: `-${P(8.5)}`,
            width: P(17),
            height: P(17),
            borderRadius: "50%",
            background: "rgba(0,0,0,.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: P(4),
            right: P(4),
            width: P(8),
            height: P(8),
            borderRadius: P(1.4),
            background: acc,
            color: tAcc,
            fontSize: P(3),
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          PL
        </div>

        <div style={{ position: "absolute", left: P(5), bottom: ltBottom, display: "flex", alignItems: "stretch" }}>
          <div style={{ width: P(1.4), background: acc }} />
          <div>
            <div style={{ background: card, color: tCard, padding: `${P(1.6)} ${P(3.2)}`, fontSize: P(4.4), fontWeight: 800 }}>
              Evelyn Vance
            </div>
            <div style={{ background: s1, color: tS1, padding: `${P(1)} ${P(3.2)}`, fontSize: P(2.6), fontWeight: 600 }}>
              Principal Design Architect, Studio Corp
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: P(6.5),
            background: s2,
            color: tS2,
            display: "flex",
            alignItems: "center",
            gap: P(2),
            padding: `0 ${P(3)}`,
            fontSize: P(2.6),
            fontWeight: 700,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span style={pill(acc, 2.2)}>Live</span>
          <span>Palette tests that survive every platform</span>
        </div>
      </div>
    );
  };

  /* Title card */
  const renderTitle = () => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: P(6) }}>
      <div
        style={{
          width: "100%",
          background: bg,
          color: tBg,
          padding: `${P(6)} ${P(7)}`,
          border: `${P(0.5)} solid ${acc}`,
          display: "flex",
          flexDirection: "column",
          gap: P(2.6),
          alignItems: "flex-start",
        }}
      >
        <span style={pill(acc, 2.8)}>Episode 04</span>
        <div style={{ fontSize: P(9), fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
          Chromatic spectrum
        </div>
        <div style={{ width: P(14), height: P(1), background: acc }} />
        <div style={{ fontSize: P(3.2), fontWeight: 600, opacity: 0.85 }}>
          A study in light, contrast, and rhythm
        </div>
        <div style={{ display: "flex", gap: P(1.4) }}>
          {colors.map((c, i) => (
            <span
              key={`${c}-${i}`}
              style={{
                width: P(3.2),
                height: P(3.2),
                borderRadius: "50%",
                background: c,
                border: `${P(0.3)} solid ${tBg}55`,
                display: "inline-block",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  /* Caption styles */
  const renderCaptions = () => {
    const tag = (t: string) => (
      <span
        style={{
          background: "rgba(0,0,0,.6)",
          color: "#FFFFFF",
          fontSize: P(2),
          fontWeight: 700,
          padding: `${P(0.4)} ${P(1.2)}`,
          borderRadius: P(1),
          display: "inline-block",
        }}
      >
        {t}
      </span>
    );
    const words = ["This", "is", "where", "color", "pops"];
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: P(3),
          padding: `${P(4)} ${P(5)} ${portrait ? H * 0.2 : 7 * u}px`,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: P(1) }}>
          {tag("Box")}
          <div
            style={{
              background: card,
              color: tCard,
              fontSize: P(4.4),
              fontWeight: 800,
              padding: `${P(1.4)} ${P(3)}`,
              borderRadius: P(1.6),
            }}
          >
            This is where {hl("color", 4.4)} pops
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: P(1) }}>
          {tag("Sticker")}
          <div
            style={
              {
                color: acc,
                fontSize: P(6.4),
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                WebkitTextStroke: `${P(1.3)} ${tAcc}`,
                paintOrder: "stroke fill",
              } as React.CSSProperties
            }
          >
            Look at this
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: P(1) }}>
          {tag("Karaoke")}
          <div
            style={{
              display: "flex",
              gap: P(1.2),
              fontSize: P(5),
              fontWeight: 900,
              color: "#FFFFFF",
              textShadow: `0 ${P(0.3)} ${P(1.2)} rgba(0,0,0,.85)`,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {words.map((w, i) =>
              i === 3 ? (
                <span key={w} style={{ background: acc, color: tAcc, padding: `0 ${P(1)}`, borderRadius: P(1), textShadow: "none" }}>
                  {w}
                </span>
              ) : (
                <span key={w}>{w}</span>
              ),
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTemplate = () => {
    switch (template) {
      case "thumbnail":
        return renderThumbnail();
      case "lower":
        return renderLower();
      case "title":
        return renderTitle();
      case "captions":
        return renderCaptions();
      default:
        return renderReel();
    }
  };

  const exposureOverlay =
    exposure < 50
      ? `rgba(0,0,0,${(((50 - exposure) / 50) * 0.75).toFixed(3)})`
      : `rgba(255,255,255,${(((exposure - 50) / 50) * 0.7).toFixed(3)})`;

  /* ─────────────────────────────────────────────────────────
   * Render
   * ───────────────────────────────────────────────────────── */

  const selectCls =
    "w-full rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-xs font-semibold text-gray-800 cursor-pointer";

  return (
    <div className="mx-auto max-w-7xl select-none px-4 py-8 md:px-8">
      {/* Hidden SVG filters for color-vision simulation */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {(["protan", "deutan", "tritan"] as const).map((mode) => {
            const m = CVD_MATRICES[mode];
            return (
              <filter
                key={mode}
                id={`plv-${mode}`}
                colorInterpolationFilters="sRGB"
              >
                <feColorMatrix
                  type="matrix"
                  values={[
                    m[0],
                    m[1],
                    m[2],
                    0,
                    0,
                    m[3],
                    m[4],
                    m[5],
                    0,
                    0,
                    m[6],
                    m[7],
                    m[8],
                    0,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                  ].join(" ")}
                />
              </filter>
            );
          })}
        </defs>
      </svg>

      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold text-indigo-600">
            <Eye className="h-4 w-4" />
            <span>Video palette visualizer</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Test "{activePalette.name}" on real video graphics
          </h1>
          <p className="mt-0.5 max-w-2xl text-xs text-gray-500">
            Check reels, thumbnails, lower thirds, titles, and captions over
            bright and dark footage. Then check legibility, scopes, and
            color-vision safety, and copy the values straight into your editor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onOpenInContrast && (
            <button
              type="button"
              onClick={() => onOpenInContrast(activePalette)}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
              title="Check color contrast accessibility for this palette"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
              <span>Check contrast</span>
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              void copyText(
                colors.join(", "),
                `Copied ${colors.length} colors: ${colors.join(", ")}`,
              )
            }
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-800 transition-colors hover:bg-gray-50"
            title="Copy all HEX codes"
          >
            <Copy className="h-3.5 w-3.5 text-blue-600" />
            <span>Copy palette</span>
          </button>
          <button
            type="button"
            onClick={() => void handleCreateVideoBrief()}
            disabled={creatingBrief}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-1.5 font-bold text-white transition-colors hover:bg-black disabled:cursor-wait disabled:opacity-60"
            title="Create a video brief from the current preview"
          >
            <Video className="h-3.5 w-3.5" />
            <span>{creatingBrief ? "Capturing…" : "Make video brief"}</span>
          </button>
        </div>
      </div>

      {/* Palette input */}
      <div className="mb-5 rounded-3xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-bold text-gray-800">
              Paste a palette
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData("text");
                  if (pastedText && pastedText.trim()) {
                    setCustomInput(pastedText.trim());
                    setTimeout(() => parseAndApplyHexes(pastedText.trim()), 20);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") parseAndApplyHexes(customInput);
                }}
                placeholder="HEX or rgb() values, e.g. #FF5733 or #264653, #2A9D8F, #E9C46A"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 font-mono text-xs focus:outline-blue-500"
              />
              <button
                type="button"
                onClick={() => parseAndApplyHexes(customInput)}
                className="shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void handlePasteFromClipboard()}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              title="Paste directly from clipboard"
            >
              <ClipboardPaste className="h-3.5 w-3.5 text-blue-600" />
              <span>Paste from clipboard</span>
            </button>
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="cursor-pointer rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
              title="Reset to the original palette"
              aria-label="Reset to the original palette"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* LEFT: controls + stage */}
        <div className="min-w-0 space-y-4">
          <div className="space-y-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              <Field label="Graphic">
                <Segmented
                  value={template}
                  options={TEMPLATES}
                  onChange={setTemplate}
                />
              </Field>
              <Field label="Frame">
                <Segmented
                  value={aspect}
                  options={ASPECT_IDS.map((id) => ({
                    id,
                    label: id,
                    title: ASPECTS[id].hint,
                  }))}
                  onChange={setAspect}
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
              <Field label="Behind the graphics">
                <Segmented
                  value={backdrop}
                  options={BACKDROPS}
                  onChange={setBackdrop}
                />
              </Field>
              <Field label="Footage exposure">
                <div className="flex h-7 items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={exposure}
                    disabled={!footage}
                    onChange={(e) => setExposure(Number(e.target.value))}
                    className="w-32 cursor-pointer accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Footage exposure"
                    title={
                      footage
                        ? "Darken or brighten the footage behind your graphics"
                        : "Pick Day, Night, or Busy to use this"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setExposure(50)}
                    disabled={!footage || exposure === 50}
                    className="cursor-pointer text-[10px] font-semibold text-gray-500 hover:text-gray-900 disabled:cursor-default disabled:opacity-40"
                  >
                    Reset
                  </button>
                </div>
              </Field>
              <Field label="Guides">
                <Segmented
                  value={guides}
                  options={GUIDES}
                  onChange={setGuides}
                />
              </Field>
              <Field label="Viewer eyes">
                <Segmented
                  value={vision}
                  options={VISIONS}
                  onChange={setVision}
                />
              </Field>
              {template === "reel" && (
                <label className="flex h-7 cursor-pointer items-center gap-1.5 self-end text-[11px] font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={platformUI}
                    onChange={(e) => setPlatformUI(e.target.checked)}
                    className="h-3.5 w-3.5 accent-indigo-600"
                  />
                  Platform buttons
                </label>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-gray-100 p-4 sm:p-6">
            <div
              ref={boardRef}
              className="mx-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-xl"
              style={{ width: W + 26 }}
            >
              <div className="px-1 pb-2 text-[11px] font-extrabold text-gray-900">
                {tplMeta.label}, {aspect}
                <span className="font-semibold text-gray-400">
                  {" "}
                  · {roleLabel}
                </span>
              </div>

              <div
                data-cvd-target
                style={{ filter: visionFilterValue(vision) }}
              >
                <div className="mb-1 text-[10px] font-bold text-gray-500">
                  Palette roles ({colors.length} colors)
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {colors.map((hex, i) => {
                    const tag = roleTag(i);
                    return (
                      <div
                        key={`${hex}-${i}`}
                        role="button"
                        tabIndex={0}
                        title={`Copy ${hex}`}
                        onClick={() => void copyText(hex, `${hex} copied`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            void copyText(hex, `${hex} copied`);
                          }
                        }}
                        style={{
                          flex: "1 1 0",
                          minWidth: 0,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            background: hex,
                            height: 30,
                            borderRadius: 8,
                            border: "1px solid rgba(0,0,0,.12)",
                          }}
                        />
                        <div
                          style={{
                            fontFamily: MONO,
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#374151",
                            marginTop: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {hex}
                        </div>
                        <div
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            color: tag.color,
                            lineHeight: 1.2,
                          }}
                        >
                          {tag.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    display: "flex",
                    height: 6,
                    borderRadius: 3,
                    overflow: "hidden",
                    marginTop: 8,
                  }}
                >
                  <div style={{ width: "60%", background: bg }} />
                  <div style={{ width: "30%", background: card }} />
                  <div style={{ width: "10%", background: acc }} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      position: "relative",
                      width: W,
                      height: H,
                      overflow: "hidden",
                      borderRadius: 10,
                      background: bg,
                    }}
                  >
                    {renderBackdrop()}
                    {footage && exposure !== 50 && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: exposureOverlay,
                        }}
                      />
                    )}
                    {renderTemplate()}
                    {renderGuides()}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-gray-500">
              Arrow keys flip varieties, 1 to 5 switch graphic, G cycles guides.
              Guides and viewer-eyes filters are never saved into the brief.
            </p>
          </div>
        </div>

        {/* RIGHT: inspector */}
        <aside className="space-y-3 xl:sticky xl:top-4">
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-gray-100 p-1">
            {INSPECTOR_TABS.map((t) => {
              const Ic = t.icon;
              const on = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] transition-colors ${
                    on
                      ? "bg-white font-bold text-gray-900 shadow-xs"
                      : "font-semibold text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Ic className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* ROLES */}
          {tab === "roles" && (
            <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Role variety
                  </h3>
                  <button
                    type="button"
                    onClick={applySmartRoles}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    title="Assign roles from each color's brightness and saturation"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    Smart roles
                  </button>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }, (_, idx) => {
                    const on = isVariety && idx === varietyIdx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectVariety(idx)}
                        title={`Variety #${idx + 1}`}
                        style={
                          on ? { backgroundColor: acc, color: tAcc } : undefined
                        }
                        className={`h-7 cursor-pointer rounded-lg text-xs font-black transition-colors ${
                          on
                            ? "shadow-xs"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    label: "60% Dominant: backgrounds, plates",
                    value: dI,
                    set: setDominantRoleIdx,
                    hex: bg,
                  },
                  {
                    label: "30% Secondary: cards, caption boxes",
                    value: sI,
                    set: setSecondaryRoleIdx,
                    hex: card,
                  },
                  {
                    label: "10% Accent: hook words, CTAs",
                    value: aI,
                    set: setAccentRoleIdx,
                    hex: acc,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 text-[11px] font-bold text-gray-700">
                      {row.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: row.hex }}
                        className="h-7 w-7 shrink-0 rounded-lg border border-black/10"
                      />
                      <select
                        value={row.value}
                        onChange={(e) => row.set(Number(e.target.value))}
                        className={selectCls}
                      >
                        {colors.map((c, i) => (
                          <option key={i} value={i}>
                            Color {i + 1} ({c})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-1 text-[11px] font-bold text-gray-700">
                  Text color on graphics
                </div>
                <Segmented
                  value={textMode}
                  options={TEXT_MODES}
                  onChange={setTextMode}
                />
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3.5 text-[11px] leading-relaxed text-purple-900/90">
                Keep 3 to 5 colors on screen. Let the dominant color carry the
                frame, give captions the secondary, and save the accent for the
                one word you want remembered.
              </div>
              <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3.5 text-[11px] leading-relaxed text-[#7B3306]">
                 Keep captions in 1 or 2 readable neutral tones, reserving your 10% brightest accent color exclusively for key hook words and CTAs.
              </div>
            </div>
          )}

          {/* LEGIBILITY */}
          {tab === "legibility" && (
            <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">
                  Will viewers read it?
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Text needs 4.5:1 for captions. Shapes like cards and buttons
                  need 3:1.
                  {vision !== "none" &&
                    " ΔE shows how different the pair looks in the viewer-eyes mode you picked."}
                </p>
              </div>
              <div className="space-y-2">
                {legRows.map((row) => {
                  const ratio = contrast(row.fg, row.on);
                  const grade =
                    row.kind === "text" ? textGrade(ratio) : shapeGrade(ratio);
                  const de =
                    vision !== "none"
                      ? deltaE(
                          simulateVision(row.fg, vision),
                          simulateVision(row.on, vision),
                        )
                      : null;
                  return (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 p-2"
                    >
                      <div
                        style={{ backgroundColor: row.on }}
                        className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg border border-black/10"
                      >
                        {row.kind === "text" ? (
                          <span
                            style={{ color: row.fg }}
                            className="text-sm font-black"
                          >
                            Aa
                          </span>
                        ) : (
                          <span
                            style={{ backgroundColor: row.fg }}
                            className="h-4 w-6 rounded"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-bold text-gray-800">
                          {row.label}
                        </div>
                        <div className="font-mono text-[10px] text-gray-500">
                          {ratio.toFixed(2)}:1
                          {de !== null && ` · ΔE ${de.toFixed(0)}`}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${grade.cls}`}
                      >
                        {grade.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {vision !== "none" && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-[11px] text-gray-700">
                  <div className="mb-1 font-bold text-gray-900">
                    {VISIONS.find((v) => v.id === vision)?.title}
                  </div>
                  {collisions.length === 0 ? (
                    <span>
                      No palette colors collapse into each other in this mode.
                    </span>
                  ) : (
                    <ul className="space-y-1">
                      {collisions.slice(0, 5).map(([i, j, de]) => (
                        <li
                          key={`${i}-${j}`}
                          className="flex items-center gap-2"
                        >
                          <span
                            style={{ backgroundColor: colors[i] }}
                            className="h-3.5 w-3.5 rounded border border-black/10"
                          />
                          <span
                            style={{ backgroundColor: colors[j] }}
                            className="h-3.5 w-3.5 rounded border border-black/10"
                          />
                          <span>
                            Colors {i + 1} and {j + 1} look nearly the same (ΔE{" "}
                            {de.toFixed(0)}).
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                {notes.map((n) => (
                  <div
                    key={n}
                    className="rounded-xl bg-amber-50/70 px-3 py-2 text-[11px] leading-relaxed text-amber-900"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCOPES */}
          {tab === "scopes" && (
            <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">
                  Scopes for your palette
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Plotted the way Resolve and Premiere draw them (Rec. 709).
                  Numbers match the role list.
                </p>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-bold text-gray-700">
                  Vectorscope
                </div>
                <VectorScope colors={colors} />
                <p className="mt-1 text-center text-[10px] text-gray-500">
                  The dashed line is the skin-tone line. Colors sitting on it
                  can fight with skin in your footage.
                </p>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-bold text-gray-700">
                  Luma levels
                </div>
                <LumaBars colors={colors} />
                <p className="text-center text-[10px] text-gray-500">
                  Dashed lines mark legal black (16) and legal white (235).
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3 text-[11px] text-gray-700">
                Weighted 60-30-10 brightness:{" "}
                <span className="font-bold">
                  {Math.round(weighted * 100)} IRE
                </span>
                , which reads as <span className="font-bold">{lookLabel}</span>.
              </div>
              <div className="space-y-1.5">
                {colors.map((hex, i) => {
                  const flags = colorFlags(hex);
                  return (
                    <div
                      key={`${hex}-${i}`}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span
                        style={{ backgroundColor: hex }}
                        className="h-4 w-4 shrink-0 rounded border border-black/10"
                      />
                      <span className="w-4 font-bold text-gray-500">
                        {i + 1}
                      </span>
                      <span className="font-mono text-gray-700">{hex}</span>
                      {flags.length === 0 ? (
                        <span className="ml-auto font-semibold text-emerald-700">
                          Safe
                        </span>
                      ) : (
                        <span className="ml-auto text-right font-semibold text-amber-700">
                          {flags.join(", ")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HANDOFF */}
          {tab === "handoff" && (
            <div className="space-y-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-xs">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">
                  Copy into your editor
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Uses the current roles, so it matches what you see on the
                  stage.
                </p>
              </div>
              <select
                value={handoffFormat}
                onChange={(e) =>
                  setHandoffFormat(e.target.value as HandoffFormat)
                }
                className={selectCls}
                aria-label="Handoff format"
              >
                {HANDOFF_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <pre className="max-h-72 select-text overflow-auto whitespace-pre rounded-2xl bg-gray-900 p-3.5 font-mono text-[11px] leading-relaxed text-gray-100">
                {handoffText}
              </pre>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void copyText(handoffText, "Copied to clipboard")
                  }
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(gplText, `${slug(activePalette.name)}.gpl`)
                  }
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  title="GIMP palette file, also read by Krita and many editors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download .gpl
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      buildHandoff("json"),
                      `${slug(activePalette.name)}.json`,
                      "application/json",
                    )
                  }
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download .json
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-gray-400">
                HEX values describe creative direction. They are not a LUT, so
                confirm your timeline color space and display transform in your
                editing app.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};