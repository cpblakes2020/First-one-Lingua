import { NextResponse } from "next/server";
import { buildFollowUpPrompt } from "@/lib/prompts/buildFollowUpPrompt";
import { isSupportedLanguage } from "@/lib/presets";
import type { LearnerLevel, OutputStyle } from "@/lib/types";

const learnerLevels = new Set<LearnerLevel>(["Beginner", "Intermediate", "Advanced"]);
const outputStyles = new Set<OutputStyle>(["Concise", "Detailed", "Literal", "Natural", "Formal", "Informal"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const sourceText = body?.sourceText;
  const previousResult = body?.previousResult;
  const question = body?.question;
  const sourceLanguage = body?.sourceLanguage;
  const userLanguage = body?.userLanguage;
  const learnerLevel = body?.learnerLevel;
  const outputStyle = body?.outputStyle;

  if (typeof sourceText !== "string" || !sourceText.trim() || typeof previousResult !== "string" || !previousResult.trim()) {
    return NextResponse.json({ error: "The original text and result are required." }, { status: 400 });
  }
  if (typeof question !== "string" || !question.trim() || question.length > 2000) {
    return NextResponse.json({ error: "Enter a follow-up question of 1 to 2,000 characters." }, { status: 400 });
  }
  if (typeof sourceLanguage !== "string" || !isSupportedLanguage(sourceLanguage) || typeof userLanguage !== "string" || !isSupportedLanguage(userLanguage)) {
    return NextResponse.json({ error: "Choose supported source and explanation languages." }, { status: 400 });
  }
  if (typeof learnerLevel !== "string" || !learnerLevels.has(learnerLevel as LearnerLevel) || typeof outputStyle !== "string" || !outputStyles.has(outputStyle as OutputStyle)) {
    return NextResponse.json({ error: "Choose a supported learner level and output style." }, { status: 400 });
  }

  try {
    const prompt = buildFollowUpPrompt({
      sourceText,
      previousResult,
      question,
      sourceLanguage,
      userLanguage,
      learnerLevel: learnerLevel as LearnerLevel,
      outputStyle: outputStyle as OutputStyle,
    });
    return NextResponse.json({ prompt });
  } catch {
    return NextResponse.json({ error: "The follow-up prompt could not be built." }, { status: 422 });
  }
}
