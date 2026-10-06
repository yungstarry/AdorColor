import {
  DEFAULT_PROJECT_CARD_SECTIONS,
  ROLE_DETAILS,
  type FontEntry,
  type ProjectSet,
} from "./fontSelectorModel";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const COLORS = {
  page: "#e9e8e1",
  card: "#fbfaf6",
  cardBorder: "#e2e3da",
  panel: "#f3f2ea",
  panelBorder: "#e6e6dc",
  divider: "#e4e5de",
  ink: "#1f2a21",
  body: "#3a463c",
  muted: "#78816f",
  faint: "#9aa095",
  accent: "#74816f",
  accentDark: "#596754",
  chip: "#e7ebdd",
};

const UI_FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

const ui = (weight: number | string, size: number) =>
  `${weight} ${size}px ${UI_FAMILY}`;

/** Output is rendered at this multiple of the layout size for crisp text. */
const TARGET_SCALE = 3;
/** Safety cap so very tall cards don't exceed browser canvas limits. */
const MAX_CANVAS_PIXELS = 30_000_000;
const MAX_CANVAS_SIDE = 16_000;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const normalizeFontName = (name: string) =>
  name.replace(/['"]/g, "").replace(/\s+/g, " ").trim();

const getFontFamily = (font: FontEntry) =>
  `"${normalizeFontName(font.name)}", system-ui, sans-serif`;

const getFontWeight = (font: FontEntry) => {
  const combined = `${font.name} ${font.tags.join(" ")}`.toLowerCase();

  if (
    combined.includes("black") ||
    combined.includes("extra bold") ||
    combined.includes("extrabold") ||
    combined.includes("heavy")
  ) {
    return 900;
  }

  if (combined.includes("bold") || combined.includes("impact")) {
    return 700;
  }

  return 400;
};

const setLetterSpacing = (ctx: CanvasRenderingContext2D, value: string) => {
  // Not available in every browser; safe to ignore when missing.
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = value;
  }
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const lines: string[] = [];

  text.split("\n").forEach((paragraph) => {
    if (!paragraph.trim()) {
      lines.push("");
      return;
    }

    let line = "";

    paragraph.split(/\s+/).forEach((word) => {
      const next = line ? `${line} ${word}` : word;

      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });

    if (line) lines.push(line);
  });

  return lines;
};

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export async function exportProjectCardPng(
  project: ProjectSet,
  fontsById: Map<string, FontEntry>,
  onToast: (message: string) => void,
) {
  const sections = project.exportSections ?? DEFAULT_PROJECT_CARD_SECTIONS;

  if (!Object.values(sections).some(Boolean)) {
    onToast("Select at least one section to include in the project card.");
    return;
  }

  const projectFonts = project.fontIds
    .map((id, index) => ({ font: fontsById.get(id), index }))
    .filter((item): item is { font: FontEntry; index: number } =>
      Boolean(item.font),
    );

  const typeSystem = projectFonts.map(({ font, index }) => ({
    font,
    role: project.fontRoles[index] || ROLE_DETAILS[index]?.label || "Font",
  }));

  const fontDetails = sections.fontDetails
    ? projectFonts
        .map(({ font }) => ({
          name: font.name,
          labels: [...font.categories, ...font.tags].join("  ·  "),
          description: font.description.trim(),
        }))
        .filter((d) => d.labels || d.description)
    : [];

  const textRows: { label: string; value: string }[] = [];

  if (sections.purpose && project.purpose.trim()) {
    textRows.push({ label: "PURPOSE", value: project.purpose.trim() });
  }

  if (sections.notes && project.notes.trim()) {
    textRows.push({ label: "NOTES", value: project.notes.trim() });
  }

  try {
    /* ---------------------------------------------------------------- */
    /* Wait for fonts so the canvas can actually draw with them          */
    /* ---------------------------------------------------------------- */

    const missingFonts: string[] = [];

    if ("fonts" in document) {
      try {
        await document.fonts.ready;

        await Promise.all(
          typeSystem.map(async ({ font }) => {
            const family = normalizeFontName(font.name);
            const weight = getFontWeight(font);
            const descriptor = `${weight} 48px "${family}"`;

            try {
              await document.fonts.load(descriptor, "Aa Bb 0123");
            } catch {
              // Best-effort; we fall back to a system font.
            }

            if (!document.fonts.check(descriptor)) {
              missingFonts.push(font.name);
            }
          }),
        );
      } catch {
        // Font loading is best-effort.
      }
    }

    /* ---------------------------------------------------------------- */
    /* Layout constants (in CSS pixels; scaled up when drawing)          */
    /* ---------------------------------------------------------------- */

    const width = 1080;
    const margin = 32; // gap between page edge and card
    const cardPad = 64; // gap between card edge and content
    const x0 = margin + cardPad;
    const contentWidth = width - x0 * 2;

    const title =
      sections.name && project.name.trim()
        ? project.name.trim()
        : "Typography mix";

    const styleText =
      sections.style && project.style.trim()
        ? project.style.trim().toLocaleUpperCase()
        : "";

    /* ---------------------------------------------------------------- */
    /* Single render routine used twice:                                 */
    /*   1) draw = false  -> measure the total height                    */
    /*   2) draw = true   -> paint onto the final, correctly sized canvas*/
    /* This avoids hand-maintained height math drifting out of sync.     */
    /* ---------------------------------------------------------------- */

    const render = (ctx: CanvasRenderingContext2D, draw: boolean) => {
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      setLetterSpacing(ctx, "0px");

      let y = margin + cardPad;

      /* ---- Header ---- */

      if (draw) {
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.arc(x0 + 6, y + 6, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = ui(700, 15);
        ctx.fillStyle = COLORS.accentDark;
        setLetterSpacing(ctx, "2.5px");
        ctx.fillText("PALETTELAB", x0 + 22, y + 11);

        ctx.font = ui(600, 13);
        ctx.fillStyle = COLORS.faint;
        ctx.textAlign = "right";
        ctx.fillText("TYPE STUDY", x0 + contentWidth, y + 11);
        ctx.textAlign = "left";
        setLetterSpacing(ctx, "0px");
      }

      y += 40;

      /* ---- Title ---- */

      ctx.font = ui(650, 58);
      const titleLines = wrapText(ctx, title, contentWidth);

      y += 62;
      titleLines.forEach((line, i) => {
        if (draw) {
          ctx.fillStyle = COLORS.ink;
          ctx.font = ui(650, 58);
          ctx.fillText(line, x0, y);
        }
        if (i < titleLines.length - 1) y += 68;
      });

      /* ---- Style chip ---- */

      if (styleText) {
        y += 28;

        ctx.font = ui(700, 14);
        setLetterSpacing(ctx, "1.8px");
        const textWidth = ctx.measureText(styleText).width;
        const chipW = Math.min(textWidth + 36, contentWidth);
        const chipH = 36;

        if (draw) {
          ctx.fillStyle = COLORS.chip;
          roundedRect(ctx, x0, y, chipW, chipH, chipH / 2);
          ctx.fill();

          ctx.fillStyle = COLORS.accentDark;
          ctx.fillText(styleText, x0 + 18, y + 23);
        }

        setLetterSpacing(ctx, "0px");
        y += chipH;
      }

      /* ---- Section header helper ---- */

      const sectionHeader = (label: string, meta?: string) => {
        y += 44;

        if (draw) {
          ctx.fillStyle = COLORS.divider;
          ctx.fillRect(x0, y, contentWidth, 1.5);
        }

        y += 38;

        if (draw) {
          ctx.font = ui(700, 13);
          ctx.fillStyle = COLORS.muted;
          setLetterSpacing(ctx, "2.2px");
          ctx.fillText(label, x0, y);

          if (meta) {
            ctx.fillStyle = COLORS.faint;
            ctx.textAlign = "right";
            ctx.fillText(meta, x0 + contentWidth, y);
            ctx.textAlign = "left";
          }

          setLetterSpacing(ctx, "0px");
        }

        y += 30;
      };

      /* ---- Type system ---- */

      if (sections.fonts && typeSystem.length) {
        sectionHeader(
          "TYPE SYSTEM",
          `${typeSystem.length} ${typeSystem.length === 1 ? "FONT" : "FONTS"}`,
        );

        const panelPad = 32;
        const panelInner = contentWidth - panelPad * 2;

        typeSystem.forEach(({ font, role }, index) => {
          const family = getFontFamily(font);
          const weight = getFontWeight(font);
          const nameSize = index === 0 ? 52 : 44;

          // --- measure ---
          ctx.font = `${weight} ${nameSize}px ${family}`;
          const nameLines = wrapText(ctx, font.name, panelInner);
          const nameLineHeight = Math.round(nameSize * 1.18);

          const panelHeight =
            panelPad + // top
            34 + // role label + gap
            nameLines.length * nameLineHeight +
            panelPad; // bottom

          // --- draw ---
          if (draw) {
            ctx.fillStyle = COLORS.panel;
            roundedRect(ctx, x0, y, contentWidth, panelHeight, 20);
            ctx.fill();

            ctx.strokeStyle = COLORS.panelBorder;
            ctx.lineWidth = 1.5;
            roundedRect(
              ctx,
              x0 + 0.75,
              y + 0.75,
              contentWidth - 1.5,
              panelHeight - 1.5,
              19.5,
            );
            ctx.stroke();
          }

          let py = y + panelPad + 12;

          if (draw) {
            ctx.font = ui(700, 13);
            ctx.fillStyle = COLORS.muted;
            setLetterSpacing(ctx, "2.2px");
            ctx.fillText(role.toLocaleUpperCase(), x0 + panelPad, py);

            ctx.fillStyle = COLORS.faint;
            ctx.textAlign = "right";
            ctx.fillText(
              String(index + 1).padStart(2, "0"),
              x0 + contentWidth - panelPad,
              py,
            );
            ctx.textAlign = "left";
            setLetterSpacing(ctx, "0px");
          }

          py += 22;

          // Font name rendered in the font itself
          py += nameSize * 0.92;
          nameLines.forEach((line, i) => {
            if (draw) {
              ctx.font = `${weight} ${nameSize}px ${family}`;
              ctx.fillStyle = COLORS.ink;
              ctx.fillText(line, x0 + panelPad, py);
            }
            if (i < nameLines.length - 1) py += nameLineHeight;
          });

          y += panelHeight + (index < typeSystem.length - 1 ? 16 : 0);
        });
      }

      /* ---- Plain text sections (purpose, notes) ---- */

      const drawTextRow = (row: { label: string; value: string }) => {
        sectionHeader(row.label);

        ctx.font = ui(450, 26);
        const lines = wrapText(ctx, row.value, contentWidth);

        y += 22;
        lines.forEach((line) => {
          if (draw && line) {
            ctx.font = ui(450, 26);
            ctx.fillStyle = COLORS.body;
            ctx.fillText(line, x0, y);
          }
          y += 40;
        });
        y -= 40;
      };

      const purposeRow = textRows.find((r) => r.label === "PURPOSE");
      if (purposeRow) drawTextRow(purposeRow);

      /* ---- Font details ---- */

      if (fontDetails.length) {
        sectionHeader("FONT DETAILS");

        fontDetails.forEach((detail, index) => {
          y += 22;

          if (draw) {
            ctx.font = ui(650, 26);
            ctx.fillStyle = COLORS.ink;
            ctx.fillText(detail.name, x0, y);
          }

          if (detail.labels) {
            y += 30;
            if (draw) {
              ctx.font = ui(500, 17);
              ctx.fillStyle = COLORS.muted;
              ctx.fillText(detail.labels, x0, y);
            }
          }

          if (detail.description) {
            ctx.font = ui(450, 22);
            const lines = wrapText(ctx, detail.description, contentWidth);

            y += 6;
            lines.forEach((line) => {
              y += 33;
              if (draw && line) {
                ctx.font = ui(450, 22);
                ctx.fillStyle = COLORS.body;
                ctx.fillText(line, x0, y);
              }
            });
          }

          if (index < fontDetails.length - 1) y += 14;
        });
      }

      /* ---- Notes ---- */

      const notesRow = textRows.find((r) => r.label === "NOTES");
      if (notesRow) drawTextRow(notesRow);

      /* ---- Footer ---- */

      y += 52;

      if (draw) {
        ctx.fillStyle = COLORS.divider;
        ctx.fillRect(x0, y, contentWidth, 1.5);
      }

      y += 34;

      if (draw) {
        ctx.font = ui(500, 15);
        ctx.fillStyle = COLORS.faint;
        ctx.fillText("Made with PaletteLab", x0, y);
      }

      return y + cardPad + margin - 10;
    };

    /* ---------------------------------------------------------------- */
    /* Pass 1: measure                                                   */
    /* ---------------------------------------------------------------- */

    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");

    if (!measureCtx) {
      throw new Error("Canvas rendering is unavailable in this browser.");
    }

    const height = Math.ceil(render(measureCtx, false));

    /* ---------------------------------------------------------------- */
    /* Pass 2: draw at high resolution                                   */
    /* ---------------------------------------------------------------- */

    let scale = TARGET_SCALE;

    scale = Math.min(
      scale,
      Math.sqrt(MAX_CANVAS_PIXELS / (width * height)),
      MAX_CANVAS_SIDE / Math.max(width, height),
    );
    scale = Math.max(1, scale);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas rendering is unavailable in this browser.");
    }

    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Page background
    ctx.fillStyle = COLORS.page;
    ctx.fillRect(0, 0, width, height);

    // Card
    ctx.fillStyle = COLORS.card;
    roundedRect(
      ctx,
      margin,
      margin,
      width - margin * 2,
      height - margin * 2,
      28,
    );
    ctx.fill();

    ctx.strokeStyle = COLORS.cardBorder;
    ctx.lineWidth = 1.5;
    roundedRect(
      ctx,
      margin + 0.75,
      margin + 0.75,
      width - margin * 2 - 1.5,
      height - margin * 2 - 1.5,
      27,
    );
    ctx.stroke();

    render(ctx, true);

    /* ---------------------------------------------------------------- */
    /* PNG export                                                        */
    /* ---------------------------------------------------------------- */

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
        } else {
          reject(new Error("The browser could not create the PNG image."));
        }
      }, "image/png");
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    const safeName =
      project.name
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "font-mix";

    anchor.href = url;
    anchor.download = `${safeName}-font-mix.png`;
    anchor.hidden = true;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

    onToast(
      missingFonts.length
        ? `Exported "${project.name}", but ${missingFonts.join(", ")} couldn't be loaded and used a fallback font.`
        : `Exported "${project.name}" as a PNG card.`,
    );
  } catch (error) {
    console.error("Unable to export project font card as PNG:", error);

    onToast(
      error instanceof Error
        ? error.message
        : "Unable to export this project card as PNG.",
    );
  }
}
