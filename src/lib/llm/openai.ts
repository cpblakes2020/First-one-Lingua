import { buildStudyPrompt } from "@/lib/prompts/buildPrompt";
import type { LlmTaskInput } from "@/lib/llm/provider";

const openAiEndpoint = "https://api.openai.com/v1/chat/completions";

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  error?: { message?: string };
};

function getResponseText(result: OpenAiResponse) {
  const content = result.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  return content?.map((part) => part.text || "").join("\n").trim();
}

export async function runOpenAiTask(input: LlmTaskInput, apiKey?: string) {
  if (!apiKey) throw new Error("Add your OpenAI API key before running a task.");

  const response = await fetch(openAiEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [{ role: "user", content: buildStudyPrompt(input) }],
    }),
  });
  const result = await response.json() as OpenAiResponse;
  if (!response.ok) throw new Error(result.error?.message || "OpenAI could not complete the task.");
  const text = getResponseText(result);
  if (!text) throw new Error("OpenAI returned an empty result.");
  return text;
}