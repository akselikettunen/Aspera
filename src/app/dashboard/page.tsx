import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";

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

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userName = session.user.name ?? session.user.email ?? "there";

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Get all topics due for review
  const dueTopicStats = await prisma.topicStats.findMany({
    where: {
      userId,
      nextReviewDate: { lte: today },
    },
    orderBy: { nextReviewDate: "asc" },
  });

  // Get problems the user has already attempted
  const attemptedProblemIds = await prisma.userAttempt
    .findMany({
      where: { userId },
      select: { problemId: true },
    })
    .then((attempts) => attempts.map((a) => a.problemId));

  // For each due topic, find one unseen problem (lowest difficulty first)
  const reviewCards: Array<{
    topic: string;
    problem: {
      id: string;
      title: string;
      difficulty: number;
      competition: string;
      year: number | null;
    };
  }> = [];

  for (const stat of dueTopicStats) {
    const problem = await prisma.problem.findFirst({
      where: {
        topics: { has: stat.topic },
        id: { notIn: attemptedProblemIds.length > 0 ? attemptedProblemIds : undefined },
      },
      orderBy: { difficulty: "asc" },
      select: {
        id: true,
        title: true,
        difficulty: true,
        competition: true,
        year: true,
      },
    });

    if (problem) {
      reviewCards.push({ topic: stat.topic, problem });
    }
  }

  // Total problems solved
  const totalSolved = await prisma.userAttempt.count({
    where: { userId, solved: true },
  });

  return (
    <div className="min-h-screen bg-bg">
      <TopNav
        active="review"
        initial={userName}
        stats={[
          { label: "solved", value: String(totalSolved) },
          { label: "due", value: String(reviewCards.length) },
        ]}
      />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Greeting */}
        <div className="mb-9">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-sub/55 mb-2">Dashboard</p>
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-text">
            Welcome back, {userName.split(" ")[0]}.
          </h2>
          <p className="text-sub mt-1 text-sm">
            {reviewCards.length > 0
              ? `You have ${reviewCards.length} topic${reviewCards.length !== 1 ? "s" : ""} due for review today.`
              : "You're all caught up for today."}
          </p>
        </div>

        {reviewCards.length > 0 ? (
          <>
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-sub/55 mb-4">
              Due for review
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {reviewCards.map(({ topic, problem }) => (
                <div
                  key={`${topic}-${problem.id}`}
                  className="bg-surface border border-line rounded-[3px] p-5 flex flex-col gap-3 hover:border-sub/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-2 py-[3px] rounded-[2px] border border-accent/25 text-accent">
                      {topic.replace(/_/g, " ")}
                    </span>
                    <DifficultyPips difficulty={problem.difficulty} />
                  </div>

                  <p className="text-text font-medium text-sm leading-snug">{problem.title}</p>

                  <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-sub/60">
                    {problem.competition}
                    {problem.year ? ` · ${problem.year}` : ""}
                  </p>

                  <Link
                    href={`/problem/${problem.id}`}
                    className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-accent text-bg font-mono text-[12px] tracking-[0.04em] font-medium rounded-[2px] hover:bg-accent-hover transition-colors"
                  >
                    Practice →
                  </Link>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-surface border border-line rounded-[3px] p-10 text-center">
            <div className="text-4xl mb-4">✦</div>
            <h3 className="text-lg font-semibold text-text mb-2">You&apos;re all caught up.</h3>
            <p className="text-sub text-sm mb-6">
              No topics are due for review right now. Come back tomorrow, or explore new problems to
              expand your skills.
            </p>
            <Link
              href="/practice"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-accent text-bg font-mono text-[12px] tracking-[0.04em] font-medium rounded-[2px] hover:bg-accent-hover transition-colors"
            >
              Browse all problems →
            </Link>
          </div>
        )}

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { val: totalSolved, label: "Problems solved", color: "text-accent" },
            { val: dueTopicStats.length, label: "Topics tracked", color: "text-text" },
            { val: reviewCards.length, label: "Due today", color: "text-good" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface border border-line rounded-[3px] p-5 text-center last:col-span-2 sm:last:col-span-1"
            >
              <p className={`font-mono text-3xl font-medium tracking-[-0.03em] ${s.color}`}>{s.val}</p>
              <p className="font-mono text-[9px] text-sub/60 mt-2 uppercase tracking-[0.14em]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
