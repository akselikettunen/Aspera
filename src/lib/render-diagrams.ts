/**
 * Pre-renders every [asy] (Asymptote) diagram in the problem set to a PNG,
 * stores it as a base64 data URI on the Problem, so the web app (and Vercel)
 * can show diagrams with no Asymptote/LaTeX dependency at runtime.
 *
 * Requires Asymptote + BasicTeX installed locally.
 * Run with: npx tsx src/lib/render-diagrams.ts
 */

import "dotenv/config";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const execFileAsync = promisify(execFile);

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Make sure asy + latex are reachable
const ASY_ENV = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/Library/TeX/texbin:${process.env.PATH ?? ""}`,
  ASYMPTOTE_TEXPATH: "/Library/TeX/texbin",
};

const ASY_RE = /\[asy\]([\s\S]*?)\[\/asy\]/gi;

function extractAsy(text: string): string[] {
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  ASY_RE.lastIndex = 0;
  while ((m = ASY_RE.exec(text)) !== null) {
    blocks.push(m[1].trim());
  }
  return blocks;
}

// Competition diagrams assume certain modules are pre-imported.
// (olympiad.asy/cse5.asy aren't bundled with Homebrew Asymptote; geometry.asy
// covers Circle etc., and the shim helpers below supply what olympiad would.)
// The shim file defines each helper as `// @name <fn>`-tagged blocks so we can
// include only the ones a given snippet doesn't already define itself.
const SHIM_RAW = readFileSync(join(import.meta.dirname, "asy-shim.txt"), "utf8");

// Parse shim into { name -> code } using `// @name <fn>` markers.
const SHIM_HELPERS: Record<string, string> = {};
for (const chunk of SHIM_RAW.split(/(?=\/\/ @name )/)) {
  const m = chunk.match(/\/\/ @name (\w+)/);
  if (m) SHIM_HELPERS[m[1]] = chunk.trim();
}

// Build a shim preamble that omits any helper the snippet defines on its own
// (avoids "ambiguous call" errors when a block declares e.g. its own extend()).
function buildShim(code: string): string {
  const types = "path|pair|real|void|int|bool|pen|guide|picture|transform|triple";
  return Object.entries(SHIM_HELPERS)
    .filter(([name]) => !new RegExp(`\\b(?:${types})\\s+${name}\\s*\\(`).test(code))
    .map(([, body]) => body)
    .join("\n\n");
}

async function tryRender(asyCode: string, base: string): Promise<Buffer | null> {
  const srcPath = `${base}.asy`;
  await writeFile(srcPath, asyCode, "utf8");
  try {
    await execFileAsync("asy", ["-f", "png", "-render=4", "-o", base, srcPath], {
      env: ASY_ENV,
      timeout: 30000,
    });
    return await readFile(`${base}.png`);
  } catch {
    return null;
  }
}

// Strip imports of modules we don't have bundled (olympiad/cse5). The shim
// supplies the helpers those modules would have provided.
function sanitize(asyCode: string): string {
  return asyCode.replace(/import\s+(olympiad|cse5)\s*;/gi, "");
}

async function renderOne(asyCode: string, dir: string, index: number): Promise<string | null> {
  const base = join(dir, `d${index}`);
  const code = sanitize(asyCode);
  const shim = buildShim(code);
  const preambles = [
    `import geometry;\nimport graph;\n${shim}\n`,
    `import graph;\n${shim}\n`,
    `import geometry;\nimport graph;\n\n`,
    `import graph;\n\n`,
    "",
  ];
  for (const preamble of preambles) {
    const png = await tryRender(preamble + code, base);
    if (png) return `data:image/png;base64,${png.toString("base64")}`;
  }
  console.warn(`  ! failed to render diagram ${index}`);
  return null;
}

async function main() {
  const problems = await prisma.problem.findMany({
    select: { id: true, title: true, bodyLatex: true, solutionLatex: true },
  });

  let withDiagrams = 0;
  let rendered = 0;
  let failed = 0;

  for (const p of problems) {
    const bodyBlocks = extractAsy(p.bodyLatex);
    const solBlocks = extractAsy(p.solutionLatex);
    if (bodyBlocks.length === 0 && solBlocks.length === 0) continue;

    withDiagrams++;
    const dir = await mkdtemp(join(tmpdir(), "asy-"));

    try {
      const bodyDiagrams: string[] = [];
      for (let i = 0; i < bodyBlocks.length; i++) {
        const uri = await renderOne(bodyBlocks[i], dir, i);
        bodyDiagrams.push(uri ?? "");
        if (uri) rendered++; else failed++;
      }

      const solutionDiagrams: string[] = [];
      for (let i = 0; i < solBlocks.length; i++) {
        const uri = await renderOne(solBlocks[i], dir, 100 + i);
        solutionDiagrams.push(uri ?? "");
        if (uri) rendered++; else failed++;
      }

      await prisma.problem.update({
        where: { id: p.id },
        data: { bodyDiagrams, solutionDiagrams },
      });
      console.log(`✓ ${p.title} (${bodyBlocks.length + solBlocks.length} diagram(s))`);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  console.log(`\nDone. ${withDiagrams} problems had diagrams. Rendered ${rendered}, failed ${failed}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
