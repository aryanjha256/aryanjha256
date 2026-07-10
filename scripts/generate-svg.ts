import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAboutCard } from "./about-card";
import { fetchGithubStats } from "./github";
import { renderStatsCard } from "./stats-card";
import { dark, light } from "./theme";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets");
const GITHUB_USERNAME = "aryanjha256";

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  writeFileSync(join(OUT_DIR, "about-dark.svg"), renderAboutCard(dark));
  writeFileSync(join(OUT_DIR, "about-light.svg"), renderAboutCard(light));
  console.log("Generated assets/about-dark.svg and assets/about-light.svg");

  try {
    const stats = await fetchGithubStats(GITHUB_USERNAME);
    writeFileSync(join(OUT_DIR, "stats-dark.svg"), renderStatsCard(dark, stats));
    writeFileSync(join(OUT_DIR, "stats-light.svg"), renderStatsCard(light, stats));
    console.log("Generated assets/stats-dark.svg and assets/stats-light.svg");
  } catch (error) {
    console.error(`Skipped stats card — GitHub API fetch failed: ${(error as Error).message}`);
    process.exitCode = process.env.CI ? 1 : 0;
  }
}

void main();
