import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSM2 } from "@/lib/sm2";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { problemId, userLatex } = body as {
      problemId: string;
      userLatex: string;
    };

    if (!problemId || userLatex === undefined) {
      return Response.json({ error: "Missing problemId or userLatex" }, { status: 400 });
    }

    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch the problem
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return Response.json({ error: "Problem not found" }, { status: 404 });
    }

    // Call Claude with structured output (tool use)
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [
        {
          name: "grade_solution",
          description:
            "Grade a student's math solution and provide targeted feedback.",
          input_schema: {
            type: "object" as const,
            properties: {
              score: {
                type: "number",
                description:
                  "Quality score from 0 to 5. 0-2 means incorrect or very poor. 3 means mostly correct with minor errors. 4 means correct with small issues. 5 means perfectly correct and well-explained.",
              },
              feedback: {
                type: "string",
                description:
                  "Specific, line-by-line feedback in plain text (not LaTeX). Explain exactly what was right and what was wrong. Be direct and educational.",
              },
              solved: {
                type: "boolean",
                description: "Whether the student's solution is essentially correct (score >= 3).",
              },
            },
            required: ["score", "feedback", "solved"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "grade_solution" },
      messages: [
        {
          role: "user",
          content: `You are an expert high school competitive math coach grading a student's submitted solution. The student is training for competitions such as AMC 10/12, AIME, and national math olympiads.

PROBLEM:
${problem.bodyLatex}

OFFICIAL SOLUTION:
${problem.solutionLatex}

CORRECT ANSWER: ${problem.answer}

STUDENT'S SUBMITTED WORK (LaTeX):
${userLatex || "(No work submitted)"}

Grade the student's solution as a rigorous competition math coach would. Your feedback must be specific — reference the student's actual steps, not generic advice.

Scoring guide:
0 = blank or completely off-track
1 = major conceptual error (wrong theorem, wrong setup)
2 = right general idea but critical execution error
3 = mostly correct, minor arithmetic or logical gap
4 = correct solution with small presentational or completeness issues
5 = complete, rigorous, competition-ready solution

Write feedback in plain English (no LaTeX). Point out exactly where the student's reasoning holds and where it breaks. If they used a suboptimal but valid approach, acknowledge it and mention the more elegant competition technique. If they made an error, explain the correct reasoning at that step.`,
        },
      ],
    });

    // Extract the tool call result
    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return Response.json({ error: "Failed to get grading from Claude" }, { status: 500 });
    }

    const gradeResult = toolUse.input as {
      score: number;
      feedback: string;
      solved: boolean;
    };

    const { score, feedback, solved } = gradeResult;

    // Save UserAttempt
    await prisma.userAttempt.create({
      data: {
        userId,
        problemId,
        solved,
        hintsUsed: 0,
        fullSolutionSeen: false,
      },
    });

    // Update SM-2 for each topic in the problem
    for (const topic of problem.topics) {
      const existing = await prisma.topicStats.findUnique({
        where: { userId_topic: { userId, topic } },
      });

      const currentStats = existing
        ? {
            easeFactor: existing.easeFactor,
            intervalDays: existing.intervalDays,
            repetitions: existing.repetitions,
          }
        : { easeFactor: 2.5, intervalDays: 1, repetitions: 0 };

      const updated = updateSM2(currentStats, score);

      await prisma.topicStats.upsert({
        where: { userId_topic: { userId, topic } },
        create: {
          userId,
          topic,
          easeFactor: updated.easeFactor,
          intervalDays: updated.intervalDays,
          nextReviewDate: updated.nextReviewDate,
          repetitions: updated.repetitions,
        },
        update: {
          easeFactor: updated.easeFactor,
          intervalDays: updated.intervalDays,
          nextReviewDate: updated.nextReviewDate,
          repetitions: updated.repetitions,
        },
      });
    }

    return Response.json({
      score,
      feedback,
      solved,
      correct_solution_latex: problem.solutionLatex,
    });
  } catch (error) {
    console.error("Submit error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
