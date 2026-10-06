import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  ClipboardPaste,
  Download,
  FilePlus2,
  FileText,
  MessageSquare,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import type {
  VideoBriefExportSections,
  VideoBriefStatus,
  VideoColorBrief,
  VideoColorRole,
} from "../../types";

interface VideoBriefStudioProps {
  briefs: VideoColorBrief[];
  activeBriefId: string | null;
  onSelectBrief: (briefId: string) => void;
  onDeleteBrief: (briefId: string) => void;
  onUpdateBrief: (brief: VideoColorBrief) => void;
  onCreateRevision: (brief: VideoColorBrief) => void;
  onOpenExplore: () => void;
  onToast: (message: string) => void;
}

const STATUS_LABELS: Record<VideoBriefStatus, string> = {
  draft: "Draft",
  "in-review": "In review",
  "changes-requested": "Changes requested",
  approved: "Approved",
};

const STATUS_STYLES: Record<VideoBriefStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  "in-review": "bg-blue-50 text-blue-700",
  "changes-requested": "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-700",
};

const DELIVERY_LABELS: Record<VideoColorBrief["deliveryFormat"], string> = {
  rec709: "Rec. 709 SDR",
  "rec2020-hlg": "Rec. 2020 HLG (HDR)",
  "rec2020-pq": "Rec. 2020 PQ (HDR)",
  "not-specified": "Not specified",
};

const DEFAULT_EXPORT_SECTIONS: VideoBriefExportSections = {
  briefDetails: true,
  paletteDirection: true,
  visualizerPreview: true,
  referenceFrame: true,
  colorRoles: false,
  notes: true,
  editorHandoff: true,
  approvalDetails: true,
};

const EXPORT_SECTION_OPTIONS: Array<{
  key: keyof VideoBriefExportSections;
  label: string;
}> = [
  { key: "briefDetails", label: "Brief details" },
  { key: "paletteDirection", label: "Palette direction" },
  { key: "visualizerPreview", label: "Visualizer preview" },
  { key: "referenceFrame", label: "Reference frame" },
  { key: "colorRoles", label: "Color roles & usage" },
  { key: "notes", label: "Creative notes & feedback" },
  { key: "editorHandoff", label: "Editor handoff" },
  { key: "approvalDetails", label: "Approval & updated details" },
];

/**
 * Export sharpness settings.
 *
 * The normal multi-section brief is laid out at 1600 CSS-style pixels wide,
 * then rendered at EXPORT_SCALE times that size.
 *
 * Single-section exports are also rendered at high resolution, but their
 * dimensions are calculated from the selected section instead of inheriting
 * the full brief width.
 */
const EXPORT_SCALE = 2;
const MAX_EXPORT_PIXELS = 36_000_000;
const MAX_EXPORT_SIDE = 16_000;

const isSvgDataUrl = (source: string) => /^data:image\/svg\+xml/i.test(source);

const getExportSections = (
  brief: VideoColorBrief,
): VideoBriefExportSections => ({
  ...DEFAULT_EXPORT_SECTIONS,
  ...brief.exportSections,
});

const safeFileName = (brief: VideoColorBrief, extension: "pdf" | "png") =>
  `${brief.projectName || brief.title}-color-brief-v${brief.revision}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") + `.${extension}`;

const downloadFile = (file: Blob, filename: string) => {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const wrapCanvasText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const lines: string[] = [];

  text.split(/\r?\n/).forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      return;
    }

    let line = "";

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;

      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    lines.push(line);
  });

  return lines;
};

const loadImage = (
  source: string,
  description = "image",
): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () =>
      reject(new Error(`The ${description} could not be loaded for export.`));

    if (/^https?:\/\//i.test(source)) {
      image.crossOrigin = "anonymous";
    }

    image.src = source;
  });

const prepareReferenceImage = async (file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose or paste an image file.");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Reference images must be 15 MB or smaller.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl, "reference image");

    const maxDimension = 1800;

    const scale = Math.min(
      1,
      maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
    );

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));

    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is unavailable in this browser.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.84);

    if (dataUrl.length > 1_800_000) {
      throw new Error(
        "This reference image is still too large to save. Try a smaller image.",
      );
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

/**
 * Only used for OLD saved briefs whose preview is a tall JPEG from the earlier
 * layout.
 *
 * New SVG snapshots are returned untouched so they are never unnecessarily
 * rasterized and therefore stay sharp.
 */
const normalizeVisualizerPreview = async (source: string): Promise<string> => {
  if (isSvgDataUrl(source)) {
    return source;
  }

  const image = await loadImage(source, "visualizer preview");

  if (image.naturalHeight <= image.naturalWidth) {
    return source;
  }

  const scale = 1.5;
  const layoutWidth = 732;
  const layoutHeight = 668;

  const phoneWidth = image.naturalWidth * 0.825;
  const phoneHeight = phoneWidth * (620 / 330);

  const controlsHeight = image.naturalHeight - phoneHeight;

  if (controlsHeight <= 0 || phoneHeight <= 0) {
    return source;
  }

  const canvas = document.createElement("canvas");

  canvas.width = layoutWidth * scale;
  canvas.height = layoutHeight * scale;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 24;
  const columnWidth = 330;

  const controlsHeightOnCanvas =
    controlsHeight * (columnWidth / image.naturalWidth);

  context.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    controlsHeight,
    padding * scale,
    ((layoutHeight - controlsHeightOnCanvas) / 2) * scale,
    columnWidth * scale,
    controlsHeightOnCanvas * scale,
  );

  context.drawImage(
    image,
    (image.naturalWidth - phoneWidth) / 2,
    controlsHeight,
    phoneWidth,
    phoneHeight,
    (padding + columnWidth + 24) * scale,
    padding * scale,
    columnWidth * scale,
    620 * scale,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
};

/**
 * Creates the export canvas.
 *
 * Important behavior:
 *
 * - Multiple selected sections use the normal 1600px-wide brief layout.
 * - A single selected section gets its own content-sized export.
 * - Therefore, unselected sections cannot contribute width, height, margins,
 *   or spacing to a single-section export.
 */
const createBriefCanvas = async (
  brief: VideoColorBrief,
): Promise<HTMLCanvasElement> => {
  const sections = getExportSections(brief);

  const selectedSectionKeys = EXPORT_SECTION_OPTIONS.filter(
    ({ key }) => sections[key],
  ).map(({ key }) => key);

  if (selectedSectionKeys.length === 0) {
    throw new Error("Select at least one section to include in the export.");
  }

  /*
   * Load the visualizer only when it is actually selected.
   */
  const visualizerSource =
    sections.visualizerPreview && brief.visualizerImageDataUrl
      ? await normalizeVisualizerPreview(brief.visualizerImageDataUrl)
      : null;

  const visualizerImage = visualizerSource
    ? await loadImage(visualizerSource, "visualizer preview")
    : null;

  /*
   * Load the reference only when it is actually selected.
   */
  const referenceImage =
    sections.referenceFrame && brief.referenceFrameUrl
      ? await loadImage(brief.referenceFrameUrl, "reference frame")
      : null;

  /*
   * ---------------------------------------------------------------
   * SINGLE-SECTION EXPORT
   * ---------------------------------------------------------------
   *
   * This is the important fix.
   *
   * When only one section is selected, that section determines the
   * export dimensions.
   */
  if (selectedSectionKeys.length === 1) {
    const selectedKey = selectedSectionKeys[0];

    /*
     * Visualizer-only export.
     *
     * We retain the visualizer card styling, but the card is sized
     * around the actual visualizer rather than the 1600px brief.
     */
    if (selectedKey === "visualizerPreview" && visualizerImage) {
      const padding = 40;
      const headingHeight = 72;

      const maxContentWidth = 1600;
      const maxContentHeight = 1400;

      const imageScale = Math.min(
        maxContentWidth / visualizerImage.naturalWidth,
        maxContentHeight / visualizerImage.naturalHeight,
        1,
      );

      const imageWidth = visualizerImage.naturalWidth * imageScale;

      const imageHeight = visualizerImage.naturalHeight * imageScale;

      const width = imageWidth + padding * 2;

      const height = headingHeight + imageHeight + padding * 2;

      const scale = Math.max(
        1,
        Math.min(
          EXPORT_SCALE,
          Math.sqrt(MAX_EXPORT_PIXELS / (width * height)),
          MAX_EXPORT_SIDE / Math.max(width, height),
        ),
      );

      const canvas = document.createElement("canvas");

      canvas.width = Math.round(width * scale);

      canvas.height = Math.round(height * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas is unavailable in this browser.");
      }

      context.scale(scale, scale);

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.fillStyle = "#f4f5fb";
      context.fillRect(0, 0, width, height);

      /*
       * Card.
       */
      context.fillStyle = "#ffffff";

      context.beginPath();
      context.roundRect(0, 0, width, height, 28);
      context.fill();

      /*
       * Heading.
       */
      context.fillStyle = "#111827";
      context.font = "700 30px Arial, sans-serif";

      context.fillText("Visualizer preview", padding, 48);

      /*
       * Image.
       */
      context.save();

      context.beginPath();
      context.roundRect(padding, headingHeight, imageWidth, imageHeight, 16);

      context.clip();

      context.drawImage(
        visualizerImage,
        padding,
        headingHeight,
        imageWidth,
        imageHeight,
      );

      context.restore();

      return canvas;
    }

    /*
     * Reference-frame-only export.
     *
     * Same principle: the image determines the card size.
     */
    if (selectedKey === "referenceFrame" && referenceImage) {
      const padding = 40;
      const headingHeight = 72;

      const maxContentWidth = 1600;
      const maxContentHeight = 1400;

      const imageScale = Math.min(
        maxContentWidth / referenceImage.naturalWidth,
        maxContentHeight / referenceImage.naturalHeight,
        1,
      );

      const imageWidth = referenceImage.naturalWidth * imageScale;

      const imageHeight = referenceImage.naturalHeight * imageScale;

      const width = imageWidth + padding * 2;

      const height = headingHeight + imageHeight + padding * 2;

      const scale = Math.max(
        1,
        Math.min(
          EXPORT_SCALE,
          Math.sqrt(MAX_EXPORT_PIXELS / (width * height)),
          MAX_EXPORT_SIDE / Math.max(width, height),
        ),
      );

      const canvas = document.createElement("canvas");

      canvas.width = Math.round(width * scale);

      canvas.height = Math.round(height * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas is unavailable in this browser.");
      }

      context.scale(scale, scale);

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.fillStyle = "#f4f5fb";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "#ffffff";

      context.beginPath();
      context.roundRect(0, 0, width, height, 28);
      context.fill();

      context.fillStyle = "#111827";
      context.font = "700 30px Arial, sans-serif";

      context.fillText("Reference frame", padding, 48);

      context.save();

      context.beginPath();
      context.roundRect(padding, headingHeight, imageWidth, imageHeight, 16);

      context.clip();

      context.drawImage(
        referenceImage,
        padding,
        headingHeight,
        imageWidth,
        imageHeight,
      );

      context.restore();

      return canvas;
    }

    /*
     * For text/card-only sections, use a narrower content-sized card.
     * This prevents them from inheriting the full 1600px document width.
     */
    if (selectedKey === "briefDetails") {
      const width = 1100;
      const margin = 60;
      const contentWidth = width - margin * 2;

      const measureCanvas = document.createElement("canvas");

      measureCanvas.width = width;
      measureCanvas.height = 1;

      const measureContext = measureCanvas.getContext("2d");

      if (!measureContext) {
        throw new Error("Canvas is unavailable in this browser.");
      }

      measureContext.font = "700 54px Arial, sans-serif";

      const titleLines = wrapCanvasText(
        measureContext,
        brief.title,
        contentWidth - 96,
      );

      const metadata = [
        brief.clientName && `Client: ${brief.clientName}`,
        brief.projectName && `Project: ${brief.projectName}`,
        DELIVERY_LABELS[brief.deliveryFormat],
      ]
        .filter(Boolean)
        .join("   ·   ");

      measureContext.font = "500 24px Arial, sans-serif";

      const metadataLines = wrapCanvasText(
        measureContext,
        metadata,
        contentWidth - 96,
      );

      const height =
        100 +
        132 +
        titleLines.length * 66 +
        10 +
        metadataLines.length * 36 +
        42 +
        60;

      return createSimpleSectionCanvas(
        width,
        height,
        (context, actualWidth, actualHeight) => {
          drawCardBackground(context, actualWidth, actualHeight, 28);

          context.fillStyle = "#4f46e5";
          context.font = "700 25px Arial, sans-serif";

          context.fillText("PALETTELAB  /  VIDEO COLOR BRIEF", margin, 60);

          context.fillStyle = "#111827";
          context.font = "700 54px Arial, sans-serif";

          drawWrappedText(
            context,
            brief.title,
            margin,
            132,
            contentWidth - 96,
            66,
          );

          const metadataTop = 132 + titleLines.length * 66 + 10;

          context.fillStyle = "#6b7280";
          context.font = "500 24px Arial, sans-serif";

          drawWrappedText(
            context,
            metadata,
            margin,
            metadataTop,
            contentWidth - 96,
            36,
          );
        },
      );
    }

    if (selectedKey === "paletteDirection") {
      const width = 1200;
      const margin = 50;
      const contentWidth = width - margin * 2;

      const cardHeight = 350;
      const height = cardHeight + margin * 2;

      return createSimpleSectionCanvas(width, height, (context) => {
        drawCardBackground(context, width, height, 28);

        context.fillStyle = "#111827";
        context.font = "700 30px Arial, sans-serif";

        context.fillText("Palette direction", margin + 40, margin + 56);

        context.fillStyle = "#6b7280";
        context.font = "500 22px Arial, sans-serif";

        context.fillText(brief.palette.name, margin + 40, margin + 95);

        const swatchY = margin + 125;

        const gap = 14;

        const swatchWidth =
          (contentWidth -
            80 -
            gap * Math.max(brief.palette.colors.length - 1, 0)) /
          Math.max(brief.palette.colors.length, 1);

        brief.palette.colors.forEach((color, index) => {
          const x = margin + 40 + index * (swatchWidth + gap);

          context.fillStyle = color.hex;

          context.beginPath();

          context.roundRect(x, swatchY, swatchWidth, 112, 12);

          context.fill();

          context.fillStyle = "#374151";

          context.font = "700 20px Arial, sans-serif";

          context.fillText(color.hex.toUpperCase(), x, swatchY + 145);
        });
      });
    }

    if (selectedKey === "colorRoles") {
      const width = 1400;
      const margin = 50;
      const contentWidth = width - margin * 2;

      const rolesHeight = 120 + brief.roles.length * 100;

      const height = rolesHeight + margin * 2;

      return createSimpleSectionCanvas(width, height, (context) => {
        drawCardBackground(context, width, height, 28);

        context.fillStyle = "#111827";
        context.font = "700 30px Arial, sans-serif";

        context.fillText("Color roles & usage", margin + 40, margin + 56);

        brief.roles.forEach((role, index) => {
          const rowY = margin + 96 + index * 100;

          context.fillStyle = role.colorHex;

          context.beginPath();

          context.roundRect(margin + 40, rowY - 25, 42, 42, 8);

          context.fill();

          context.fillStyle = "#111827";

          context.font = "700 22px Arial, sans-serif";

          context.fillText(role.label, margin + 104, rowY);

          context.fillStyle = "#4f46e5";

          context.font = "700 20px Arial, sans-serif";

          context.fillText(role.colorHex.toUpperCase(), margin + 540, rowY);

          context.fillStyle = "#4b5563";

          context.font = "500 19px Arial, sans-serif";

          drawWrappedText(
            context,
            role.usage,
            margin + 760,
            rowY,
            contentWidth - 800,
            26,
          );
        });
      });
    }

    if (selectedKey === "notes") {
      if (!brief.notes.trim()) {
        throw new Error("There are no creative notes to export.");
      }

      const width = 1100;
      const margin = 50;
      const contentWidth = width - margin * 2;

      const measureCanvas = document.createElement("canvas");

      measureCanvas.width = width;
      measureCanvas.height = 1;

      const measureContext = measureCanvas.getContext("2d");

      if (!measureContext) {
        throw new Error("Canvas is unavailable in this browser.");
      }

      measureContext.font = "500 22px Arial, sans-serif";

      const noteLines = wrapCanvasText(
        measureContext,
        brief.notes,
        contentWidth - 80,
      );

      const notesHeight = 115 + noteLines.length * 34;

      const height = notesHeight + margin * 2;

      return createSimpleSectionCanvas(width, height, (context) => {
        drawCardBackground(context, width, height, 28);

        context.fillStyle = "#111827";
        context.font = "700 30px Arial, sans-serif";

        context.fillText(
          "Creative notes & client feedback",
          margin + 40,
          margin + 54,
        );

        context.fillStyle = "#4b5563";
        context.font = "500 22px Arial, sans-serif";

        drawWrappedText(
          context,
          brief.notes,
          margin + 40,
          margin + 100,
          contentWidth - 80,
          34,
        );
      });
    }

    if (selectedKey === "editorHandoff") {
      const width = 1100;
      const height = 300;

      return createSimpleSectionCanvas(width, height, (context) => {
        context.fillStyle = "#fff8e7";

        context.beginPath();

        context.roundRect(0, 0, width, height, 28);

        context.fill();

        context.fillStyle = "#111827";
        context.font = "700 25px Arial, sans-serif";

        context.fillText("Editor handoff", 40, 52);

        context.fillStyle = "#4b5563";
        context.font = "500 20px Arial, sans-serif";

        drawWrappedText(
          context,
          `Intended delivery: ${DELIVERY_LABELS[brief.deliveryFormat]}. Confirm sequence, footage color space, display transform, and export settings in your editing application. HEX swatches describe creative direction; they are not a LUT or a technically matched grade.`,
          40,
          92,
          width - 80,
          29,
        );
      });
    }

    if (selectedKey === "approvalDetails") {
      const approvalLines = [
        `Status: ${STATUS_LABELS[brief.status]}`,
        brief.approvedAt &&
          `Approved: ${new Date(brief.approvedAt).toLocaleString()}`,
        `Updated: ${new Date(brief.updatedAt).toLocaleString()}`,
      ]
        .filter(Boolean)
        .join("   ·   ");

      const width = 1100;
      const height = 180;

      return createSimpleSectionCanvas(width, height, (context) => {
        context.fillStyle = "#f4f5fb";

        context.fillRect(0, 0, width, height);

        context.fillStyle = "#6b7280";
        context.font = "500 18px Arial, sans-serif";

        drawWrappedText(context, approvalLines, 20, 60, width - 40, 28);
      });
    }
  }

  /*
   * ---------------------------------------------------------------
   * MULTI-SECTION EXPORT
   * ---------------------------------------------------------------
   *
   * Existing brief layout is preserved here.
   *
   * Crucially, only selected sections enter the layout function.
   */
  const width = 1600;
  const margin = 100;
  const contentWidth = width - margin * 2;
  const startY = 100;

  const layout = (context: CanvasRenderingContext2D): number => {
    context.textBaseline = "alphabetic";

    context.textAlign = "left";

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    let y = startY;

    const roundedCard = (top: number, height: number, fill = "#ffffff") => {
      context.fillStyle = fill;

      context.beginPath();

      context.roundRect(margin, top, contentWidth, height, 28);

      context.fill();
    };

    const writeWrapped = (
      text: string,
      x: number,
      top: number,
      maxWidth: number,
      lineHeight: number,
    ) => {
      const lines = wrapCanvasText(context, text, maxWidth);

      lines.forEach((line, index) => {
        context.fillText(line, x, top + index * lineHeight);
      });

      return top + lines.length * lineHeight;
    };

    if (sections.briefDetails) {
      const headerTop = y;

      const metadata = [
        brief.clientName && `Client: ${brief.clientName}`,
        brief.projectName && `Project: ${brief.projectName}`,
        DELIVERY_LABELS[brief.deliveryFormat],
      ]
        .filter(Boolean)
        .join("   ·   ");

      context.font = "700 54px Arial, sans-serif";

      const titleLines = wrapCanvasText(
        context,
        brief.title,
        contentWidth - 96,
      );

      const metadataTop = headerTop + 132 + titleLines.length * 66 + 10;

      context.font = "500 24px Arial, sans-serif";

      const metadataLines = wrapCanvasText(
        context,
        metadata,
        contentWidth - 96,
      );

      const headerHeight =
        metadataTop - headerTop + metadataLines.length * 36 + 42;

      roundedCard(headerTop, headerHeight);

      context.fillStyle = "#4f46e5";

      context.font = "700 25px Arial, sans-serif";

      context.fillText(
        "PALETTELAB  /  VIDEO COLOR BRIEF",
        margin + 48,
        headerTop + 60,
      );

      context.fillStyle = "#111827";

      context.font = "700 54px Arial, sans-serif";

      writeWrapped(
        brief.title,
        margin + 48,
        headerTop + 132,
        contentWidth - 96,
        66,
      );

      context.fillStyle = "#6b7280";

      context.font = "500 24px Arial, sans-serif";

      writeWrapped(metadata, margin + 48, metadataTop, contentWidth - 96, 36);

      y += headerHeight + 45;
    }

    if (sections.paletteDirection) {
      roundedCard(y, 310);

      context.fillStyle = "#111827";

      context.font = "700 30px Arial, sans-serif";

      context.fillText("Palette direction", margin + 40, y + 56);

      context.fillStyle = "#6b7280";

      context.font = "500 22px Arial, sans-serif";

      context.fillText(brief.palette.name, margin + 40, y + 95);

      const swatchY = y + 125;

      const gap = 14;

      const swatchWidth =
        (contentWidth -
          80 -
          gap * Math.max(brief.palette.colors.length - 1, 0)) /
        Math.max(brief.palette.colors.length, 1);

      brief.palette.colors.forEach((color, index) => {
        const x = margin + 40 + index * (swatchWidth + gap);

        context.fillStyle = color.hex;

        context.beginPath();

        context.roundRect(x, swatchY, swatchWidth, 112, 12);

        context.fill();

        context.fillStyle = "#374151";

        context.font = "700 20px Arial, sans-serif";

        context.fillText(
          color.hex.toUpperCase(),
          x,
          swatchY + 145,
          swatchWidth,
        );
      });

      y += 350;
    }

    if (sections.visualizerPreview && visualizerImage) {
      const maxImageWidth = contentWidth - 80;

      const maxImageHeight = 920;

      const imageScale = Math.min(
        maxImageWidth / visualizerImage.naturalWidth,
        maxImageHeight / visualizerImage.naturalHeight,
      );

      const imageWidth = visualizerImage.naturalWidth * imageScale;

      const imageHeight = visualizerImage.naturalHeight * imageScale;

      const imageCardHeight = imageHeight + 112;

      roundedCard(y, imageCardHeight);

      context.fillStyle = "#111827";

      context.font = "700 30px Arial, sans-serif";

      context.fillText("Visualizer preview", margin + 40, y + 52);

      context.save();

      context.beginPath();

      context.roundRect(margin + 40, y + 76, imageWidth, imageHeight, 16);

      context.clip();

      context.drawImage(
        visualizerImage,
        margin + 40,
        y + 76,
        imageWidth,
        imageHeight,
      );

      context.restore();

      y += imageCardHeight + 35;
    }

    if (sections.referenceFrame && referenceImage) {
      const maxImageWidth = contentWidth - 80;

      const maxImageHeight = 900;

      const imageScale = Math.min(
        maxImageWidth / referenceImage.naturalWidth,
        maxImageHeight / referenceImage.naturalHeight,
      );

      const imageWidth = referenceImage.naturalWidth * imageScale;

      const imageHeight = referenceImage.naturalHeight * imageScale;

      roundedCard(y, imageHeight + 112);

      context.fillStyle = "#111827";

      context.font = "700 30px Arial, sans-serif";

      context.fillText("Reference frame", margin + 40, y + 52);

      context.drawImage(
        referenceImage,
        margin + 40,
        y + 76,
        imageWidth,
        imageHeight,
      );

      y += imageHeight + 112 + 35;
    }

    if (sections.colorRoles) {
      const rolesHeight = 120 + brief.roles.length * 100;

      roundedCard(y, rolesHeight);

      context.fillStyle = "#111827";

      context.font = "700 30px Arial, sans-serif";

      context.fillText("Color roles & usage", margin + 40, y + 56);

      brief.roles.forEach((role, index) => {
        const rowY = y + 96 + index * 100;

        context.fillStyle = role.colorHex;

        context.beginPath();

        context.roundRect(margin + 40, rowY - 25, 42, 42, 8);

        context.fill();

        context.fillStyle = "#111827";

        context.font = "700 22px Arial, sans-serif";

        context.fillText(role.label, margin + 104, rowY);

        context.fillStyle = "#4f46e5";

        context.font = "700 20px Arial, sans-serif";

        context.fillText(role.colorHex.toUpperCase(), margin + 540, rowY);

        context.fillStyle = "#4b5563";

        context.font = "500 19px Arial, sans-serif";

        writeWrapped(role.usage, margin + 760, rowY, contentWidth - 800, 26);
      });

      y += rolesHeight + 35;
    }

    if (sections.notes && brief.notes.trim()) {
      context.font = "500 22px Arial, sans-serif";

      const noteLines = wrapCanvasText(context, brief.notes, contentWidth - 96);

      const notesHeight = 115 + noteLines.length * 34;

      roundedCard(y, notesHeight);

      context.fillStyle = "#111827";

      context.font = "700 30px Arial, sans-serif";

      context.fillText("Creative notes & client feedback", margin + 40, y + 54);

      context.fillStyle = "#4b5563";

      context.font = "500 22px Arial, sans-serif";

      writeWrapped(brief.notes, margin + 40, y + 100, contentWidth - 80, 34);

      y += notesHeight + 30;
    }

    if (sections.editorHandoff) {
      roundedCard(y, 170, "#fff8e7");

      context.fillStyle = "#111827";

      context.font = "700 25px Arial, sans-serif";

      context.fillText("Editor handoff", margin + 40, y + 52);

      context.fillStyle = "#4b5563";

      context.font = "500 20px Arial, sans-serif";

      writeWrapped(
        `Intended delivery: ${DELIVERY_LABELS[brief.deliveryFormat]}. Confirm sequence, footage color space, display transform, and export settings in your editing application. HEX swatches describe creative direction; they are not a LUT or a technically matched grade.`,
        margin + 40,
        y + 92,
        contentWidth - 80,
        29,
      );

      y += 215;
    }

    if (sections.approvalDetails) {
      const approvalLines = [
        `Status: ${STATUS_LABELS[brief.status]}`,
        brief.approvedAt &&
          `Approved: ${new Date(brief.approvedAt).toLocaleString()}`,
        `Updated: ${new Date(brief.updatedAt).toLocaleString()}`,
      ]
        .filter(Boolean)
        .join("   ·   ");

      context.fillStyle = "#6b7280";

      context.font = "500 18px Arial, sans-serif";

      y =
        writeWrapped(approvalLines, margin + 4, y + 20, contentWidth - 8, 28) +
        20;
    }

    return y;
  };

  /*
   * Pass 1:
   * Measure the real height.
   */
  const measureCanvas = document.createElement("canvas");

  measureCanvas.width = width;
  measureCanvas.height = 1;

  const measureContext = measureCanvas.getContext("2d");

  if (!measureContext) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  const endY = layout(measureContext);

  if (endY === startY) {
    throw new Error("Select at least one section to include in the export.");
  }

  const height = Math.ceil(endY + 60);

  /*
   * Pass 2:
   * Draw at high resolution.
   */
  const scale = Math.max(
    1,
    Math.min(
      EXPORT_SCALE,
      Math.sqrt(MAX_EXPORT_PIXELS / (width * height)),
      MAX_EXPORT_SIDE / Math.max(width, height),
    ),
  );

  const canvas = document.createElement("canvas");

  canvas.width = Math.round(width * scale);

  canvas.height = Math.round(height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  context.scale(scale, scale);

  context.fillStyle = "#f4f5fb";

  context.fillRect(0, 0, width, height);

  layout(context);

  return canvas;
};

/*
 * Helpers used by single-section exports.
 */
const drawCardBackground = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
) => {
  context.fillStyle = "#ffffff";

  context.beginPath();

  context.roundRect(0, 0, width, height, radius);

  context.fill();
};

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  top: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const lines = wrapCanvasText(context, text, maxWidth);

  lines.forEach((line, index) => {
    context.fillText(line, x, top + index * lineHeight);
  });
};

const createSimpleSectionCanvas = (
  width: number,
  height: number,
  draw: (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => void,
): HTMLCanvasElement => {
  const scale = Math.max(
    1,
    Math.min(
      EXPORT_SCALE,
      Math.sqrt(MAX_EXPORT_PIXELS / (width * height)),
      MAX_EXPORT_SIDE / Math.max(width, height),
    ),
  );

  const canvas = document.createElement("canvas");

  canvas.width = Math.round(width * scale);

  canvas.height = Math.round(height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  context.scale(scale, scale);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.fillStyle = "#f4f5fb";

  context.fillRect(0, 0, width, height);

  draw(context, width, height);

  return canvas;
};

const createPdf = (canvas: HTMLCanvasElement): Blob => {
  const imageData = canvas.toDataURL("image/jpeg", 0.95).split(",")[1];

  if (!imageData) {
    throw new Error("Unable to encode the brief as an image.");
  }

  const binary = atob(imageData);

  const imageBytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );

  const pdfWidth = 595;

  const pdfHeight = (pdfWidth * canvas.height) / canvas.width;

  const encoder = new TextEncoder();

  const chunks: Uint8Array[] = [];

  const offsets: number[] = [0];

  let byteLength = 0;

  const append = (chunk: Uint8Array) => {
    chunks.push(chunk);
    byteLength += chunk.length;
  };

  const appendText = (text: string) => {
    append(encoder.encode(text));
  };

  appendText("%PDF-1.4\n");

  const addObject = (id: number, body: Uint8Array | string) => {
    offsets[id] = byteLength;

    appendText(`${id} 0 obj\n`);

    if (typeof body === "string") {
      appendText(body);
    } else {
      append(body);
    }

    appendText("\nendobj\n");
  };

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");

  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");

  addObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight.toFixed(
      2,
    )}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );

  offsets[4] = byteLength;

  appendText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
  );

  append(imageBytes);

  appendText("\nendstream\nendobj\n");

  offsets[5] = byteLength;

  const content = `q\n${pdfWidth} 0 0 ${pdfHeight.toFixed(
    2,
  )} 0 0 cm\n/Im0 Do\nQ`;

  appendText(
    `5 0 obj\n<< /Length ${
      encoder.encode(content).length
    } >>\nstream\n${content}\nendstream\nendobj\n`,
  );

  const xrefOffset = byteLength;

  appendText("xref\n0 6\n0000000000 65535 f \n");

  for (let id = 1; id <= 5; id += 1) {
    appendText(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }

  appendText(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  const pdfBytes = new Uint8Array(byteLength);

  let offset = 0;

  chunks.forEach((chunk) => {
    pdfBytes.set(chunk, offset);

    offset += chunk.length;
  });

  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
};

export const createVideoColorBrief = (
  palette: VideoColorBrief["palette"],
  visualizerImageDataUrl?: string,
): VideoColorBrief => {
  const roleNames = [
    ["Primary look", "Overall mood, titles, and key graphic elements"],
    ["Shadow tone", "Shadow detail and darker supporting graphics"],
    ["Midtone", "Environment, wardrobe accents, and supporting elements"],
    ["Highlight", "Highlights and brighter graphic surfaces"],
    ["Accent", "Small emphasis details and calls to action"],
  ];

  const id = `brief-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const roles: VideoColorRole[] = palette.colors.map((color, index) => {
    const [label, usage] = roleNames[index] || [
      `Supporting tone ${index - roleNames.length + 1}`,
      "Supporting graphics and secondary accents",
    ];

    return {
      id: `${id}-role-${index}`,
      label,
      colorHex: color.hex,
      usage,
    };
  });

  return {
    id,
    title: `${palette.name} — Video Color Brief`,
    clientName: "",
    projectName: "",
    revision: 1,
    status: "draft",
    palette,
    visualizerImageDataUrl,
    exportSections: {
      ...DEFAULT_EXPORT_SECTIONS,
    },
    roles,
    notes: "",
    referenceFrameUrl: "",
    deliveryFormat: "rec709",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const VideoBriefStudio: React.FC<VideoBriefStudioProps> = ({
  briefs,
  activeBriefId,
  onSelectBrief,
  onDeleteBrief,
  onUpdateBrief,
  onCreateRevision,
  onOpenExplore,
  onToast,
}) => {
  const brief =
    briefs.find((item) => item.id === activeBriefId) || briefs[0] || null;

  const referenceFileInputRef = useRef<HTMLInputElement>(null);

  const [isReferenceDragOver, setIsReferenceDragOver] = useState(false);

  const exportSections = brief
    ? getExportSections(brief)
    : DEFAULT_EXPORT_SECTIONS;

  const [normalizedPreview, setNormalizedPreview] = useState<{
    briefId: string;
    url: string;
  } | null>(null);

  const normalizingPreviewId = useRef<string | null>(null);

  const visualizerPreviewUrl = brief
    ? normalizedPreview?.briefId === brief.id
      ? normalizedPreview.url
      : brief.visualizerImageDataUrl
    : undefined;

  useEffect(() => {
    if (
      !brief?.visualizerImageDataUrl ||
      isSvgDataUrl(brief.visualizerImageDataUrl) ||
      normalizingPreviewId.current === brief.id
    ) {
      return;
    }

    normalizingPreviewId.current = brief.id;

    let cancelled = false;

    void normalizeVisualizerPreview(brief.visualizerImageDataUrl)
      .then((url) => {
        if (cancelled || url === brief.visualizerImageDataUrl) {
          return;
        }

        setNormalizedPreview({
          briefId: brief.id,
          url,
        });

        onUpdateBrief({
          ...brief,
          visualizerImageDataUrl: url,
          updatedAt: new Date().toISOString(),
        });
      })
      .catch((error: unknown) => {
        console.error(
          "Unable to update the saved visualizer preview layout:",
          error,
        );

        onToast("Unable to update this saved visualizer preview.");
      });

    return () => {
      cancelled = true;
    };
  }, [brief?.id, brief?.visualizerImageDataUrl]);

  const update = (changes: Partial<VideoColorBrief>) => {
    if (!brief) return;

    onUpdateBrief({
      ...brief,
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateRole = (roleId: string, changes: Partial<VideoColorRole>) => {
    if (!brief) return;

    update({
      roles: brief.roles.map((role) =>
        role.id === roleId
          ? {
              ...role,
              ...changes,
            }
          : role,
      ),
    });
  };

  const updateExportSection = (
    key: keyof VideoBriefExportSections,
    included: boolean,
  ) => {
    if (!brief) return;

    update({
      exportSections: {
        ...exportSections,
        [key]: included,
      },
    });
  };

  const saveReferenceFile = async (file: File | undefined) => {
    if (!file || !brief) {
      return;
    }

    try {
      const referenceFrameUrl = await prepareReferenceImage(file);

      update({
        referenceFrameUrl,
      });

      onToast("Reference frame added to this brief.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to use that reference image.";

      console.error("Unable to prepare the reference frame:", error);

      onToast(message);
    }
  };

  const handleReferencePaste = (
    event: React.ClipboardEvent<HTMLDivElement>,
  ) => {
    const item = Array.from(event.clipboardData.items).find((clipboardItem) =>
      clipboardItem.type.startsWith("image/"),
    );

    const file = item?.getAsFile();

    if (!file) return;

    event.preventDefault();

    void saveReferenceFile(file);
  };

  const copyHexes = async () => {
    if (!brief) return;

    await navigator.clipboard.writeText(
      brief.palette.colors.map((color) => color.hex).join(", "),
    );

    onToast("Palette HEX values copied.");
  };

  const saveBrief = async (format: "pdf" | "png") => {
    if (!brief) return;

    if (!Object.values(exportSections).some(Boolean)) {
      onToast("Select at least one section to include in the export.");

      return;
    }

    try {
      const canvas = await createBriefCanvas(brief);

      const file =
        format === "pdf"
          ? createPdf(canvas)
          : await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("The browser could not create a PNG file."));
                }
              }, "image/png");
            });

      downloadFile(file, safeFileName(brief, format));

      onToast(`Video color brief saved as ${format.toUpperCase()}.`);
    } catch (error) {
      console.error(
        `Unable to save the video brief as ${format.toUpperCase()}:`,
        error,
      );

      onToast(
        `Unable to save the brief as ${format.toUpperCase()}. Please try again.`,
      );
    }
  };

  if (!brief) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xs sm:p-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <Video className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900">
            Video Color Briefs
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
            Turn a palette into a client-ready color direction with named roles,
            a reference frame, delivery details, revisions, and an approval
            status.
          </p>

          <button
            type="button"
            onClick={onOpenExplore}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            <FilePlus2 className="h-4 w-4" />
            Choose a palette to start
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Video className="h-4 w-4" />
            <span>Client delivery workspace</span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Video Color Briefs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Define the look, collect feedback, and hand off the approved
            direction.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void saveBrief("pdf")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            Save PDF
          </button>

          <button
            type="button"
            onClick={() => void saveBrief("png")}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            <Download className="h-4 w-4" />
            Save PNG
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-4">
          <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Client briefs &amp; revisions
              </h2>

              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                {briefs.length}
              </span>
            </div>

            <div className="space-y-2">
              {[...briefs]
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2 rounded-xl border p-2 transition-colors ${
                      item.id === brief.id
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectBrief(item.id)}
                      aria-current={item.id === brief.id ? "page" : undefined}
                      className="min-w-0 flex-1 p-1 text-left"
                    >
                      <span className="block truncate text-xs font-bold text-gray-900">
                        {item.title}
                      </span>

                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-gray-500">
                          v{item.revision}
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[item.status]}`}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label={`Delete ${item.title}, revision ${item.revision}`}
                      title={`Delete revision ${item.revision}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${item.title}" revision ${item.revision}? This cannot be undone.`,
                          )
                        ) {
                          onDeleteBrief(item.id);
                        }
                      }}
                      className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Export sections
              </h2>

              <p className="mt-1 text-[11px] leading-4 text-gray-500">
                Checked sections are included in PDF and PNG exports. Unchecked
                sections do not affect the export layout.
              </p>
            </div>

            <div className="space-y-2">
              {EXPORT_SECTION_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2.5 text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={exportSections[key]}
                    onChange={(event) =>
                      updateExportSection(key, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
                  />

                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[brief.status]}`}
                >
                  {STATUS_LABELS[brief.status]}
                </span>

                <span className="ml-2 text-xs text-gray-500">
                  Revision {brief.revision}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {brief.status === "draft" ||
                brief.status === "changes-requested" ? (
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        status: "in-review",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Mark ready for review
                  </button>
                ) : null}

                {brief.status === "in-review" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          status: "changes-requested",
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Request changes
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        update({
                          status: "approved",
                          approvedAt: new Date().toISOString(),
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </>
                ) : null}

                {brief.status !== "draft" ? (
                  <button
                    type="button"
                    onClick={() => onCreateRevision(brief)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Create next revision
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-700">
                Brief title
                <input
                  value={brief.title}
                  onChange={(event) =>
                    update({
                      title: event.target.value,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="text-xs font-semibold text-gray-700">
                Client
                <input
                  value={brief.clientName}
                  onChange={(event) =>
                    update({
                      clientName: event.target.value,
                    })
                  }
                  placeholder="Client or brand name"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="text-xs font-semibold text-gray-700">
                Project
                <input
                  value={brief.projectName}
                  onChange={(event) =>
                    update({
                      projectName: event.target.value,
                    })
                  }
                  placeholder="Campaign, film, or edit name"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="text-xs font-semibold text-gray-700">
                Intended delivery
                <select
                  value={brief.deliveryFormat}
                  onChange={(event) =>
                    update({
                      deliveryFormat: event.target
                        .value as VideoColorBrief["deliveryFormat"],
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {Object.entries(DELIVERY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
            <div
              className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-xs ${
                brief.visualizerImageDataUrl ? "xl:col-span-2" : ""
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Palette direction
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {brief.palette.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyHexes}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                  Copy HEX
                </button>
              </div>

              <div className="flex h-24 overflow-hidden rounded-xl border border-gray-100">
                {brief.palette.colors.map((color, index) => (
                  <div
                    key={`${color.hex}-${index}`}
                    style={{
                      backgroundColor: color.hex,
                    }}
                    className="flex-1"
                    title={color.hex}
                  />
                ))}
              </div>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {brief.palette.colors.map((color, index) => (
                  <span
                    key={`${color.hex}-${index}`}
                    className="font-mono text-[10px] font-semibold text-gray-600"
                  >
                    {color.hex}
                  </span>
                ))}
              </div>
            </div>

            {visualizerPreviewUrl && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs xl:col-span-2">
                <h2 className="mb-3 text-sm font-bold text-gray-900">
                  Visualizer preview
                </h2>

                <img
                  src={visualizerPreviewUrl}
                  alt="Captured visualizer design preview"
                  className="block h-auto w-full rounded-xl border border-gray-100"
                />

                <p className="mt-2 text-center text-[11px] text-gray-500">
                  This captured design is included in the PDF and PNG exports.
                </p>
              </div>
            )}

            <div
              className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-xs ${
                brief.visualizerImageDataUrl ? "xl:col-span-2" : ""
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />

                <h2 className="text-sm font-bold text-gray-900">
                  Reference frame
                </h2>
              </div>

              <div
                tabIndex={0}
                aria-label="Reference image paste and drop area"
                onPaste={handleReferencePaste}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsReferenceDragOver(true);
                }}
                onDragLeave={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  ) {
                    setIsReferenceDragOver(false);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();

                  setIsReferenceDragOver(false);

                  void saveReferenceFile(event.dataTransfer.files[0]);
                }}
                className={`rounded-xl border border-dashed p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                  isReferenceDragOver
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 bg-gray-50/70"
                }`}
              >
                <p className="text-xs font-semibold text-gray-800">
                  Add a still or visual reference
                </p>

                <p className="mt-1 text-[11px] leading-4 text-gray-500">
                  Upload an image, paste a copied image here, or drop one into
                  this area.
                </p>

                <input
                  ref={referenceFileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload reference image"
                  className="hidden"
                  onChange={(event) => {
                    void saveReferenceFile(event.currentTarget.files?.[0]);

                    event.currentTarget.value = "";
                  }}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => referenceFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload image
                  </button>

                  <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] text-gray-500">
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Focus here, then paste
                  </span>
                </div>
              </div>

              <label className="mt-4 block text-xs font-semibold text-gray-700">
                Or use an image URL
                <input
                  type="url"
                  value={brief.referenceFrameUrl}
                  onChange={(event) =>
                    update({
                      referenceFrameUrl: event.target.value,
                    })
                  }
                  placeholder="https://example.com/frame.jpg"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              {brief.referenceFrameUrl ? (
                <img
                  src={brief.referenceFrameUrl}
                  alt="Client-approved visual reference"
                  className="mt-3 max-h-64 w-full rounded-xl bg-gray-100 object-contain"
                  onError={() =>
                    onToast(
                      "The reference image could not be loaded. Try uploading or pasting the image instead.",
                    )
                  }
                />
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-500">
                  No reference frame added. It is optional; the brief works
                  without one.
                </p>
              )}

              {brief.referenceFrameUrl && (
                <button
                  type="button"
                  onClick={() =>
                    update({
                      referenceFrameUrl: "",
                    })
                  }
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove reference
                </button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900">
                Color roles &amp; usage
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Assign the palette colors to a clear creative role. These are
                guidance, not a substitute for color grading.
              </p>
            </div>

            <div className="space-y-3">
              {brief.roles.map((role) => (
                <div
                  key={role.id}
                  className="grid grid-cols-1 items-center gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-[minmax(120px,0.8fr)_minmax(150px,1fr)_minmax(180px,1.5fr)]"
                >
                  <input
                    aria-label="Color role name"
                    value={role.label}
                    onChange={(event) =>
                      updateRole(role.id, {
                        label: event.target.value,
                      })
                    }
                    className="rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold text-gray-900"
                  />

                  <select
                    aria-label={`Color for ${role.label}`}
                    value={role.colorHex}
                    onChange={(event) =>
                      updateRole(role.id, {
                        colorHex: event.target.value,
                      })
                    }
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-800"
                  >
                    {brief.palette.colors.map((color, index) => (
                      <option key={`${color.hex}-${index}`} value={color.hex}>
                        {color.hex} · {color.name}
                      </option>
                    ))}
                  </select>

                  <input
                    aria-label={`Usage guidance for ${role.label}`}
                    value={role.usage}
                    onChange={(event) =>
                      updateRole(role.id, {
                        usage: event.target.value,
                      })
                    }
                    className="rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-700"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <label className="block text-xs font-bold text-gray-900">
              Creative notes &amp; client feedback
              <textarea
                rows={4}
                value={brief.notes}
                onChange={(event) =>
                  update({
                    notes: event.target.value,
                  })
                }
                placeholder="Describe the intended mood, references, feedback, or changes requested…"
                className="mt-2 w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal leading-6 text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Editor handoff
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-700">
                  Intended delivery:{" "}
                  <strong>{DELIVERY_LABELS[brief.deliveryFormat]}</strong>.
                  Confirm the sequence, footage color space, display transform,
                  and export settings in your editing application. HEX swatches
                  describe creative direction; they are not a LUT or a
                  technically matched grade.
                </p>
              </div>
            </div>
          </section>

          {brief.status === "approved" && brief.approvedAt && (
            <p className="text-right text-xs font-semibold text-emerald-700">
              Approved {new Date(brief.approvedAt).toLocaleString()}
            </p>
          )}

          <p className="text-right text-[10px] text-gray-400">
            Updated {new Date(brief.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </main>
  );
};
