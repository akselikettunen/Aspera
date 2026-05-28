/**
 * Adds easy (Level 1) problems from the MATH dataset — these were skipped by the
 * original import (which started at Level 2). Dedupes against existing problems.
 *
 * Run with: npx tsx src/lib/import-easy.ts
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
const DATASET = "EleutherAI/hendrycks_math";
const BATCH_SIZE = 100;

// Only genuine competition subjects — NOT prealgebra (that tier is basic
// textbook material, not competition problems).
const CONFIGS: Array<{ config: string; topics: string[] }> = [
  { config: "algebra", topics: ["algebra"] },
  { config: "counting_and_probability", topics: ["combinatorics"] },
  { config: "number_theory", topics: ["number_theory"] },
  { config: "geometry", topics: ["geometry"] },
];

const LIMIT_PER_SUBJECT = 20; // ~80 easy problems total

function extractBoxedAnswer(solution: string): string {
  const match = solution.match(/\\boxed\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/);
  return match ? match[1].trim() : "";
}

function levelToNumber(level: string): number {
  const m = level.match(/Level (\d)/);
  return m ? parseInt(m[1]) : 3;
}

async function fetchRows(config: string, offset: number, length: number) {
  const url = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DATASET)}&config=${config}&split=train&offset=${offset}&length=${length}`;
  const res = await fetch(url, { headers: HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {} });
  if (!res.ok) throw new Error(`HF API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{
    rows: Array<{ row: { problem: string; solution: string; level: string; type: string } }>;
  }>;
}

async function main() {
  if (!HF_TOKEN) {
    console.error("Missing HUGGINGFACE_TOKEN in .env.local");
    process.exit(1);
  }

  // Dedupe against what's already stored.
  const existing = new Set(
    (await prisma.problem.findMany({ select: { bodyLatex: true } })).map((p) => p.bodyLatex)
  );

  let imported = 0;
  for (const { config, topics } of CONFIGS) {
    console.log(`Fetching easy ${config}...`);
    let offset = 0;
    let count = 0;

    while (count < LIMIT_PER_SUBJECT && offset < 4000) {
      const data = await fetchRows(config, offset, BATCH_SIZE);
      if (data.rows.length === 0) break;

      for (const { row } of data.rows) {
        if (count >= LIMIT_PER_SUBJECT) break;
        if (levelToNumber(row.level) !== 1) continue; // Level 1 only
        if (existing.has(row.problem)) continue;

        try {
          await prisma.problem.create({
            data: {
              title: `${row.type} — Level 1`,
              bodyLatex: row.problem,
              solutionLatex: row.solution,
              competition: "MATH Dataset",
              difficulty: 1,
              topics,
              answerType: "NUMERIC",
              answer: extractBoxedAnswer(row.solution) || "See solution",
            },
          });
          existing.add(row.problem);
          count++;
          imported++;
        } catch {
          /* skip */
        }
      }
      offset += BATCH_SIZE;
    }
    console.log(`  → ${count} easy problems added for ${config}`);
  }

  console.log(`\nDone. Added ${imported} easy (Level 1) problems.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
