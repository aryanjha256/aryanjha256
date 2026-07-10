export const FONT_FAMILY = "'Cascadia Code','Fira Code','JetBrains Mono',Consolas,monospace";

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function charWidth(fontSize: number): number {
  return fontSize * 0.6;
}

export function measure(text: string, fontSize: number): number {
  return text.length * charWidth(fontSize);
}

export function windowChrome(): string {
  return `<circle cx="24" cy="20" r="6" fill="#ff5f56"/>
  <circle cx="44" cy="20" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="20" r="6" fill="#27c93f"/>`;
}

export function glowFilterDef(id: string): string {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`;
}

export function scanlinePatternDef(id: string): string {
  return `<pattern id="${id}" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect width="3" height="1.4" fill="#000000" opacity="0.06"/>
    </pattern>`;
}

export function vignetteDef(id: string, color: string): string {
  return `<radialGradient id="${id}" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.12"/>
    </radialGradient>`;
}

export function cardShell(opts: {
  width: number;
  height: number;
  background: string;
  border: string;
  scanlineId: string;
  vignetteId: string;
  vignetteColor: string;
  defs: string;
  body: string;
}): string {
  const { width, height, background, border, scanlineId, vignetteId, vignetteColor, defs, body } = opts;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${scanlinePatternDef(scanlineId)}
    ${vignetteDef(vignetteId, vignetteColor)}
    ${defs}
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="${background}" stroke="${border}" stroke-width="1"/>
  ${windowChrome()}
  ${body}
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="11" fill="url(#${vignetteId})"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="11" fill="url(#${scanlineId})"/>
</svg>
`;
}

let fadeCounter = 0;
export function fadeIn(inner: string, delaySeconds: number): string {
  fadeCounter += 1;
  return `<g opacity="0">
    <animate attributeName="opacity" from="0" to="1" begin="${delaySeconds.toFixed(2)}s" dur="0.35s" fill="freeze"/>
    ${inner}
  </g>`;
}

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Dart: "#00B4AB",
  SQL: "#e38c00",
  Vue: "#41b883",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Kotlin: "#A97BFF",
};

export function languageColor(name: string, fallback: string): string {
  return LANGUAGE_COLORS[name] ?? fallback;
}

export function heatmapOpacity(count: number): number {
  if (count <= 0) return 1;
  if (count <= 2) return 0.4;
  if (count <= 5) return 0.6;
  if (count <= 9) return 0.8;
  return 1;
}
