import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { problemId, userLatex, hintNumber } = body as {
      problemId: string;
      userLatex: string;
      hintNumber: number;
    };

    if (!problemId) {
      return Response.json({ error: "Missing problemId" }, { status: 400 });
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

    // Call Claude in Socratic mode
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are a high school competitive math coach giving a Socratic hint. The student is preparing for AMC 10/12, AIME, or olympiad competitions. Do NOT reveal the answer or the full solution path.

PROBLEM:
${problem.bodyLatex}

STUDENT'S CURRENT WORK (LaTeX):
${userLatex || "(Student hasn't started yet)"}

This is hint number ${hintNumber ?? 1}.

Look at where the student is stuck or what they've tried. Give ONE targeted, Socratic hint that nudges them forward without giving the game away. You can reference standard competition techniques by name (e.g. "think about modular arithmetic", "consider AM-GM here", "what if you tried casework on whether n is even or odd") — but don't apply the technique for them. Keep it to 2-4 sentences in plain English, no LaTeX.`,
        },
      ],
    });

    const hintText =
      response.content
        .filter((block) => block.type === "text")
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("") || "Try thinking about the key constraint in this problem.";

    // Upsert HintSession: find existing or create, then increment hintsRequested
    const existingSession = await prisma.hintSession.findFirst({
      where: { userId, problemId },
    });

    if (existingSession) {
      await prisma.hintSession.update({
        where: { id: existingSession.id },
        data: { hintsRequested: { increment: 1 } },
      });
    } else {
      await prisma.hintSession.create({
        data: {
          userId,
          problemId,
          hintsRequested: 1,
          fullSolutionShown: false,
        },
      });
    }

    return Response.json({ hint: hintText });
  } catch (error) {
    console.error("Hint error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
