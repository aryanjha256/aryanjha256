import { profile } from "./profile";
import type { Theme } from "./theme";
import { FONT_FAMILY, cardShell, escapeXml, fadeIn, glowFilterDef, measure } from "./svg-utils";

const FONT_SIZE = 14;
const LINE_HEIGHT = 22;
const CHAR_WIDTH = FONT_SIZE * 0.6;
const PADDING_X = 28;
const CHROME_HEIGHT = 40;
const PADDING_BOTTOM = 24;
const LABEL_COLUMN = 150;

type Line =
  | { kind: "blank" }
  | { kind: "header"; text: string }
  | { kind: "divider" }
  | { kind: "row"; label: string; value: string }
  | { kind: "prompt" };

function buildLines(): Line[] {
  return [
    { kind: "header", text: `${profile.username}@${profile.hostname}` },
    { kind: "divider" },
    { kind: "blank" },
    { kind: "row", label: "OS", value: profile.os },
    { kind: "row", label: "Shell", value: profile.shell },
    { kind: "row", label: "Editor", value: profile.editor },
    { kind: "row", label: "Terminal", value: profile.terminal },
    { kind: "blank" },
    { kind: "row", label: "Languages", value: profile.languages.join(", ") },
    { kind: "row", label: "Frontend", value: profile.frontend.join(", ") },
    { kind: "row", label: "Mobile", value: profile.mobile.join(", ") },
    { kind: "row", label: "Backend", value: profile.backend.join(", ") },
    { kind: "row", label: "Database", value: profile.database.join(", ") },
    { kind: "row", label: "DevOps", value: profile.devops.join(", ") },
    { kind: "blank" },
    { kind: "row", label: "Portfolio", value: profile.links.portfolio },
    { kind: "row", label: "LinkedIn", value: profile.links.linkedin },
    { kind: "row", label: "Email", value: profile.links.email },
    { kind: "blank" },
    { kind: "prompt" },
  ];
}

export function renderAboutCard(theme: Theme): string {
  const lines = buildLines();
  const promptText = `${profile.username}@${profile.hostname}:~$`;

  const contentWidth = Math.max(
    ...lines.map((line) => {
      if (line.kind === "header") return measure(line.text, FONT_SIZE);
      if (line.kind === "row") return LABEL_COLUMN + measure(line.value, FONT_SIZE);
      if (line.kind === "prompt") return measure(promptText, FONT_SIZE) + 24;
      return 0;
    }),
  );

  const width = Math.ceil(contentWidth + PADDING_X * 2);
  const height = CHROME_HEIGHT + lines.length * LINE_HEIGHT + PADDING_BOTTOM;

  const groups: string[] = [];
  let y = CHROME_HEIGHT + LINE_HEIGHT * 0.7;
  let rowIndex = 0;

  for (const line of lines) {
    if (line.kind === "blank") {
      y += LINE_HEIGHT;
      continue;
    }

    const delay = Math.min(rowIndex * 0.045, 0.6);
    rowIndex += 1;

    if (line.kind === "header") {
      groups.push(
        fadeIn(
          `<text x="${PADDING_X}" y="${y}" fill="${theme.title}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}" font-weight="600" filter="url(#glow)">${escapeXml(line.text)}</text>`,
          delay,
        ),
      );
    } else if (line.kind === "divider") {
      const dash = "─".repeat(Math.max(1, Math.floor((width - PADDING_X * 2) / CHAR_WIDTH)));
      groups.push(
        fadeIn(
          `<text x="${PADDING_X}" y="${y}" fill="${theme.border}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}">${dash}</text>`,
          delay,
        ),
      );
    } else if (line.kind === "row") {
      groups.push(
        fadeIn(
          `<text x="${PADDING_X}" y="${y}" fill="${theme.label}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}">${escapeXml(line.label)}</text>` +
            `<text x="${PADDING_X + LABEL_COLUMN}" y="${y}" fill="${theme.value}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}">${escapeXml(line.value)}</text>`,
          delay,
        ),
      );
    } else if (line.kind === "prompt") {
      const cursorX = PADDING_X + measure(promptText, FONT_SIZE) + 10;
      groups.push(
        fadeIn(
          `<text x="${PADDING_X}" y="${y}" fill="${theme.accent}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}">${escapeXml(promptText)}</text>` +
            `<rect x="${cursorX}" y="${y - FONT_SIZE}" width="9" height="${FONT_SIZE + 4}" fill="${theme.accent}">` +
            `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.4;0.5;0.9;1" dur="1.2s" repeatCount="indefinite" />` +
            `</rect>`,
          delay,
        ),
      );
    }

    y += LINE_HEIGHT;
  }

  return cardShell({
    width,
    height,
    background: theme.background,
    border: theme.border,
    scanlineId: "about-scanlines",
    vignetteId: "about-vignette",
    vignetteColor: theme.border,
    defs: glowFilterDef("glow"),
    body: groups.join("\n  "),
  });
}
