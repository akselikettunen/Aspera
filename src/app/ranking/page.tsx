import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const meId = session.user.id;

  // Distinct problems solved per user — the ranking metric.
  const solved = await prisma.userAttempt.findMany({
    where: { solved: true },
    select: { userId: true, problemId: true },
    distinct: ["userId", "problemId"],
  });

  const solvedByUser = new Map<string, number>();
  for (const a of solved) {
    solvedByUser.set(a.userId, (solvedByUser.get(a.userId) ?? 0) + 1);
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  const rows = users
    .map((u) => ({
      id: u.id,
      username: u.username,
      solved: solvedByUser.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.solved - a.solved || a.username.localeCompare(b.username));

  const medal = (rank: number) =>
    rank === 1 ? "var(--good)" : rank === 2 ? "var(--warn)" : rank === 3 ? "var(--hard)" : "var(--line)";

  return (
    <div className="min-h-screen bg-bg">
      <TopNav active="ranking" initial={session.user.name ?? "?"} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-sub/55 mb-2">Leaderboard</p>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text mb-1">Ranking</h1>
        <p className="text-sub text-sm mb-8">Ranked by distinct problems solved.</p>

        {/* Header row */}
        <div className="grid grid-cols-[48px_1fr_auto] gap-4 px-4 pb-3 border-b border-line">
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-sub/55">#</span>
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-sub/55">User</span>
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-sub/55">Solved</span>
        </div>

        <div className="divide-y divide-line">
          {rows.map((r, i) => {
            const rank = i + 1;
            const isMe = r.id === meId;
            return (
              <div
                key={r.id}
                className={`grid grid-cols-[48px_1fr_auto] gap-4 items-center px-4 py-3.5 ${
                  isMe ? "bg-surface" : ""
                }`}
              >
                <span
                  className="font-mono text-sm font-medium tabular-nums"
                  style={{ color: medal(rank) === "var(--line)" ? "var(--sub)" : medal(rank) }}
                >
                  {rank}
                </span>
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-[3px] bg-raised border border-line flex items-center justify-center text-[11px] font-semibold text-accent shrink-0">
                    {r.username.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-sm text-text truncate">
                    {r.username}
                    {isMe && <span className="ml-2 font-mono text-[10px] text-accent tracking-[0.1em] uppercase">you</span>}
                  </span>
                </span>
                <span className="font-mono text-sm text-text tabular-nums">{r.solved}</span>
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-16 text-sub font-mono text-sm">No users yet.</div>
        )}
      </main>
    </div>
  );
}
