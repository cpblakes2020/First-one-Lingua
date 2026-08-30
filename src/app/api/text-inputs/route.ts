import { NextResponse } from "next/server";
import { isSupportedLanguage } from "@/lib/presets";
import { storeTextInput } from "@/lib/storage/text-inputs";
import type { LearnerLevel, OutputStyle } from "@/lib/types";

const MAX_TEXT_LENGTH = 12000;
const learnerLevels = new Set<LearnerLevel>(["Beginner", "Intermediate", "Advanced"]);
const outputStyles = new Set<OutputStyle>(["Concise", "Detailed", "Literal", "Natural", "Formal", "Informal"]);

type TextInputRequest = {
  text?: unknown;
  sourceLanguage?: unknown;
  userLanguage?: unknown;
  learnerLevel?: unknown;
  outputStyle?: unknown;
};

export async function POST(request: Request) {
  let body: TextInputRequest;
  try {
    body = await request.json() as TextInputRequest;
  } catch {
    return NextResponse.json({ error: "Send the study text as JSON." }, { status: 400 });
  }

  if (typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "Enter some text before saving the study input." }, { status: 400 });
  }
  if (body.text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "Study text cannot exceed 12,000 characters." }, { status: 413 });
  }
  if (typeof body.sourceLanguage !== "string" || !isSupportedLanguage(body.sourceLanguage)) {
    return NextResponse.json({ error: "Choose a supported source language." }, { status: 400 });
  }
  if (typeof body.userLanguage !== "string" || !isSupportedLanguage(body.userLanguage)) {
    return NextResponse.json({ error: "Choose a supported explanation language." }, { status: 400 });
  }
  if (typeof body.learnerLevel !== "string" || !learnerLevels.has(body.learnerLevel as LearnerLevel)) {
    return NextResponse.json({ error: "Choose a supported learner level." }, { status: 400 });
  }
  if (typeof body.outputStyle !== "string" || !outputStyles.has(body.outputStyle as OutputStyle)) {
    return NextResponse.json({ error: "Choose a supported output style." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  try {
    const stored = await storeTextInput({
      rawInputText: body.text.trim(),
      sourceLanguage: body.sourceLanguage,
      userLanguage: body.userLanguage,
      learnerLevel: body.learnerLevel,
      outputStyle: body.outputStyle,
      sourceLanguageConfirmed: true,
      createdAt,
    });
    return NextResponse.json({ textInputId: stored.textInputId, createdAt }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The study input could not be saved." }, { status: 500 });
  }
}
