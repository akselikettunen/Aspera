# Future Features

Features that appear in the original design mockups (`app.html`, `landing.html`) but
are **not yet implemented** in the app. The Aspera dark style itself has been integrated;
this list tracks the remaining functionality.

Status legend: 🔴 not started · 🟡 partially scaffolded · 🟢 done

---

## App (problem-solving view) — `app.html`

### 1. Countdown timer 🟡
- Per-problem countdown (e.g. `12:34`, turns red under 2 minutes).
- **Data:** `UserAttempt.timeSpentSec` exists in the schema but is never written.
- **Needed:** timer UI on the problem page; write elapsed time on submit.

### 2. Points system 🔴
- Per-problem points (`+150 pistettä`) and a running total in the nav (`2 340`).
- **Needed:** a `points` value per problem (or derived from difficulty), a user points
  total, and award logic on solve.

### 3. Streak 🔴
- Daily streak counter (`🔥 14 pvä`) in the nav.
- **Needed:** track consecutive active days per user.

### 4. Global ranking 🔴
- Nav rank (`#847`) and a "Your ranking" panel (`Suomi · Geometria`, `↑ +23 this week`).
- **Needed:** a ranking/leaderboard system derived from points; weekly deltas.

### 5. Per-problem solver leaderboard 🔴
- "This problem's solvers" list (other users + their points).
- **Needed:** a social layer so users can see other users; currently users are isolated.

### 6. Prev / Next navigation + progress dots 🔴
- Move sequentially through a problem set with prev/next and a progress-dot row.
- **Now:** user returns to Browse after each problem; no in-set flow.
- **Needed:** a notion of an ordered problem set/session and navigation between items.

### 7. Hint cap "1 / 3" 🟡
- Mockup shows hints limited to 3, with a remaining counter.
- **Data:** `HintSession` model exists but isn't used to enforce limits.
- **Now:** hints are unlimited; no cap or counter shown.
- **Needed:** enforce a max hint count and surface "x / 3" in the UI.

### 8. Filter by source 🟢 done
- Sidebar filter by competition, implemented on the practice page (combinable with
  topic + difficulty).
- Note: all current problems share one source (`MATH Dataset`), so only one option
  shows until problems with varied `competition` values are imported.

### 9. Category counts 🟢 done
- Practice sidebar now shows counts per category, difficulty, and source via `groupBy`
  / `count` queries.

### 10. Ranking & Contests sections 🔴
- Nav tabs `Ranking` and `Contests` (Kilpailut).
- **Now:** rendered as dimmed "Coming soon" placeholders in `TopNav`.
- **Needed:** real pages + backing data (Contests is a brand-new concept).

---

## Landing page — `landing.html`

The landing-page structure (hero, stats card, numbered features, CTA, footer) is
**implemented in style**. The only outstanding concept is **Contests** (see #10 above),
which is referenced as a product pillar.

---

## Quick wins (no schema changes) — ✅ done

- **#8 Filter by source** — uses existing `Problem.competition`.
- **#9 Category counts** — `groupBy` / `count` queries.

## Partially scaffolded in the DB

- **#1 Timer** — `UserAttempt.timeSpentSec` field exists.
- **#7 Hint cap** — `HintSession` model exists.

## Known limitations (not bugs)

- **Asymptote diagrams** — ~110 of 800 problem/solution fields contain `[asy]…[/asy]`
  geometry figures. KaTeX can't render Asymptote, so these show `[diagram not shown]`.
  Displaying them would need an Asymptote renderer (a real feature, not polish).

## Larger efforts (new schema + logic)

- **#2 Points**, **#3 Streak**, **#4 Ranking**, **#5 Solver leaderboard**,
  **#6 Problem-set flow**, **#10 Contests**.
