import { NextResponse } from "next/server";
import { listTaskRuns, saveTaskRun } from "@/lib/storage/task-runs";
import { isSupportedLanguage } from "@/lib/presets";
import { getPromptTemplate } from "@/lib/prompts/templates";
import type { LearnerLevel, OutputStyle, PromptTemplateId } from "@/lib/types";

const learnerLevels = new Set<LearnerLevel>(["Beginner", "Intermediate", "Advanced"]);
const outputStyles = new Set<OutputStyle>(["Concise", "Detailed", "Literal", "Natural", "Formal", "Informal"]);

export async function GET() {
  return NextResponse.json({ taskRuns: await listTaskRuns() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const sourceText = body?.sourceText;
  const result = body?.result;
  const sourceLanguage = body?.sourceLanguage;
  const userLanguage = body?.userLanguage;
  const learnerLevel = body?.learnerLevel;
  const outputStyle = body?.outputStyle;
  const promptTemplateId = body?.promptTemplateId;

  if (typeof sourceText !== "string" || !sourceText.trim() || sourceText.length > 12000 || typeof result !== "string" || !result.trim()) {
    return NextResponse.json({ error: "A source text and completed result are required." }, { status: 400 });
  }
  if (typeof sourceLanguage !== "string" || !isSupportedLanguage(sourceLanguage) || typeof userLanguage !== "string" || !isSupportedLanguage(userLanguage)) {
    return NextResponse.json({ error: "Choose supported source and explanation languages." }, { status: 400 });
  }
  if (typeof learnerLevel !== "string" || !learnerLevels.has(learnerLevel as LearnerLevel) || typeof outputStyle !== "string" || !outputStyles.has(outputStyle as OutputStyle)) {
    return NextResponse.json({ error: "Choose a supported learner level and output style." }, { status: 400 });
  }
  if (typeof promptTemplateId !== "string" || !getPromptTemplate(promptTemplateId as PromptTemplateId)) {
    return NextResponse.json({ error: "Choose a supported prompt template." }, { status: 400 });
  }

  const taskRun = await saveTaskRun({
    sourceText: sourceText.trim(),
    result: result.trim(),
    notes: "",
    sourceLanguage,
    userLanguage,
    learnerLevel: learnerLevel as LearnerLevel,
    outputStyle: outputStyle as OutputStyle,
    promptTemplateId: promptTemplateId as PromptTemplateId,
  });
  return NextResponse.json({ taskRun }, { status: 201 });
}
