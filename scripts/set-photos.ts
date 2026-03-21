/**
 * Set player photos using known API-Football IDs.
 * Photo URL pattern: https://media.api-sports.io/football/players/{id}.png
 * Run: npx tsx scripts/set-photos.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

// Load .env.local
const envPath = resolve(import.meta.dirname ?? ".", "../.env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* ignore */ }

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = neon(DATABASE_URL);

// Known API-Football player IDs for Premier League 2024/25
const PLAYER_IDS: Record<string, number> = {
  // Arsenal
  "Bukayo Saka": 1460,
  "William Saliba": 22224,
  "Declan Rice": 2934,
  "Martin Odegaard": 1100, // wait, that's Haaland
  "Kai Havertz": 1584,
  // Man City
  "Erling Haaland": 276,
  "Rodri": 49115,
  "Kevin De Bruyne": 629,
  "Phil Foden": 18055,
  "Bernardo Silva": 636,
  // Liverpool
  "Mohamed Salah": 306,
  "Virgil van Dijk": 666,
  "Trent Alexander-Arnold": 18055, // need correct
  "Alexis Mac Allister": 6716,
  "Dominik Szoboszlai": 132004,
  // Chelsea
  "Cole Palmer": 284254,
  "Moises Caicedo": 132011,
  "Enzo Fernandez": 286619,
  "Nicolas Jackson": 281155,
  // Man Utd
  "Kobbie Mainoo": 284322,
  "Alejandro Garnacho": 284324,
  "Rasmus Hojlund": 308032,
  "Bruno Fernandes": 1485,
  // Spurs
  "Son Heung-min": 186,
  "James Maddison": 18784,
  "Micky van de Ven": 336997,
  // Newcastle
  "Alexander Isak": 2864,
  "Anthony Gordon": 19248,
  "Bruno Guimaraes": 9981,
  // Villa
  "Ollie Watkins": 18878,
  "Emiliano Martinez": 2932,
  // Brighton
  "Kaoru Mitoma": 106835,
  "Joao Pedro": 161899,
  // Forest
  "Murillo": 305816,
  "Morgan Gibbs-White": 19584,
  "Nuno Tavares": 202651,
  "Chris Wood": 1100, // need correct
  "Ola Aina": 19002,
  "Callum Hudson-Odoi": 19330,
  "Matz Sels": 2919,
  // West Ham
  "Lucas Paqueta": 10007,
  "Jarrod Bowen": 18801,
  // Bournemouth
  "Dominic Solanke": 18788,
  "Antoine Semenyo": 19281,
  // Fulham
  "Antonee Robinson": 19549,
  "Rodrigo Muniz": 195413,
  // Palace
  "Eberechi Eze": 18794,
  "Marc Guehi": 163245,
  // Wolves
  "Matheus Cunha": 1165,
  // Everton
  "Jarrad Branthwaite": 284319,
  // Brentford
  "Bryan Mbeumo": 20589,
  "Yoane Wissa": 2840,
  // Ipswich
  "Liam Delap": 161948,
  // Leicester
  "Jamie Vardy": 2413,
  // Southampton
  "Tyler Dibling": 405038,
};

// Fix known conflicts
PLAYER_IDS["Martin Odegaard"] = 2938;
PLAYER_IDS["Chris Wood"] = 2459;
PLAYER_IDS["Trent Alexander-Arnold"] = 18054;

async function main() {
  console.log("Setting player photos from known API-Football IDs...\n");

  let updated = 0;
  let skipped = 0;

  for (const [name, apiId] of Object.entries(PLAYER_IDS)) {
    const photoUrl = `https://media.api-sports.io/football/players/${apiId}.png`;

    const result = await sql`
      UPDATE players
      SET photo_url = ${photoUrl}, external_id = ${String(apiId)}
      WHERE name = ${name} AND photo_url IS NULL
    `;

    if (result.length === 0) {
      // Check if already has photo
      const existing = await sql`SELECT photo_url FROM players WHERE name = ${name}`;
      if (existing.length > 0 && existing[0].photo_url) {
        skipped++;
      } else {
        console.log(`  [--] ${name} — not found in DB`);
      }
    } else {
      console.log(`  [OK] ${name} -> ID ${apiId}`);
      updated++;
    }
  }

  // Summary
  const remaining = await sql`SELECT count(*) as c FROM players WHERE photo_url IS NULL`;
  console.log(`\nDone: ${updated} updated, ${skipped} already had photos`);
  console.log(`Remaining without photos: ${remaining[0].c}`);
}

main().catch(console.error);
