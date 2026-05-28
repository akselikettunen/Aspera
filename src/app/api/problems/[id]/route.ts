import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const problem = await prisma.problem.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      bodyLatex: true,
      solutionLatex: true,
      competition: true,
      year: true,
      difficulty: true,
      topics: true,
      answerType: true,
      answer: true,
      bodyDiagrams: true,
      solutionDiagrams: true,
    },
  });

  if (!problem) {
    return Response.json({ error: "Problem not found" }, { status: 404 });
  }

  return Response.json(problem);
}
