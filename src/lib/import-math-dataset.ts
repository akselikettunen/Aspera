/**
 * Imports problems from the Hendrycks MATH dataset on Hugging Face.
 * Run with: npx tsx src/lib/import-math-dataset.ts
 *
 * Requires HUGGINGFACE_TOKEN in your .env.local file.
 * Get a free token at: huggingface.co → Settings → Access Tokens → New token (read)
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
const DATASET = "EleutherAI/hendrycks_math";
const BATCH_SIZE = 100;

// Each config is a separate subject in the dataset
const CONFIGS: Array<{ config: string; topics: string[] }> = [
  { config: "algebra",                topics: ["algebra"] },
  { config: "intermediate_algebra",   topics: ["algebra"] },
  { config: "counting_and_probability", topics: ["combinatorics"] },
  { config: "number_theory",          topics: ["number_theory"] },
  { config: "geometry",               topics: ["geometry"] },
];

// How many problems to import per config
const LIMIT_PER_SUBJECT = 80;

// Only import difficulty levels 2–5 (Level 1 is too easy for competition prep)
const MIN_LEVEL = 2;

function extractBoxedAnswer(solution: string): string {
  const match = solution.match(/\\boxed\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/);
  return match ? match[1].trim() : "";
}

function levelToNumber(level: string): number {
  const match = level.match(/Level (\d)/);
  return match ? parseInt(match[1]) : 3;
}

async function fetchRows(config: string, split: string, offset: number, length: number) {
  const url = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DATASET)}&config=${config}&split=${split}&offset=${offset}&length=${length}`;
  const res = await fetch(url, {
    headers: HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HF API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<{
    rows: Array<{ row: { problem: string; solution: string; level: string; type: string } }>;
    num_rows_total: number;
  }>;
}

async function main() {
  if (!HF_TOKEN) {
    console.error(
      "\nMissing HUGGINGFACE_TOKEN in .env.local\n" +
      "Get a free token at: huggingface.co → Settings → Access Tokens → New token (read)\n" +
      "Then add: HUGGINGFACE_TOKEN=\"hf_your_token_here\" to your .env.local file\n"
    );
    process.exit(1);
  }

  console.log("Starting import from EleutherAI/hendrycks_math...\n");

  const countsBySubject: Record<string, number> = {};
  let imported = 0;
  let skipped = 0;

  for (const { config, topics } of CONFIGS) {
    console.log(`Fetching: ${config}`);
    let offset = 0;
    let count = 0;

    while (count < LIMIT_PER_SUBJECT) {
      const data = await fetchRows(config, "train", offset, BATCH_SIZE);
      if (data.rows.length === 0) break;

      for (const { row } of data.rows) {
        if (count >= LIMIT_PER_SUBJECT) break;

        const level = levelToNumber(row.level);
        if (level < MIN_LEVEL) { skipped++; continue; }

        const answer = extractBoxedAnswer(row.solution);

        try {
          await prisma.problem.create({
            data: {
              title: `${row.type} — Level ${level}`,
              bodyLatex: row.problem,
              solutionLatex: row.solution,
              competition: "MATH Dataset",
              difficulty: level,
              topics,
              answerType: "NUMERIC",
              answer: answer || "See solution",
            },
          });
          count++;
          imported++;
        } catch {
          skipped++;
        }
      }

      offset += BATCH_SIZE;
      if (offset > 5000) break;
    }

    countsBySubject[config] = count;
    console.log(`  → ${count} problems imported`);
  }

  console.log(`\nDone! Total imported: ${imported}, skipped: ${skipped}`);
  console.log("Breakdown:", countsBySubject);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
