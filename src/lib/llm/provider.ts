import { runClaudeTask, extractTextWithClaude } from "@/lib/llm/claude";
import { runOpenAiTask } from "@/lib/llm/openai";
import type { Language, LearnerLevel, OutputStyle, PromptTemplateId } from "@/lib/types";

export type LlmProviderId = "anthropic" | "openai";

export const llmProviderOptions: ReadonlyArray<{ id: LlmProviderId; label: string }> = [
  { id: "anthropic", label: "Anthropic" },
  { id: "openai", label: "OpenAI" },
];

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
  extractText?: (source: Buffer, mimeType: string, apiKey?: string) => Promise<string>;
};

const providers: Record<LlmProviderId, LlmProvider> = {
  anthropic: {
    runTask: runClaudeTask,
    extractText: extractTextWithClaude,
  },
  openai: {
    runTask: runOpenAiTask,
  },
};

export function getLlmProvider(providerId: LlmProviderId) {
  return providers[providerId];
}

export function getRequestProvider(request: Request): LlmProviderId {
  const provider = request.headers.get("x-polyglot-provider");
  if (provider === "anthropic" || provider === "openai") return provider;
  throw new Error("Choose Anthropic or OpenAI.");
}

export function getRequestApiKey(request: Request) {
  const apiKey = request.headers.get("x-polyglot-api-key")?.trim();
  if (apiKey && apiKey.length > 1000) throw new Error("The API key is too long.");
  return apiKey || undefined;
}