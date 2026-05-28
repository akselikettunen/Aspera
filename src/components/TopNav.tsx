import Link from "next/link";
import { Logo } from "./Logo";

type Tab = "problems" | "review" | "ranking";

/**
 * The Aspera top navigation bar.
 *
 * "Problems", "Review" and "Ranking" are wired up. "Contests" appears in the
 * mockups but has no backing data yet, so it renders as a dimmed placeholder.
 */
export function TopNav({
  active,
  initial,
  stats,
}: {
  active?: Tab;
  initial?: string;
  stats?: { label: string; value: string }[];
}) {
  return (
    <header className="flex items-center justify-between h-[50px] px-6 border-b border-line bg-bg">
      <Link href="/dashboard" className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight text-text">
        <Logo size={16} />
        ASPERA
      </Link>

      <nav className="flex items-center">
        <Link
          href="/practice"
          className={`font-mono text-[11px] tracking-[0.08em] uppercase px-4 h-[50px] flex items-center border-b-2 transition-colors ${
            active === "problems"
              ? "text-accent border-accent"
              : "text-sub border-transparent hover:text-text"
          }`}
        >
          Problems
        </Link>
        <Link
          href="/dashboard"
          className={`font-mono text-[11px] tracking-[0.08em] uppercase px-4 h-[50px] flex items-center border-b-2 transition-colors ${
            active === "review"
              ? "text-accent border-accent"
              : "text-sub border-transparent hover:text-text"
          }`}
        >
          Review
        </Link>
        <Link
          href="/ranking"
          className={`font-mono text-[11px] tracking-[0.08em] uppercase px-4 h-[50px] flex items-center border-b-2 transition-colors ${
            active === "ranking"
              ? "text-accent border-accent"
              : "text-sub border-transparent hover:text-text"
          }`}
        >
          Ranking
        </Link>
        <span
          className="font-mono text-[11px] tracking-[0.08em] uppercase px-4 h-[50px] flex items-center border-b-2 border-transparent text-sub/40 cursor-default"
          title="Coming soon"
        >
          Contests
        </span>
      </nav>

      <div className="flex items-center gap-5">
        {stats?.map((s, i) => (
          <div key={s.label} className="flex items-center gap-4">
            {i > 0 && <div className="w-px h-[18px] bg-line" />}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-text font-medium">{s.value}</span>
              <span className="text-sub">{s.label}</span>
            </div>
          </div>
        ))}
        <div className="w-px h-[18px] bg-line" />
        <div className="w-7 h-7 rounded-[3px] bg-raised border border-line flex items-center justify-center text-xs font-semibold text-accent">
          {(initial ?? "?").slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
