import { runClaudeTask, extractTextWithClaude } from "@/lib/llm/claude";
import type { Language, LearnerLevel, OutputStyle, PromptTemplateId } from "@/lib/types";

export type LlmProviderId = "anthropic";

export type LlmTaskInput = {
  text: string;
  sourceLanguage: Language;
  userLanguage: Language;
  learnerLevel: LearnerLevel;
  outputStyle: OutputStyle;
  promptTemplateId: PromptTemplateId;
};

export type LlmProvider = {
  runTask: (input: LlmTaskInput, apiKey?: string) => Promise<string>;
  extractText: (source: Buffer, mimeType: string, apiKey?: string) => Promise<string>;
};

const providers: Record<LlmProviderId, LlmProvider> = {
  anthropic: {
    runTask: runClaudeTask,
    extractText: extractTextWithClaude,
  },
};

export function getLlmProvider(providerId: LlmProviderId = "anthropic") {
  return providers[providerId];
}

export function getRequestApiKey(request: Request) {
  const apiKey = request.headers.get("x-polyglot-anthropic-key")?.trim();
  if (apiKey && apiKey.length > 1000) throw new Error("The API key is too long.");
  return apiKey || undefined;
}