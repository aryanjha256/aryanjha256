import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { profile } from "./profile";
import { dark, light, type Theme } from "./theme";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets");

const FONT_FAMILY = "'Cascadia Code','Fira Code','JetBrains Mono',Consolas,monospace";
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

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function measure(text: string): number {
  return text.length * CHAR_WIDTH;
}

function renderCard(theme: Theme): string {
  const lines = buildLines();
  const promptText = `${profile.username}@${profile.hostname}:~$`;

  const contentWidth = Math.max(
    ...lines.map((line) => {
      if (line.kind === "header") return measure(line.text);
      if (line.kind === "row") return LABEL_COLUMN + measure(line.value);
      if (line.kind === "prompt") return measure(promptText) + 24;
      return 0;
    }),
  );

  const width = Math.ceil(contentWidth + PADDING_X * 2);
  const height = CHROME_HEIGHT + lines.length * LINE_HEIGHT + PADDING_BOTTOM;

  const body: string[] = [];
  let y = CHROME_HEIGHT + LINE_HEIGHT * 0.7;

  for (const line of lines) {
    if (line.kind === "blank") {
      y += LINE_HEIGHT;
      continue;
    }

    if (line.kind === "header") {
      body.push(
        `<text x="${PADDING_X}" y="${y}" fill="${theme.title}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}" font-weight="600">${escapeXml(line.text)}</text>`,
      );
    } else if (line.kind === "divider") {
      const dash = "─".repeat(Math.max(1, Math.floor((width - PADDING_X * 2) / CHAR_WIDTH)));
      body.push(
        `<text x="${PADDING_X}" y="${y}" fill="${theme.border}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}">${dash}</text>`,
      );
    } else if (line.kind === "row") {
      body.push(
        `<text x="${PADDING_X}" y="${y}" fill="${theme.label}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}">${escapeXml(line.label)}</text>`,
      );
      body.push(
        `<text x="${PADDING_X + LABEL_COLUMN}" y="${y}" fill="${theme.value}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}">${escapeXml(line.value)}</text>`,
      );
    } else if (line.kind === "prompt") {
      body.push(
        `<text x="${PADDING_X}" y="${y}" fill="${theme.accent}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}">${escapeXml(promptText)}</text>`,
      );
      const cursorX = PADDING_X + measure(promptText) + 10;
      body.push(
        `<rect x="${cursorX}" y="${y - FONT_SIZE}" width="9" height="${FONT_SIZE + 4}" fill="${theme.accent}">` +
          `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.4;0.5;0.9;1" dur="1.2s" repeatCount="indefinite" />` +
          `</rect>`,
      );
    }

    y += LINE_HEIGHT;
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="${theme.background}" stroke="${theme.border}" stroke-width="1"/>
  <circle cx="24" cy="20" r="6" fill="#ff5f56"/>
  <circle cx="44" cy="20" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="20" r="6" fill="#27c93f"/>
  ${body.join("\n  ")}
</svg>
`;
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "about-dark.svg"), renderCard(dark));
  writeFileSync(join(OUT_DIR, "about-light.svg"), renderCard(light));
  console.log(`Generated ${join(OUT_DIR, "about-dark.svg")}`);
  console.log(`Generated ${join(OUT_DIR, "about-light.svg")}`);
}

main();
