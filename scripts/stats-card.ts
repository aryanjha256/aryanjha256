import type { GithubStats } from "./github";
import { profile } from "./profile";
import type { Theme } from "./theme";
import {
  FONT_FAMILY,
  cardShell,
  escapeXml,
  fadeIn,
  glowFilterDef,
  heatmapOpacity,
  languageColor,
  measure,
} from "./svg-utils";

const WIDTH = 640;
const PADDING_X = 28;
const CHROME_HEIGHT = 40;
const PADDING_BOTTOM = 24;
const INNER_WIDTH = WIDTH - PADDING_X * 2;
const STREAK_COLOR = "#f97316";

function iconStar(x: number, y: number, r: number, color: string): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    points.push(`${(x + radius * Math.cos(angle)).toFixed(1)},${(y + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `<polygon points="${points.join(" ")}" fill="${color}"/>`;
}

function iconFork(x: number, y: number, size: number, color: string): string {
  const r = size * 0.14;
  const top = size * 0.32;
  return `<circle cx="${x - size * 0.28}" cy="${y - top}" r="${r}" fill="none" stroke="${color}" stroke-width="1.4"/>
    <circle cx="${x + size * 0.28}" cy="${y - top}" r="${r}" fill="none" stroke="${color}" stroke-width="1.4"/>
    <circle cx="${x}" cy="${y + top}" r="${r}" fill="none" stroke="${color}" stroke-width="1.4"/>
    <path d="M${x - size * 0.28},${y - top + r} V${y} H${x + size * 0.28} V${y - top + r}" fill="none" stroke="${color}" stroke-width="1.4"/>
    <path d="M${x},${y} V${y + top - r}" fill="none" stroke="${color}" stroke-width="1.4"/>`;
}

function iconRepo(x: number, y: number, size: number, color: string): string {
  const w = size * 0.8;
  const h = size * 0.6;
  return `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="2" fill="none" stroke="${color}" stroke-width="1.4"/>
    <rect x="${x - w / 2}" y="${y - h / 2 - 3}" width="${w * 0.4}" height="4" rx="1.5" fill="${color}"/>`;
}

function iconUsers(x: number, y: number, size: number, color: string): string {
  return `<circle cx="${x - size * 0.16}" cy="${y - size * 0.1}" r="${size * 0.16}" fill="none" stroke="${color}" stroke-width="1.4"/>
    <circle cx="${x + size * 0.2}" cy="${y + size * 0.12}" r="${size * 0.13}" fill="${color}"/>`;
}

function iconFlame(x: number, y: number, size: number, color: string): string {
  return `<circle cx="${x}" cy="${y}" r="${size * 0.22}" fill="${color}"/>`;
}

function iconCalendar(x: number, y: number, size: number, color: string): string {
  const w = size * 0.7;
  const h = size * 0.6;
  return `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="2" fill="none" stroke="${color}" stroke-width="1.4"/>
    <line x1="${x - w / 2}" y1="${y - h / 2 + h * 0.3}" x2="${x + w / 2}" y2="${y - h / 2 + h * 0.3}" stroke="${color}" stroke-width="1.2"/>`;
}

function formatAccountAge(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  let months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  if (now.getDate() < created.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years <= 0) return `${Math.max(months, 0)}mo`;
  return remainder === 0 ? `${years}y` : `${years}y ${remainder}mo`;
}

function sectionLabel(text: string, y: number, color: string): string {
  return `<text x="${PADDING_X}" y="${y}" fill="${color}" font-family="${FONT_FAMILY}" font-size="11" letter-spacing="1.5" font-weight="600">${text.toUpperCase()}</text>`;
}

export function renderStatsCard(theme: Theme, stats: GithubStats): string {
  const chips: { icon: (x: number, y: number, size: number, color: string) => string; label: string; value: string; warm?: boolean }[] = [
    { icon: iconStar, label: "Stars", value: String(stats.stars) },
    { icon: iconFork, label: "Forks", value: String(stats.forks) },
    { icon: iconRepo, label: "Repos", value: String(stats.publicRepos) },
    { icon: iconUsers, label: "Followers", value: String(stats.followers) },
    { icon: iconFlame, label: "Streak", value: `${stats.currentStreak}d`, warm: true },
    { icon: iconCalendar, label: "Since", value: formatAccountAge(stats.accountCreated) },
  ];

  const hasLanguages = stats.topLanguages.length > 0;
  const hasCommits = stats.recentCommits.length > 0;
  const hasHeatmap = stats.heatmapWeeks.length > 0;

  const groups: string[] = [];
  let y = CHROME_HEIGHT + 16;
  let delayStep = 0;
  const nextDelay = () => Math.min((delayStep += 1) * 0.05, 0.6);

  const headerText = `${profile.username}@${profile.hostname} — live stats`;
  groups.push(
    fadeIn(
      `<text x="${PADDING_X}" y="${y}" fill="${theme.title}" font-family="${FONT_FAMILY}" font-size="14" font-weight="600" filter="url(#glow)">${escapeXml(headerText)}</text>`,
      nextDelay(),
    ),
  );
  if (stats.status?.message) {
    const statusText = `${stats.status.emoji ?? ""} ${stats.status.message}`.trim();
    groups.push(
      fadeIn(
        `<text x="${WIDTH - PADDING_X}" y="${y}" text-anchor="end" fill="${theme.value}" font-family="${FONT_FAMILY}" font-size="12">${escapeXml(statusText)}</text>`,
        nextDelay(),
      ),
    );
  }
  y += 14;
  const dash = "─".repeat(Math.floor(INNER_WIDTH / (14 * 0.6)));
  groups.push(fadeIn(`<text x="${PADDING_X}" y="${y}" fill="${theme.border}" font-family="${FONT_FAMILY}" font-size="14">${dash}</text>`, nextDelay()));
  y += 30;

  groups.push(fadeIn(sectionLabel("Stats", y, theme.border), nextDelay()));
  y += 16;

  const cols = 3;
  const gap = 14;
  const chipWidth = (INNER_WIDTH - gap * (cols - 1)) / cols;
  const chipHeight = 52;
  const rowGap = 10;

  chips.forEach((chip, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const chipX = PADDING_X + col * (chipWidth + gap);
    const chipY = y + row * (chipHeight + rowGap);
    const iconColor = chip.warm ? STREAK_COLOR : theme.accent;
    const centerX = chipX + 20;
    const centerY = chipY + chipHeight / 2;

    groups.push(
      fadeIn(
        `<rect x="${chipX}" y="${chipY}" width="${chipWidth}" height="${chipHeight}" rx="8" fill="${theme.border}" fill-opacity="0.08" stroke="${theme.border}" stroke-opacity="0.4"/>` +
          chip.icon(centerX, centerY, 20, iconColor) +
          `<text x="${chipX + 36}" y="${centerY - 2}" fill="${theme.value}" font-family="${FONT_FAMILY}" font-size="17" font-weight="700">${escapeXml(chip.value)}</text>` +
          `<text x="${chipX + 36}" y="${centerY + 14}" fill="${theme.label}" font-family="${FONT_FAMILY}" font-size="9.5" letter-spacing="1">${chip.label.toUpperCase()}</text>`,
        nextDelay(),
      ),
    );
  });

  const chipRows = Math.ceil(chips.length / cols);
  y += chipRows * chipHeight + (chipRows - 1) * rowGap + 30;

  if (hasHeatmap) {
    groups.push(
      fadeIn(
        sectionLabel("Contributions", y, theme.border) +
          `<text x="${WIDTH - PADDING_X}" y="${y}" text-anchor="end" fill="${theme.label}" font-family="${FONT_FAMILY}" font-size="11">${stats.totalContributions} total</text>`,
        nextDelay(),
      ),
    );
    y += 14;

    const cell = 10;
    const cellGap = 3;
    const heatmapTop = y;
    const cellsBody: string[] = [];
    stats.heatmapWeeks.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        const cx = PADDING_X + weekIndex * (cell + cellGap);
        const cy = heatmapTop + dayIndex * (cell + cellGap);
        const opacity = heatmapOpacity(day.count);
        const fill = day.count <= 0 ? theme.border : theme.accent;
        const baseOpacity = day.count <= 0 ? 0.35 : opacity;
        cellsBody.push(`<rect x="${cx}" y="${cy}" width="${cell}" height="${cell}" rx="2" fill="${fill}" fill-opacity="${baseOpacity}"/>`);
      });
    });
    groups.push(fadeIn(cellsBody.join("\n    "), nextDelay()));
    y += 7 * (cell + cellGap) + 26;
  }

  if (hasLanguages) {
    groups.push(fadeIn(sectionLabel("Languages", y, theme.border), nextDelay()));
    y += 16;

    const barHeight = 12;
    const totalCount = stats.topLanguages.reduce((sum, lang) => sum + lang.count, 0);
    let barX = PADDING_X;
    const barSegments: string[] = [];
    stats.topLanguages.forEach((lang) => {
      const segWidth = Math.max((lang.count / totalCount) * INNER_WIDTH, 3);
      barSegments.push(`<rect x="${barX}" y="${y}" width="${segWidth}" height="${barHeight}" fill="${languageColor(lang.name, theme.accent)}"/>`);
      barX += segWidth;
    });
    groups.push(fadeIn(`<clipPath id="lang-clip"><rect x="${PADDING_X}" y="${y}" width="${INNER_WIDTH}" height="${barHeight}" rx="6"/></clipPath><g clip-path="url(#lang-clip)">${barSegments.join("")}</g>`, nextDelay()));
    y += barHeight + 16;

    let legendX = PADDING_X;
    const legendBody: string[] = [];
    stats.topLanguages.forEach((lang) => {
      const dotColor = languageColor(lang.name, theme.accent);
      const label = lang.name;
      legendBody.push(`<circle cx="${legendX + 4}" cy="${y - 4}" r="4" fill="${dotColor}"/>`);
      legendBody.push(`<text x="${legendX + 12}" y="${y}" fill="${theme.value}" font-family="${FONT_FAMILY}" font-size="11">${escapeXml(label)}</text>`);
      legendX += 12 + measure(label, 11) + 20;
    });
    groups.push(fadeIn(legendBody.join("\n    "), nextDelay()));
    y += 26;
  }

  if (hasCommits) {
    groups.push(fadeIn(sectionLabel("Recent Commits", y, theme.border), nextDelay()));
    y += 18;
    stats.recentCommits.forEach((commit) => {
      const maxMessageChars = Math.floor((INNER_WIDTH - measure(`${commit.sha}  `, 12) - measure(` (${commit.repo})`, 12)) / (12 * 0.6));
      const message = commit.message.length > maxMessageChars ? `${commit.message.slice(0, Math.max(maxMessageChars - 1, 0))}…` : commit.message;
      groups.push(
        fadeIn(
          `<text x="${PADDING_X}" y="${y}" font-family="${FONT_FAMILY}" font-size="12">` +
            `<tspan fill="${theme.border}">${commit.sha}</tspan>` +
            `<tspan fill="${theme.value}">  ${escapeXml(message)}</tspan>` +
            `<tspan fill="${theme.label}"> (${escapeXml(commit.repo)})</tspan>` +
            `</text>`,
          nextDelay(),
        ),
      );
      y += 20;
    });
    y += 8;
  }

  const promptText = `${profile.username}@${profile.hostname}:~$`;
  const cursorX = PADDING_X + measure(promptText, 14) + 10;
  groups.push(
    fadeIn(
      `<text x="${PADDING_X}" y="${y}" fill="${theme.accent}" font-family="${FONT_FAMILY}" font-size="14">${escapeXml(promptText)}</text>` +
        `<rect x="${cursorX}" y="${y - 14}" width="9" height="18" fill="${theme.accent}">` +
        `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.4;0.5;0.9;1" dur="1.2s" repeatCount="indefinite" />` +
        `</rect>`,
      nextDelay(),
    ),
  );
  y += PADDING_BOTTOM;

  const height = Math.ceil(y);

  return cardShell({
    width: WIDTH,
    height,
    background: theme.background,
    border: theme.border,
    scanlineId: "stats-scanlines",
    vignetteId: "stats-vignette",
    vignetteColor: theme.border,
    defs: glowFilterDef("glow"),
    body: groups.join("\n  "),
  });
}
