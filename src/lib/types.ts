export type Language =
  | "Japanese"
  | "Thai"
  | "Indonesian"
  | "Spanish"
  | "English"
  | "French";

export type OutputStyle = "Concise" | "Detailed" | "Literal" | "Natural" | "Formal" | "Informal";
export type LearnerLevel = "Beginner" | "Intermediate" | "Advanced";
export type PromptTemplateId =
  | "extract-text"
  | "translate"
  | "sentence-guide"
  | "vocabulary"
  | "grammar"
  | "reading-support"
  | "flashcards"
  | "questions"
  | "word-analysis"
  | "register-conversion"
  | "thai-script-conversion";

export interface StudyContext {
  sourceLanguage: Language;
  userLanguage: Language;
  targetOutputLanguage: Language;
  comparisonLanguage?: Language;
  learnerLevel: LearnerLevel;
  outputStyle: OutputStyle;
  selectedModel?: string;
}

export interface LanguagePairPreset {
  id: string;
  label: string;
  sourceLanguage: Language;
  userLanguage: Language;
  description: string;
}

export interface UserProfile {
  userId: string;
  nativeLanguages: Language[];
  proficientLanguages: Language[];
  studyLanguages: Language[];
  preferredUserLanguage: Language;
}

export interface TextInputSession {
  textInputId: string;
  rawInputText: string;
  detectedLanguage?: Language;
  sourceLanguageConfirmed: boolean;
  createdAt: string;
}
