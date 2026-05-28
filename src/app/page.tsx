import Link from "next/link";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    num: "01",
    name: "Feedback on your solution",
    body: "Submit your full solution and the AI reads it, telling you what you got right, where the error is, and how to fix it. Scored 0–5.",
  },
  {
    num: "02",
    name: "Hints when you're stuck",
    body: "If you can't make progress, ask for a hint. The AI nudges you in the right direction without giving away the answer.",
  },
  {
    num: "03",
    name: "Review reminders",
    body: "The app remembers which topics stayed weak and suggests them for review before they slip away — spaced repetition.",
  },
  {
    num: "04",
    name: "Mathematical notation",
    body: "Solutions are written in LaTeX, so your equations look the way they should. No need to mangle them into plain text.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── NAV ────────────────────────────────── */}
      <nav className="flex items-center justify-between h-[52px] px-6 sm:px-12 border-b border-line">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight text-text">
          <Logo size={17} />
          ASPERA
        </Link>
        <div className="hidden sm:flex gap-7">
          <a href="#features" className="font-mono text-[11px] tracking-[0.1em] uppercase text-sub hover:text-text transition-colors">
            Features
          </a>
          <Link href="/practice" className="font-mono text-[11px] tracking-[0.1em] uppercase text-sub hover:text-text transition-colors">
            Problems
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="font-mono text-xs px-4 py-[7px] rounded-[3px] border border-line text-sub hover:border-sub hover:text-text transition-colors tracking-[0.04em]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="font-mono text-xs px-4 py-[7px] rounded-[3px] border border-accent bg-accent text-bg font-medium hover:bg-accent-hover hover:border-accent-hover transition-colors tracking-[0.04em]"
          >
            Get started →
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────── */}
      <section className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-20 items-end px-6 sm:px-12 pt-20 pb-20 border-b border-line">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent/65 mb-6">
            AMC · AIME · IMO · Olympiad
          </p>
          <h1 className="font-extrabold tracking-[-0.04em] leading-[0.95] text-text mb-7 text-[clamp(44px,6.5vw,80px)]">
            Competitive math
            <br />
            with feedback.
          </h1>
          <p className="text-sm leading-relaxed text-sub max-w-[440px] mb-9">
            Write your full solution, and the AI tells you where you went right and where you went
            wrong. Not just correct/incorrect — real feedback on what you actually did.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/signup"
              className="font-mono text-[13px] px-[22px] py-[11px] rounded-[3px] border border-accent bg-accent text-bg font-medium hover:bg-accent-hover transition-colors tracking-[0.04em]"
            >
              Create a free account
            </Link>
            <Link
              href="/practice"
              className="font-mono text-[13px] px-[22px] py-[11px] rounded-[3px] border border-line bg-transparent text-sub hover:border-sub hover:text-text transition-colors tracking-[0.04em] inline-flex items-center"
            >
              See how it looks
            </Link>
          </div>
        </div>

        {/* Hero stats card */}
        <div className="hidden lg:block border border-line rounded-[3px]">
          {[
            { name: "Problems", val: "400+", hi: true },
            { name: "Sources", val: "AMC / AIME / IMO / SMO", small: true },
            { name: "Feedback", val: "Score 0–5" },
            { name: "Review", val: "Automatic" },
          ].map((s) => (
            <div
              key={s.name}
              className="flex items-baseline justify-between px-5 py-4 border-b border-line last:border-b-0"
            >
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-sub">
                {s.name}
              </span>
              <span
                className={`font-mono font-medium tracking-[-0.02em] ${
                  s.hi ? "text-accent" : "text-text"
                } ${s.small ? "text-[13px] tracking-[0.02em]" : "text-xl"}`}
              >
                {s.val}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section id="features" className="border-b border-line">
        <div className="px-6 sm:px-12 py-8 border-b border-line">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-sub/55">
            Features
          </span>
        </div>
        {FEATURES.map((f) => (
          <div
            key={f.num}
            className="grid sm:grid-cols-[48px_220px_1fr] gap-1.5 sm:gap-10 items-start px-6 sm:px-12 py-7 border-b border-line last:border-b-0 hover:bg-surface transition-colors"
          >
            <div className="font-mono text-[11px] text-sub/40 pt-0.5">{f.num}</div>
            <div className="text-base font-bold tracking-[-0.02em] text-text">{f.name}</div>
            <div className="text-[13px] leading-relaxed text-sub">{f.body}</div>
          </div>
        ))}
      </section>

      {/* ── CTA ────────────────────────────────── */}
      <section className="grid sm:grid-cols-[1fr_auto] gap-10 sm:gap-15 items-center px-6 sm:px-12 py-20 border-b border-line">
        <h2 className="font-extrabold tracking-[-0.04em] text-text text-[clamp(28px,4vw,44px)]">
          Try it for free.
        </h2>
        <div className="flex flex-col gap-2 items-start sm:items-end">
          <Link
            href="/signup"
            className="font-mono text-[13px] px-[22px] py-[11px] rounded-[3px] border border-accent bg-accent text-bg font-medium hover:bg-accent-hover transition-colors tracking-[0.04em]"
          >
            Create a free account →
          </Link>
          <span className="font-mono text-[11px] text-sub/60">No credit card. 400+ problems instantly.</span>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="flex items-center justify-between px-6 sm:px-12 py-5.5">
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-sub/35">Aspera — 2026</span>
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-sub/35">Per aspera ad astra</span>
      </footer>
    </div>
  );
}
