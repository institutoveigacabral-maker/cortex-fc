/**
 * One-time script to enrich seeded players with photos from API-Football.
 * Run: npx tsx scripts/enrich-photos.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

// Load .env.local manually
const envPath = resolve(import.meta.dirname ?? ".", "../.env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // ignore
}

const API_KEY = process.env.API_FOOTBALL_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!API_KEY) {
  console.error("API_FOOTBALL_KEY not set");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const PREMIER_LEAGUE_ID = 39;
const SEASON = 2024;

interface ApiPlayer {
  player: { id: number; name: string; photo: string };
  statistics: Array<{ team: { id: number; name: string } }>;
}

async function apiSearch(term: string): Promise<ApiPlayer[]> {
  const url = new URL("https://v3.football.api-sports.io/players");
  url.searchParams.set("search", term);
  url.searchParams.set("league", String(PREMIER_LEAGUE_ID));
  url.searchParams.set("season", String(SEASON));

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": API_KEY! },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.response ?? [];
}

function matchPlayer(players: ApiPlayer[], name: string): ApiPlayer | null {
  const lower = name.toLowerCase();
  const parts = lower.split(" ");
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  // Exact match
  const exact = players.find((p) => p.player.name.toLowerCase() === lower);
  if (exact) return exact;

  // Contains full last name + first initial
  const partial = players.find((p) => {
    const pName = p.player.name.toLowerCase();
    return pName.includes(lastName) && (pName.includes(firstName) || pName.startsWith(firstName[0] + "."));
  });
  if (partial) return partial;

  // Just contains last name (for unique names)
  const byLast = players.find((p) => p.player.name.toLowerCase().includes(lastName));
  if (byLast) return byLast;

  return null;
}

async function searchPlayer(name: string): Promise<ApiPlayer | null> {
  const parts = name.split(" ");
  const lastName = parts[parts.length - 1];
  const firstName = parts[0];

  // Try 1: search by first name (more specific for unique first names)
  let results = await apiSearch(firstName);
  let match = matchPlayer(results, name);
  if (match) return match;

  // Wait between requests
  await new Promise((r) => setTimeout(r, 400));

  // Try 2: search by last name
  results = await apiSearch(lastName);
  match = matchPlayer(results, name);
  return match;
}

async function main() {
  console.log("Fetching players without photos...\n");

  const rows = await sql`
    SELECT id, name FROM players WHERE photo_url IS NULL ORDER BY name
  `;

  console.log(`Found ${rows.length} players without photos.\n`);

  let updated = 0;
  let failed = 0;

  for (const player of rows) {
    try {
      const match = await searchPlayer(player.name);

      if (match?.player.photo) {
        await sql`
          UPDATE players
          SET photo_url = ${match.player.photo},
              external_id = ${String(match.player.id)}
          WHERE id = ${player.id}
        `;
        console.log(`  [OK] ${player.name} -> ${match.player.photo}`);
        updated++;
      } else {
        console.log(`  [--] ${player.name} — no match`);
        failed++;
      }

      // Rate limit: 500ms between requests (free tier = 100/day)
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(`  [ERR] ${player.name}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed, ${rows.length} total`);
}

main().catch(console.error);
