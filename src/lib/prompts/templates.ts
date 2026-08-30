import type { PromptTemplateId } from "@/lib/types";

type PromptTemplate = {
  id: PromptTemplateId;
  name: string;
  description: string;
  instruction: string;
};

export const promptTemplates: readonly PromptTemplate[] = [
  { id: "extract-text", name: "Extract text exactly", description: "Preserve the source wording and structure", instruction: "Extract the text exactly as provided. Preserve paragraph breaks and do not translate or paraphrase." },
  { id: "translate", name: "Translate naturally", description: "A natural translation with useful nuance", instruction: "Translate the source naturally while preserving meaning, tone, and important nuance." },
  { id: "sentence-guide", name: "Sentence guide", description: "Meaning, grammar, line by line", instruction: "Explain the text sentence by sentence, including meaning, grammar, and notable usage." },
  { id: "vocabulary", name: "Build vocabulary", description: "Useful words from this text", instruction: "Create a focused vocabulary list with definitions, parts of speech, examples, and useful nuance." },
  { id: "grammar", name: "Explain grammar", description: "Patterns and forms worth noticing", instruction: "Identify and explain the important grammar patterns in the source text with clear examples." },
  { id: "reading-support", name: "Add reading support", description: "Transliteration and pronunciation help", instruction: "Add appropriate reading support or transliteration, preserving the original script alongside it." },
  { id: "flashcards", name: "Make flashcards", description: "Anki-ready, reversible by default", instruction: "Create concise flashcard entries suitable for Anki. Return only valid JSON with this exact shape: {\"cards\":[{\"front\":\"source-language prompt\",\"back\":\"explanation-language answer\",\"tags\":[\"topic\"]}]}. Create one object for each useful card. Do not use Markdown or code fences." },
  { id: "questions", name: "Answer questions", description: "Ask anything about this text", instruction: "Answer questions about the source text accurately and cite the relevant wording when useful." },
  { id: "word-analysis", name: "Word analysis", description: "Roots, forms, nuance, examples", instruction: "Analyze the word or phrase for root, base form, stem, morphology, related words, definitions, synonyms, examples, register, and nuance. For Japanese compounds, include kanji meanings and structure." },
  { id: "register-conversion", name: "Convert register", description: "Formal ↔ informal, any language", instruction: "Convert the source between formal and informal register. Preserve meaning, explain the register changes, and provide the converted version." },
  { id: "thai-script-conversion", name: "Convert Thai script", description: "Loopless Thai -> regular Thai script", instruction: "Convert loopless modern Thai script into regular Thai script. Preserve the Thai meaning and return only the corrected Thai text plus brief notes about meaningful changes." },
];

export function getPromptTemplate(id: PromptTemplateId) {
  return promptTemplates.find((template) => template.id === id);
}
