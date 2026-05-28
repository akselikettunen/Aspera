export interface SM2Input {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface SM2Output {
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: Date;
  repetitions: number;
}

/**
 * Standard SM-2 spaced-repetition algorithm.
 * score: 0-5 (0-2 = fail / reset, 3-5 = pass)
 */
export function updateSM2(stats: SM2Input, score: number): SM2Output {
  let { easeFactor, intervalDays, repetitions } = stats;

  if (score < 3) {
    // Failed — reset
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Update ease factor
    const newEF = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    easeFactor = Math.max(1.3, newEF);

    // Update interval
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }

    repetitions += 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
  // Zero out time so comparisons work cleanly at the day level
  nextReviewDate.setHours(0, 0, 0, 0);

  return { easeFactor, intervalDays, nextReviewDate, repetitions };
}
