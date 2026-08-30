import type { PromptTemplateId, Language, LearnerLevel, OutputStyle } from "@/lib/types";
import { buildStudyPrompt } from "@/lib/prompts/buildPrompt";

const anthropicEndpoint = "https://api.anthropic.com/v1/messages";
const anthropicVersion = "2023-06-01";

type ClaudeInput = {
  text: string;
  sourceLanguage: Language;
  userLanguage: Language;
  learnerLevel: LearnerLevel;
  outputStyle: OutputStyle;
  promptTemplateId: PromptTemplateId;
};

type ClaudeResponse = {
  content?: Array<{ type?: string; text?: string }>;
};

function getResponseText(result: ClaudeResponse) {
  return result.content?.filter((block) => block.type === "text").map((block) => block.text || "").join("\n").trim();
}

export async function runClaudeTask(input: ClaudeInput, suppliedApiKey?: string) {
  const apiKey = suppliedApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server.");

  const response = await fetch(anthropicEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": anthropicVersion,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildStudyPrompt(input) }],
    }),
  });

  const result = await response.json() as ClaudeResponse & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Claude could not complete the task.");

  const text = getResponseText(result);
  if (!text) throw new Error("Claude returned an empty result.");
  return text;
}

export async function extractTextWithClaude(source: Buffer, mimeType: string, suppliedApiKey?: string) {
  const apiKey = suppliedApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  const sourceType = mimeType === "application/pdf" ? "document" : "image";
  const response = await fetch(anthropicEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": anthropicVersion,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: [
          { type: sourceType, source: { type: "base64", media_type: mimeType, data: source.toString("base64") } },
          { type: "text", text: "Transcribe all readable text exactly. Preserve the original script, paragraph breaks, headings, and reading order. Return only the transcription, with no commentary." },
        ],
      }],
    }),
  });
  const result = await response.json() as ClaudeResponse & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Claude could not extract text from this document.");
  const text = getResponseText(result);
  if (!text) throw new Error("Claude returned no readable text.");
  return text;
}
