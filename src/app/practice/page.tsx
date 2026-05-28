import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";

const TOPICS = ["algebra", "combinatorics", "number_theory", "geometry"] as const;
const DIFFICULTIES = [1, 2, 3, 4, 5] as const;
const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Fundamentals",
  2: "Medium",
  3: "Hard",
  4: "Very hard",
  5: "Olympiad",
};

type Filters = { topic?: string; difficulty?: string; competition?: string };

/** Build a /practice URL that toggles one filter key on/off, preserving the others. */
function toggleHref(current: Filters, key: keyof Filters, value: string): string {
  const next: Filters = { ...current };
  if (next[key] === value) delete next[key];
  else next[key] = value;
  // Only include keys that actually have a value — otherwise URLSearchParams
  // serializes `undefined` as the literal string "undefined".
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/practice?${qs}` : "/practice";
}

function DifficultyPips({ difficulty }: { difficulty: number }) {
  const color =
    difficulty >= 4 ? "var(--bad)" : difficulty === 3 ? "var(--hard)" : difficulty === 2 ? "var(--warn)" : "var(--good)";
  return (
    <div className="flex gap-0.5 items-center" aria-label={`Difficulty ${difficulty} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="w-[5px] h-[5px] rounded-[1px]"
          style={{ background: n <= difficulty ? color : "var(--line)" }}
        />
      ))}
    </div>
  );
}

function SidebarHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-sub/50 px-1 mt-5 mb-1.5 first:mt-0">
      {children}
    </div>
  );
}

function SidebarItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between text-[13px] px-2 py-[7px] rounded-[2px] border-l-2 transition-colors ${
        active
          ? "text-accent border-accent bg-accent/5"
          : "text-sub border-transparent hover:text-text hover:bg-white/[0.03]"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { topic, difficulty, competition } = await searchParams;
  const current: Filters = { topic, difficulty, competition };

  const difficultyNum = difficulty ? parseInt(difficulty, 10) : NaN;
  const where = {
    ...(topic ? { topics: { has: topic } } : {}),
    ...(Number.isInteger(difficultyNum) ? { difficulty: difficultyNum } : {}),
    ...(competition ? { competition } : {}),
  };

  // Fetch problems + all filter counts (counts are over the whole set, like the mockup).
  const [problems, total, topicCountPairs, diffGroups, compGroups] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true, difficulty: true, topics: true, competition: true, year: true },
    }),
    prisma.problem.count(),
    Promise.all(
      TOPICS.map(async (t) => [t, await prisma.problem.count({ where: { topics: { has: t } } })] as const)
    ),
    prisma.problem.groupBy({ by: ["difficulty"], _count: { _all: true } }),
    prisma.problem.groupBy({
      by: ["competition"],
      _count: { _all: true },
      orderBy: { _count: { competition: "desc" } },
    }),
  ]);

  const topicCounts = Object.fromEntries(topicCountPairs);
  const diffCounts = Object.fromEntries(diffGroups.map((g) => [g.difficulty, g._count._all]));
  const competitions = compGroups.map((g) => ({ name: g.competition, count: g._count._all }));

  const userName = session.user.name ?? session.user.email ?? "?";
  const hasFilter = Boolean(topic || difficulty || competition);

  return (
    <div className="min-h-screen bg-bg">
      <TopNav active="problems" initial={userName} />

      <main className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-[210px_1fr] gap-8">
        {/* ── SIDEBAR ─────────────────────────── */}
        <aside className="lg:sticky lg:top-6 self-start">
          <SidebarHead>Category</SidebarHead>
          <SidebarItem href="/practice" active={!hasFilter}>
            <span>All problems</span>
            <span className="font-mono text-[11px] opacity-50">{total}</span>
          </SidebarItem>
          {TOPICS.map((t) => (
            <SidebarItem key={t} href={toggleHref(current, "topic", t)} active={topic === t}>
              <span className="capitalize">{t.replace(/_/g, " ")}</span>
              <span className="font-mono text-[11px] opacity-50">{topicCounts[t] ?? 0}</span>
            </SidebarItem>
          ))}

          <SidebarHead>Difficulty</SidebarHead>
          {DIFFICULTIES.map((d) => (
            <SidebarItem
              key={d}
              href={toggleHref(current, "difficulty", String(d))}
              active={difficulty === String(d)}
            >
              <span className="flex items-center gap-2">
                <DifficultyPips difficulty={d} />
                {DIFFICULTY_LABELS[d]}
              </span>
              <span className="font-mono text-[11px] opacity-50">{diffCounts[d] ?? 0}</span>
            </SidebarItem>
          ))}

          {competitions.length > 0 && (
            <>
              <SidebarHead>Source</SidebarHead>
              {competitions.map((c) => (
                <SidebarItem
                  key={c.name}
                  href={toggleHref(current, "competition", c.name)}
                  active={competition === c.name}
                >
                  <span>{c.name}</span>
                  <span className="font-mono text-[11px] opacity-50">{c.count}</span>
                </SidebarItem>
              ))}
            </>
          )}
        </aside>

        {/* ── PROBLEM GRID ────────────────────── */}
        <section>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-sub/55 mb-2">Browse</p>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-text mb-6">All problems</h1>

          <p className="font-mono text-[11px] text-sub/60 mb-4">
            {problems.length} problem{problems.length !== 1 ? "s" : ""}
            {hasFilter ? " · filtered" : ""}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {problems.map((p) => (
              <Link
                key={p.id}
                href={`/problem/${p.id}`}
                className="bg-surface border border-line rounded-[3px] p-4 hover:border-sub/40 transition-colors flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-1.5 flex-wrap">
                    {p.topics.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[9px] tracking-[0.1em] uppercase px-2 py-[3px] rounded-[2px] border border-accent/25 text-accent"
                      >
                        {t.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                  <DifficultyPips difficulty={p.difficulty} />
                </div>
                <p className="text-sm font-medium text-text line-clamp-2 leading-snug">{p.title}</p>
                <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-sub/60 mt-auto">
                  {p.competition}
                  {p.year ? ` · ${p.year}` : ""}
                </p>
              </Link>
            ))}
          </div>

          {problems.length === 0 && (
            <div className="text-center py-16 text-sub font-mono text-sm">
              No problems found for this filter.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
