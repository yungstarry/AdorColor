import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  Smartphone,
  Globe,
  LayoutDashboard,
  Sparkles,
  FileText,
  Layers,
  TrendingUp,
  Briefcase,
  ClipboardPaste,
  RotateCcw,
  Film,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music2,
  Sliders,
  Copy,
  SlidersHorizontal,
  Video,
} from "lucide-react";
import { Palette, PaletteColor } from "../../types";
import {
  buildPaletteColor,
  isLightColor,
  generateHarmonicColors,
  rgbToHex,
} from "../../utils/colorUtils";

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

type VisualizerTab =
  | "web"
  | "mobile"
  | "reels"
  | "dashboard"
  | "branding"
  | "poster"
  | "typography";

/**
 * Capture sharpness settings.
 * The preview is rasterized at CAPTURE_SCALE times its on-screen size (this was
 * 1.5 before, which is what made the exported brief look soft). The longest side
 * is capped so the saved image stays a reasonable size.
 * If the saved briefs get too large for your storage, lower CAPTURE_SCALE to 1.75
 * or CAPTURE_JPEG_QUALITY to 0.88.
 */
const CAPTURE_SCALE = 2.5;
const MAX_CAPTURE_SIDE = 4000;
const CAPTURE_JPEG_QUALITY = 0.93;

const captureElementAsJpeg = async (element: HTMLElement): Promise<string> => {
  const bounds = element.getBoundingClientRect();
  const width = Math.ceil(bounds.width);
  const height = Math.ceil(Math.max(bounds.height, element.scrollHeight));
  if (!width || !height)
    throw new Error("The visualizer preview is not ready to export.");

  const clone = element.cloneNode(true) as HTMLElement;
  const copyStyles = (source: Element, target: Element) => {
    const sourceStyle = getComputedStyle(source);
    const targetStyle = (target as HTMLElement).style;
    for (let index = 0; index < sourceStyle.length; index += 1) {
      const property = sourceStyle[index];
      targetStyle.setProperty(
        property,
        sourceStyle.getPropertyValue(property),
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
  const palettePanel = clone.querySelector<HTMLElement>(
    '[data-visualizer-export-panel="palette"]',
  );
  const varietyPanel = clone.querySelector<HTMLElement>(
    '[data-visualizer-export-panel="variety"]',
  );
  const phonePreview = clone.querySelector<HTMLElement>(
    '[data-visualizer-export-panel="phone"]',
  );
  if (palettePanel && varietyPanel && phonePreview) {
    const controls = document.createElement("div");
    controls.style.cssText =
      "display:flex;flex:0 0 330px;flex-direction:column;gap:12px;width:330px;";
    controls.append(palettePanel, varietyPanel);
    clone.replaceChildren(controls, phonePreview);
    clone.style.display = "flex";
    clone.style.flexDirection = "row";
    clone.style.alignItems = "center";
    clone.style.justifyContent = "center";
    clone.style.gap = "24px";
    clone.style.padding = "24px";
    clone.style.boxSizing = "border-box";
    clone.style.width = "732px";
    clone.style.height = "668px";
    clone.style.minHeight = "0";
    phonePreview.style.width = "330px";
    phonePreview.style.height = "620px";
    phonePreview.style.flex = "0 0 330px";
    phonePreview.style.margin = "0";
  } else {
    clone.style.width = `${width}px`;
    clone.style.height = `${height}px`;
  }
  clone.style.maxWidth = "none";
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  const captureWidth = parseInt(clone.style.width, 10) || width;
  const captureHeight = parseInt(clone.style.height, 10) || height;
  const scale = Math.max(
    1,
    Math.min(
      CAPTURE_SCALE,
      MAX_CAPTURE_SIDE / Math.max(captureWidth, captureHeight),
    ),
  );
  const outputWidth = Math.ceil(captureWidth * scale);
  const outputHeight = Math.ceil(captureHeight * scale);

  // The SVG is sized at the output resolution while the viewBox stays at the
  // layout size, so the browser renders the HTML at full resolution (not a
  // blurry upscaled bitmap).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${captureWidth} ${captureHeight}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(
        new Error("The visualizer preview could not be rendered for export."),
      );
  });

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", CAPTURE_JPEG_QUALITY);
};

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

export const PaletteVisualizer: React.FC<PaletteVisualizerProps> = ({
  palette: initialPalette,
  onPaletteChange,
  onOpenInContrast,
  onCreateVideoBrief,
  onToast,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [creatingBrief, setCreatingBrief] = useState(false);
  const [activeTab, setActiveTab] = useState<VisualizerTab>(() => {
    const saved = localStorage.getItem("palettelab_visualizer_tab");
    return (saved as VisualizerTab) || "reels";
  });

  const [activePalette, setActivePalette] = useState<Palette>(initialPalette);
  const lastPropFingerprintRef = useRef(getPaletteFingerprint(initialPalette));

  const [customInput, setCustomInput] = useState<string>(() => {
    return localStorage.getItem("palettelab_visualizer_custom_input") || "";
  });

  const [reelsVarietyIndex, setReelsVarietyIndex] = useState<number>(() => {
    const saved = localStorage.getItem("palettelab_reels_variety_idx");
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [dominantRoleIdx, setDominantRoleIdx] = useState<number>(() => {
    const saved = localStorage.getItem("palettelab_reels_dominant_idx");
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const [secondaryRoleIdx, setSecondaryRoleIdx] = useState<number>(() => {
    const saved = localStorage.getItem("palettelab_reels_secondary_idx");
    return saved !== null ? parseInt(saved, 10) : 1;
  });
  const [accentRoleIdx, setAccentRoleIdx] = useState<number>(() => {
    const saved = localStorage.getItem("palettelab_reels_accent_idx");
    return saved !== null ? parseInt(saved, 10) : 2;
  });

  useEffect(() => {
    localStorage.setItem("palettelab_visualizer_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("palettelab_visualizer_custom_input", customInput);
  }, [customInput]);

  useEffect(() => {
    localStorage.setItem(
      "palettelab_reels_variety_idx",
      reelsVarietyIndex.toString(),
    );
  }, [reelsVarietyIndex]);

  useEffect(() => {
    localStorage.setItem(
      "palettelab_reels_dominant_idx",
      dominantRoleIdx.toString(),
    );
  }, [dominantRoleIdx]);

  useEffect(() => {
    localStorage.setItem(
      "palettelab_reels_secondary_idx",
      secondaryRoleIdx.toString(),
    );
  }, [secondaryRoleIdx]);

  useEffect(() => {
    localStorage.setItem(
      "palettelab_reels_accent_idx",
      accentRoleIdx.toString(),
    );
  }, [accentRoleIdx]);

  useEffect(() => {
    const currentFingerprint = getPaletteFingerprint(initialPalette);
    if (
      initialPalette &&
      currentFingerprint !== lastPropFingerprintRef.current
    ) {
      lastPropFingerprintRef.current = currentFingerprint;
      setActivePalette(initialPalette);
      setDominantRoleIdx(0);
      setSecondaryRoleIdx(Math.min(1, initialPalette.colors.length - 1));
      setAccentRoleIdx(Math.min(2, initialPalette.colors.length - 1));
      setReelsVarietyIndex(0);
      setCustomInput("");
    }
  }, [initialPalette]);

  const colors = activePalette.colors.map((c) => c.hex);
  const color1 = colors[0] || "#264653";
  const color2 = colors[1] || "#2A9D8F";
  const color3 = colors[2] || "#E9C46A";
  const color4 = colors[3] || "#F4A261";

  const reelDominantColor = colors[dominantRoleIdx] || color1;
  const reelSecondaryColor = colors[secondaryRoleIdx] || color2;
  const reelAccentColor = colors[accentRoleIdx] || color3;

  const supportingIndices = colors
    .map((_, i) => i)
    .filter(
      (i) =>
        i !== dominantRoleIdx && i !== secondaryRoleIdx && i !== accentRoleIdx,
    );
  const supportingColor1 = colors[supportingIndices[0]] || reelSecondaryColor;
  const supportingColor2 =
    colors[supportingIndices[1]] ||
    colors[supportingIndices[0]] ||
    reelAccentColor;

  const extractColors = (input: string): string[] => {
    if (!input) return [];

    const found: string[] = [];

    const rgbRegex = /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
    let rgbMatch;
    while ((rgbMatch = rgbRegex.exec(input)) !== null) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      found.push(rgbToHex(r, g, b));
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

    let finalHexes: string[] = [];
    if (hexList.length === 1) {
      finalHexes = generateHarmonicColors(hexList[0], "complementary", 5);
      onToast(
        `Applied ${hexList[0]} and generated harmonic visualizer palette!`,
      );
    } else {
      finalHexes = hexList;
      onToast(`Applied ${finalHexes.length} colors to visualizer!`);
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
    localStorage.setItem(
      "palettelab_visualizer_active_palette",
      JSON.stringify(newPalette),
    );
    setDominantRoleIdx(0);
    setSecondaryRoleIdx(Math.min(1, updatedColors.length - 1));
    setAccentRoleIdx(Math.min(2, updatedColors.length - 1));
    setReelsVarietyIndex(0);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setCustomInput(text.trim());
        parseAndApplyHexes(text.trim());
      } else {
        onToast("Clipboard is empty. Copy some HEX colors first!");
      }
    } catch {
      onToast(
        "Please paste your colors directly into the input box (Ctrl+V / Cmd+V).",
      );
    }
  };

  const handleResetToOriginal = () => {
    setActivePalette(initialPalette);
    setCustomInput("");
    setDominantRoleIdx(0);
    setSecondaryRoleIdx(Math.min(1, initialPalette.colors.length - 1));
    setAccentRoleIdx(Math.min(2, initialPalette.colors.length - 1));
    setReelsVarietyIndex(0);
    localStorage.setItem(
      "palettelab_visualizer_active_palette",
      JSON.stringify(initialPalette),
    );
    onToast("Reset to original palette.");
  };

  const handleSelectVariety = (idx: number) => {
    setReelsVarietyIndex(idx);
    const [d, s, a] = getPermutationForVariety(idx, colors.length);
    setDominantRoleIdx(d);
    setSecondaryRoleIdx(s);
    setAccentRoleIdx(a);
    onToast(
      `Applied Variety #${idx + 1}: Dominant ${colors[d]} · Secondary ${colors[s]} · Accent ${colors[a]}`,
    );
  };

  const copyVideoEditingSpec = () => {
    const spec = `/* Video Reel 60-30-10 Color Scheme (Variety #${reelsVarietyIndex + 1}) */
60% Dominant (Background & Identity): ${reelDominantColor}
30% Secondary (Subtitles & Cards):     ${reelSecondaryColor}
10% Accent (Key Words & Hooks):       ${reelAccentColor}
Supporting / Additional:              ${colors.filter((_, i) => i !== dominantRoleIdx && i !== secondaryRoleIdx && i !== accentRoleIdx).join(", ") || "None"}`;
    navigator.clipboard.writeText(spec);
    onToast(
      `Copied Variety #${reelsVarietyIndex + 1} 60-30-10 color spec to clipboard!`,
    );
  };

  const handleCreateVideoBrief = async () => {
    const preview =
      activeTab === "reels"
        ? previewRef.current?.querySelector<HTMLElement>(
            '[data-visualizer-export-column="primary"]',
          )
        : previewRef.current;
    if (!preview || creatingBrief) return;
    setCreatingBrief(true);
    try {
      const visualizerImage = await captureElementAsJpeg(preview);
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

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 select-none">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Eye className="w-4 h-4" />
            <span>Interactive Visualizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Preview "{activePalette.name}" in Real Designs
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Test how this color scheme performs on Video Reels, web, mobile,
            SaaS, and graphic media.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto text-xs font-semibold text-gray-600 no-scrollbar">
          {[
            { id: "reels", label: "Video Reels (60-30-10)", icon: Film },
            { id: "web", label: "Web Landing", icon: Globe },
            { id: "mobile", label: "Mobile App", icon: Smartphone },
            { id: "dashboard", label: "SaaS Dashboard", icon: LayoutDashboard },
            { id: "branding", label: "Brand Kit", icon: Briefcase },
            { id: "poster", label: "Poster", icon: Layers },
            { id: "typography", label: "Typography", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as VisualizerTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "hover:text-gray-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
              Input or Paste Copied Palette
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
                  if (e.key === "Enter") {
                    parseAndApplyHexes(customInput);
                  }
                }}
                placeholder="Paste HEX code(s) here (e.g. #FF5733 or #264653, #2A9D8F, #E9C46A)..."
                className="flex-1 font-mono text-xs px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-blue-500 bg-gray-50/50"
              />
              <button
                onClick={() => parseAndApplyHexes(customInput)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Apply Palette
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-4 sm:pt-0">
            <button
              onClick={handlePasteFromClipboard}
              className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Paste directly from clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
              <span>Paste from Clipboard</span>
            </button>

            <button
              onClick={handleResetToOriginal}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              title="Reset to default palette"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500 font-semibold px-0.5">
          <span>
            Active Palette ({colors.length} Colors) · Click any color to copy
            individual HEX
          </span>
          <div className="flex items-center gap-2">
            {onOpenInContrast && (
              <button
                onClick={() => onOpenInContrast(activePalette)}
                className="self-start sm:self-auto px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Check color contrast accessibility for this palette"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                <span>Check Contrast</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleCreateVideoBrief()}
              disabled={creatingBrief}
              className="self-start sm:self-auto px-3 py-1 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-gray-700 hover:text-indigo-700 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
              title="Create a video brief with the current visualizer preview"
            >
              <Video className="w-3.5 h-3.5 text-indigo-600" />
              <span>{creatingBrief ? "Capturing…" : "Make Video Brief"}</span>
            </button>
            <button
              onClick={() => {
                const hexList = colors.join(", ");
                navigator.clipboard.writeText(hexList);
                onToast(
                  `Copied entire palette (${colors.length} colors): ${hexList}`,
                );
              }}
              className="self-start sm:self-auto px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Copy all HEX codes"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>Copy Palette</span>
            </button>
          </div>
        </div>

        <div className="flex rounded-xl overflow-hidden h-7 shadow-2xs border border-gray-200">
          {colors.map((hex, i) => (
            <div
              key={i}
              style={{ backgroundColor: hex }}
              className="flex-1 h-full cursor-pointer hover:flex-[1.4] transition-all flex items-center justify-center"
              title={`${hex} - click to copy`}
              onClick={() => {
                navigator.clipboard.writeText(hex);
                onToast(`${hex} copied!`);
              }}
            />
          ))}
        </div>
      </div>

      <div
        ref={previewRef}
        className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden min-h-[500px]"
      >
        {/* REELS TAB */}
        {activeTab === "reels" && (
          <div className="p-6 sm:p-10 bg-gray-50/70">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div
                data-visualizer-export-column="primary"
                className="lg:col-span-5 flex flex-col items-center"
              >
                <div
                  data-visualizer-export-panel="palette"
                  className="w-full max-w-[330px] mb-3 bg-white px-3 py-2.5 rounded-2xl border border-gray-200/90 shadow-2xs select-none"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-gray-900">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Reel Palette &amp; Role Tags</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const hexList = colors.join(", ");
                          navigator.clipboard.writeText(hexList);
                          onToast(`Copied palette: ${hexList}`);
                        }}
                        className="text-[9px] font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer hover:underline"
                        title="Copy all palette hex codes"
                      >
                        <Copy className="w-2.5 h-2.5 text-blue-600" />
                        <span>Copy Palette</span>
                      </button>
                      <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-md">
                        60–30–10 Rule
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-1.5 overflow-x-auto no-scrollbar pt-1">
                    {colors.map((hex, idx) => {
                      const isDominant = idx === dominantRoleIdx;
                      const isSecondary = idx === secondaryRoleIdx;
                      const isAccent = idx === accentRoleIdx;

                      let tagTitle = "Supporting";
                      let tagSub = "";
                      let tagBg = "bg-gray-50 text-gray-600 border-gray-200";
                      let arrowColor = "text-gray-300";

                      if (isDominant) {
                        tagTitle = "Dominant";
                        tagSub = "(60%)";
                        tagBg =
                          "bg-blue-50 text-blue-800 border-blue-200 font-extrabold";
                        arrowColor = "text-blue-500";
                      } else if (isSecondary) {
                        tagTitle = "Secondary";
                        tagSub = "(30%)";
                        tagBg =
                          "bg-indigo-50 text-indigo-800 border-indigo-200 font-extrabold";
                        arrowColor = "text-indigo-500";
                      } else if (isAccent) {
                        tagTitle = "Accent";
                        tagSub = "(10%)";
                        tagBg =
                          "bg-amber-50 text-amber-900 border-amber-300 font-black";
                        arrowColor = "text-amber-500";
                      } else {
                        const suppPos = supportingIndices.indexOf(idx);
                        if (suppPos === 0) {
                          tagTitle =
                            colors.length > 4 ? "Supporting 1" : "Supporting";
                          tagSub = "(Details)";
                          tagBg =
                            "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold";
                          arrowColor = "text-emerald-500";
                        } else if (suppPos === 1) {
                          tagTitle = "Supporting 2";
                          tagSub = "(Details)";
                          tagBg =
                            "bg-purple-50 text-purple-800 border-purple-200 font-bold";
                          arrowColor = "text-purple-500";
                        } else {
                          tagTitle = `Supporting ${suppPos + 1}`;
                          tagSub = "(Details)";
                          tagBg =
                            "bg-teal-50 text-teal-800 border-teal-200 font-bold";
                          arrowColor = "text-teal-500";
                        }
                      }

                      return (
                        <div
                          key={idx}
                          className="flex-1 min-w-[56px] flex flex-col items-center text-center"
                        >
                          <span
                            style={{ backgroundColor: hex }}
                            className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs cursor-pointer hover:scale-110 transition-transform shrink-0"
                            title={`Click to copy ${hex}`}
                            onClick={() => {
                              navigator.clipboard.writeText(hex);
                              onToast(`${hex} copied!`);
                            }}
                          />
                          <span className="font-mono text-[9px] font-bold text-gray-700 tracking-tighter truncate max-w-full mt-1">
                            {hex}
                          </span>
                          <svg
                            className={`w-3.5 h-3 my-0.5 ${arrowColor}`}
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M 7 1 Q 10 7 7 11" />
                            <polyline points="4 8 7 11 10 8" />
                          </svg>
                          <span
                            className={`text-[8.5px] px-1 py-0.5 rounded-md border flex flex-col items-center justify-center leading-tight w-full ${tagBg}`}
                          >
                            <span>{tagTitle}</span>
                            {tagSub && (
                              <span className="opacity-80 text-[7.5px]">
                                {tagSub}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  data-visualizer-export-panel="variety"
                  className="w-full max-w-[330px] mb-3 flex items-center justify-between gap-1 p-1 bg-white rounded-xl border border-gray-200/90 shadow-2xs select-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const idx = num - 1;
                    const isActive = idx === reelsVarietyIndex;
                    return (
                      <button
                        key={num}
                        onClick={() => handleSelectVariety(idx)}
                        style={
                          isActive
                            ? {
                                backgroundColor: reelAccentColor,
                                color: isLightColor(reelAccentColor)
                                  ? "#111827"
                                  : "#FFFFFF",
                              }
                            : undefined
                        }
                        className={`flex-1 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                          isActive
                            ? "shadow-xs scale-105"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        title={`Variety #${num}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <div
                  data-visualizer-export-panel="phone"
                  className="w-[310px] sm:w-[330px] h-[620px] rounded-[42px] bg-black p-3 shadow-2xl border-4 border-gray-900 flex flex-col relative select-none"
                >
                  <div
                    style={{ backgroundColor: reelDominantColor }}
                    className="w-full h-full rounded-[32px] overflow-hidden flex flex-col justify-between p-4 relative transition-colors duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 pointer-events-none" />

                    <div className="absolute left-4 top-3 text-[9px] font-mono font-bold text-white/50 tracking-wider uppercase pointer-events-none z-10">
                      60% Dominant Canvas
                    </div>

                    <div className="relative z-10 space-y-4 pt-2">
                      <div className="flex items-center justify-between text-white/90 text-[11px] font-semibold px-1">
                        <span
                          style={{
                            backgroundColor: `${supportingColor1}E6`,
                            color: isLightColor(supportingColor1)
                              ? "#111827"
                              : "#FFFFFF",
                          }}
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs border border-white/20"
                        >
                          <Film className="w-3 h-3" />
                          <span>
                            Reels ·{" "}
                            {colors.length > 3 ? "Supporting 1" : "60-30-10"}
                          </span>
                        </span>
                        <span className="opacity-80 font-mono text-[10px]">
                          Variety #{reelsVarietyIndex + 1}/10
                        </span>
                      </div>

                      <div className="bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shadow-lg text-center space-y-1.5">
                        <div className="flex items-center justify-center">
                          <span
                            style={{
                              backgroundColor: supportingColor2,
                              color: isLightColor(supportingColor2)
                                ? "#111827"
                                : "#FFFFFF",
                            }}
                            className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md inline-block shadow-2xs"
                          >
                            {colors.length > 4
                              ? "Supporting 2 · Hook Sticker"
                              : "Viral Hook"}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                          Stop picking{" "}
                          <span
                            style={{
                              backgroundColor: reelAccentColor,
                              color: isLightColor(reelAccentColor)
                                ? "#111827"
                                : "#FFFFFF",
                            }}
                            className="px-1.5 py-0.5 rounded-md inline-block shadow-xs"
                          >
                            RANDOM COLORS
                          </span>{" "}
                          for your reels
                        </h3>
                      </div>
                    </div>

                    <div className="relative z-10 my-auto text-center space-y-2">
                      <div
                        style={{
                          backgroundColor: `${reelSecondaryColor}F2`,
                          color: isLightColor(reelSecondaryColor)
                            ? "#111827"
                            : "#FFFFFF",
                        }}
                        className="inline-block px-4 py-2.5 rounded-2xl shadow-xl max-w-[90%] border border-white/10 font-extrabold text-xs sm:text-sm tracking-tight leading-snug"
                      >
                        <span className="block text-[8px] uppercase tracking-widest font-black opacity-70 mb-0.5">
                          30% Secondary Card
                        </span>
                        "The{" "}
                        <span
                          style={{
                            color: reelAccentColor,
                            textDecoration: "underline",
                            textDecorationColor: reelAccentColor,
                          }}
                          className="font-black"
                        >
                          60–30–10 rule
                        </span>{" "}
                        guarantees maximum brand retention."
                      </div>
                      <div className="flex justify-center items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      </div>
                    </div>

                    <div className="absolute right-3.5 bottom-24 flex flex-col items-center gap-3 text-white z-10">
                      <div className="flex flex-col items-center">
                        <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer">
                          <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                        </div>
                        <span className="text-[10px] font-bold mt-0.5">
                          148.2k
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold mt-0.5">
                          2,104
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold mt-0.5">
                          Share
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div
                          style={{
                            backgroundColor: `${supportingColor2}E6`,
                            color: isLightColor(supportingColor2)
                              ? "#111827"
                              : "#FFFFFF",
                          }}
                          className="p-2.5 rounded-full backdrop-blur-md hover:scale-110 transition-transform cursor-pointer border border-white/20 shadow-xs"
                          title="Bookmark in Supporting 2 tone"
                        >
                          <Bookmark className="w-5 h-5 fill-current" />
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            backgroundColor: reelSecondaryColor,
                            color: isLightColor(reelSecondaryColor)
                              ? "#111827"
                              : "#FFFFFF",
                          }}
                          className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold shadow-xs"
                        >
                          PL
                        </div>
                        <span className="font-extrabold text-xs text-white drop-shadow-xs">
                          @palettelab.video
                        </span>
                        <button
                          style={{
                            backgroundColor: reelAccentColor,
                            color: isLightColor(reelAccentColor)
                              ? "#111827"
                              : "#FFFFFF",
                          }}
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold shadow-sm hover:opacity-90 transition-opacity"
                        >
                          Follow
                        </button>
                      </div>

                      <p className="text-[11px] text-white/90 line-clamp-1 leading-tight">
                        How to color grade short-form videos with 60-30-10 brand
                        consistency. #editing
                      </p>

                      <div
                        style={{
                          backgroundColor: `${supportingColor1}E6`,
                          color: isLightColor(supportingColor1)
                            ? "#111827"
                            : "#FFFFFF",
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-white/10 shadow-2xs max-w-full"
                      >
                        <Music2 className="w-3 h-3 shrink-0 animate-pulse" />
                        <span className="truncate">
                          Original Sound · Trending Audio
                        </span>
                      </div>

                      <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden mt-1">
                        <div
                          style={{ backgroundColor: reelAccentColor }}
                          className="h-full w-3/5 rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">
                        The 60–30–10 Reel Color Distribution
                      </h3>
                      <p className="text-xs text-gray-500">
                        Industry-standard hierarchy for high-retention video
                        content
                      </p>
                    </div>
                    <button
                      onClick={copyVideoEditingSpec}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-600" />
                      <span>Copy Spec</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-10 w-full flex rounded-2xl overflow-hidden border border-gray-200 shadow-2xs">
                      <div
                        style={{ backgroundColor: reelDominantColor }}
                        className="w-[60%] h-full flex items-center justify-center px-2 cursor-pointer transition-colors"
                        title={`60% Dominant: ${reelDominantColor}`}
                      >
                        <span
                          className={`font-mono text-xs font-extrabold ${
                            isLightColor(reelDominantColor)
                              ? "text-gray-900"
                              : "text-white"
                          }`}
                        >
                          60% Dominant ({reelDominantColor})
                        </span>
                      </div>

                      <div
                        style={{ backgroundColor: reelSecondaryColor }}
                        className="w-[30%] h-full flex items-center justify-center px-2 cursor-pointer transition-colors"
                        title={`30% Secondary: ${reelSecondaryColor}`}
                      >
                        <span
                          className={`font-mono text-xs font-extrabold ${
                            isLightColor(reelSecondaryColor)
                              ? "text-gray-900"
                              : "text-white"
                          }`}
                        >
                          30% ({reelSecondaryColor})
                        </span>
                      </div>

                      <div
                        style={{ backgroundColor: reelAccentColor }}
                        className="w-[10%] h-full flex items-center justify-center px-1 cursor-pointer transition-colors"
                        title={`10% Accent: ${reelAccentColor}`}
                      >
                        <span
                          className={`font-mono text-[10px] font-extrabold ${
                            isLightColor(reelAccentColor)
                              ? "text-gray-900"
                              : "text-white"
                          }`}
                        >
                          10%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 font-semibold px-1">
                      <span>Background &amp; Brand</span>
                      <span>Captions &amp; Cards</span>
                      <span>Hooks &amp; Highlights</span>
                    </div>
                  </div>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        60% Dominant
                      </div>
                      <div className="text-xs font-bold text-gray-900 mb-2">
                        Background / Canvas
                      </div>
                      <select
                        value={dominantRoleIdx}
                        onChange={(e) =>
                          setDominantRoleIdx(Number(e.target.value))
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold cursor-pointer"
                      >
                        {colors.map((c, i) => (
                          <option key={i} value={i}>
                            Color {i + 1} ({c})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        30% Secondary
                      </div>
                      <div className="text-xs font-bold text-gray-900 mb-2">
                        Captions &amp; Subtitles
                      </div>
                      <select
                        value={secondaryRoleIdx}
                        onChange={(e) =>
                          setSecondaryRoleIdx(Number(e.target.value))
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold cursor-pointer"
                      >
                        {colors.map((c, i) => (
                          <option key={i} value={i}>
                            Color {i + 1} ({c})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        10% Accent
                      </div>
                      <div className="text-xs font-bold text-gray-900 mb-2">
                        Hook Words &amp; Highlights
                      </div>
                      <select
                        value={accentRoleIdx}
                        onChange={(e) =>
                          setAccentRoleIdx(Number(e.target.value))
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold cursor-pointer"
                      >
                        {colors.map((c, i) => (
                          <option key={i} value={i}>
                            Color {i + 1} ({c})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-purple-600" />
                    <span>Reel Design Rules for Content Creators</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                      <div className="font-bold text-purple-900">
                        3–5 Colours per Reel
                      </div>
                      <p className="text-purple-800/80 leading-relaxed text-[11px]">
                        Keep 2–3 dominant colors doing most visual work. Avoid
                        introducing a new color on every screen cut to maintain
                        visual professionalism.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
                      <div className="font-bold text-amber-900">
                        Reserve Bright Accent for Emphasis
                      </div>
                      <p className="text-amber-800/80 leading-relaxed text-[11px]">
                        Keep captions in 1 or 2 readable neutral tones,
                        reserving your 10% brightest accent color exclusively
                        for key hook words and CTAs.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-gray-400 font-medium">
                      Compatible with CapCut, Premiere Pro, DaVinci Resolve
                      &amp; FCP
                    </span>
                    <button
                      onClick={copyVideoEditingSpec}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Hex Codes for Video Editor</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEB TAB */}
        {activeTab === "web" && (
          <div
            className="w-full flex flex-col font-sans"
            style={{ backgroundColor: "#FAFAFA" }}
          >
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 max-w-sm mx-auto bg-white px-3 py-0.5 rounded-md text-[10px] text-gray-400 text-center font-mono">
                https://yourbrand.io
              </div>
            </div>

            <header
              style={{ backgroundColor: color1 }}
              className="px-8 py-4 flex items-center justify-between text-white"
            >
              <div className="font-extrabold text-lg flex items-center gap-2">
                <span
                  style={{ backgroundColor: color2 }}
                  className="w-3.5 h-3.5 rounded-sm inline-block"
                />
                <span className="tracking-tight">PALETTELAB</span>
              </div>
              <nav className="flex items-center gap-6 text-xs font-medium opacity-90">
                <span className="hover:opacity-100 cursor-pointer">
                  Product
                </span>
                <span className="hover:opacity-100 cursor-pointer">
                  Showcase
                </span>
                <span className="hover:opacity-100 cursor-pointer">
                  Changelog
                </span>
                <button
                  style={{ backgroundColor: color3, color: color1 }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-transform hover:scale-105"
                >
                  Get Started
                </button>
              </nav>
            </header>

            <div className="px-8 py-16 text-center max-w-3xl mx-auto space-y-5">
              <div
                style={{ backgroundColor: `${color2}20`, color: color2 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Generation Spatial Design</span>
              </div>

              <h2
                style={{ color: color1 }}
                className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight"
              >
                Build intuitive products with harmonious color systems.
              </h2>

              <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
                Connect your engineering pipeline directly to validated WCAG
                accessible design tokens. Deploy faster with real brand
                resonance.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  style={{ backgroundColor: color2 }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 transition-opacity"
                >
                  Explore Showcase
                </button>
                <button
                  style={{ borderColor: color1, color: color1 }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold border hover:bg-gray-50 transition-colors"
                >
                  Documentation
                </button>
              </div>
            </div>

            <div className="px-8 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              {[
                { title: "Color Synchrony", color: color2 },
                { title: "Design Token Exporter", color: color3 },
                { title: "Accessibility Audits", color: color4 },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3"
                >
                  <div
                    style={{
                      backgroundColor: `${card.color}25`,
                      color: card.color,
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                  >
                    0{idx + 1}
                  </div>
                  <h4 style={{ color: color1 }} className="font-bold text-sm">
                    {card.title}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Automatically convert multi-palette specs into CSS
                    variables, Tailwind tokens, and Figma libraries.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOBILE TAB */}
        {activeTab === "mobile" && (
          <div className="py-12 flex justify-center bg-gray-50">
            <div className="w-[320px] h-[640px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col">
              <div
                style={{ backgroundColor: "#FFFFFF" }}
                className="w-full h-full rounded-[34px] overflow-hidden flex flex-col text-gray-900 relative"
              >
                <div className="w-28 h-5 bg-slate-900 rounded-b-xl mx-auto mb-2" />

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: color2 }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        >
                          PL
                        </div>
                        <span
                          style={{ color: color1 }}
                          className="font-bold text-sm"
                        >
                          Workspace
                        </span>
                      </div>
                      <span
                        style={{
                          backgroundColor: `${color3}30`,
                          color: color1,
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      >
                        APP
                      </span>
                    </div>

                    <div
                      style={{ backgroundColor: color1, color: "#FFFFFF" }}
                      className="p-4 rounded-2xl mb-4 shadow-md"
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-75">
                        Active Palette Preview
                      </span>
                      <h4 className="text-lg font-bold mt-1">
                        {activePalette.name}
                      </h4>
                      <div className="mt-3 flex items-center gap-1.5">
                        <div
                          style={{ backgroundColor: color2 }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white"
                        >
                          {colors.length} Tokens
                        </div>
                        <div
                          style={{ backgroundColor: color4 }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white"
                        >
                          WCAG Verified
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Color Variations
                      </div>
                      {colors.slice(1, 5).map((c, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              style={{ backgroundColor: c }}
                              className="w-4 h-4 rounded-md shadow-2xs"
                            />
                            <span className="text-xs font-bold text-gray-800">
                              Accent {i + 1}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-400">
                            {c}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    style={{ backgroundColor: color2 }}
                    className="w-full py-3 rounded-xl text-xs font-bold text-white shadow-md"
                  >
                    Apply Theme
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="p-8 bg-gray-50 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 style={{ color: color1 }} className="text-xl font-bold">
                  Analytics &amp; Usage Overview
                </h3>
                <p className="text-xs text-gray-500">
                  Live token telemetry for PaletteLab
                </p>
              </div>
              <button
                style={{ backgroundColor: color2 }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
              >
                + Create Report
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  title: "Total Palettes",
                  val: "14,892",
                  change: "+24.5%",
                  color: color2,
                },
                {
                  title: "Contrast Score",
                  val: "99.4%",
                  change: "+3.1%",
                  color: color3,
                },
                {
                  title: "Brand Consistency",
                  val: "98.8%",
                  change: "+12.0%",
                  color: color4,
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>{m.title}</span>
                    <span
                      style={{ color: m.color }}
                      className="font-bold flex items-center gap-0.5"
                    >
                      <TrendingUp className="w-3 h-3" />
                      {m.change}
                    </span>
                  </div>
                  <div
                    style={{ color: color1 }}
                    className="text-2xl font-extrabold mt-2"
                  >
                    {m.val}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                Color Distribution Frequency
              </div>
              <div className="h-40 flex items-end gap-3 pt-4 border-b border-gray-100">
                {[65, 85, 45, 95, 70, 55, 80, 60, 90, 75].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <div
                      style={{
                        height: `${h}%`,
                        backgroundColor: colors[idx % colors.length],
                      }}
                      className="w-full rounded-t-lg transition-all hover:opacity-90"
                    />
                    <span className="text-[9px] text-gray-400 font-mono">
                      W{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BRANDING TAB */}
        {activeTab === "branding" && (
          <div className="p-12 bg-gray-100 flex flex-wrap items-center justify-center gap-8">
            <div
              style={{ backgroundColor: color1, color: "#FFFFFF" }}
              className="w-80 h-48 rounded-2xl p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <span
                  style={{ backgroundColor: color3 }}
                  className="w-6 h-6 rounded-lg block shadow-xs"
                />
                <span className="text-[10px] font-mono opacity-60">
                  STUDIO CORP
                </span>
              </div>
              <div>
                <h4 className="text-lg font-bold tracking-tight">
                  Evelyn Vance
                </h4>
                <p style={{ color: color2 }} className="text-xs font-medium">
                  Principal Design Architect
                </p>
                <p className="text-[10px] opacity-70 mt-2 font-mono">
                  evelyn@palettelab.io
                </p>
              </div>
            </div>

            <div
              style={{ backgroundColor: color2, color: color1 }}
              className="w-80 h-48 rounded-2xl p-6 shadow-2xl flex items-center justify-center text-center relative overflow-hidden"
            >
              <div
                style={{ backgroundColor: color3 }}
                className="w-36 h-36 rounded-full absolute -right-10 -bottom-10 opacity-30"
              />
              <span className="text-2xl font-extrabold tracking-widest text-white drop-shadow-xs">
                PALETTELAB
              </span>
            </div>
          </div>
        )}

        {/* POSTER TAB */}
        {activeTab === "poster" && (
          <div className="p-12 bg-gray-100 flex justify-center">
            <div
              style={{ backgroundColor: color1 }}
              className="w-[360px] h-[520px] rounded-3xl p-8 shadow-2xl text-white flex flex-col justify-between relative overflow-hidden"
            >
              <div
                style={{ backgroundColor: color2 }}
                className="w-56 h-56 rounded-full absolute -top-12 -right-12 opacity-80"
              />
              <div
                style={{ backgroundColor: color3 }}
                className="w-40 h-40 rounded-full absolute bottom-20 -left-12 opacity-70"
              />

              <div className="relative z-10">
                <span className="text-[10px] uppercase font-mono tracking-widest opacity-80">
                  EXHIBITION 2026
                </span>
                <h2 className="text-4xl font-black uppercase tracking-tight mt-2 leading-none">
                  CHROMATIC SPECTRUM
                </h2>
              </div>

              <div className="relative z-10 space-y-4">
                <p className="text-xs opacity-90 leading-relaxed font-medium">
                  A celebration of light, psychology, and generative digital
                  geometry.
                </p>
                <div className="flex gap-2">
                  {colors.map((c, i) => (
                    <span
                      key={i}
                      style={{ backgroundColor: c }}
                      className="w-5 h-5 rounded-full border border-white/20"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TYPOGRAPHY TAB */}
        {activeTab === "typography" && (
          <div className="p-8 sm:p-12 space-y-8 max-w-4xl mx-auto">
            <div>
              <span
                style={{ color: color2 }}
                className="text-xs font-mono font-bold uppercase tracking-widest"
              >
                Display Specimen
              </span>
              <h1
                style={{ color: color1 }}
                className="text-4xl sm:text-6xl font-extrabold mt-2"
              >
                Pure Chromatic Hierarchy.
              </h1>
            </div>

            <p
              style={{ color: color1 }}
              className="text-lg leading-relaxed font-medium opacity-90"
            >
              Good color palettes don’t just decorate: they build reading
              cadence, draw attention to critical affordances, and reduce
              cognitive friction.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                style={{ backgroundColor: `${color2}15`, borderColor: color2 }}
                className="p-5 rounded-2xl border"
              >
                <h4
                  style={{ color: color2 }}
                  className="font-bold text-sm mb-1"
                >
                  Primary Notification
                </h4>
                <p className="text-xs text-gray-600">
                  Subtle tint backgrounds maintain WCAG compliance while
                  providing delightful feedback.
                </p>
              </div>

              <div
                style={{ backgroundColor: `${color3}20`, borderColor: color3 }}
                className="p-5 rounded-2xl border"
              >
                <h4
                  style={{ color: color1 }}
                  className="font-bold text-sm mb-1"
                >
                  Secondary Alert
                </h4>
                <p className="text-xs text-gray-600">
                  Contrast ratio verified against both dark and light
                  surrounding containers.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
