"use client";

import type { PromptTemplateId } from "@/lib/types";
import type { Language } from "@/lib/types";

type PromptTemplate = {
  id: PromptTemplateId;
  icon: string;
  name: string;
  description: string;
};

const templates: PromptTemplate[] = [
  { id: "word-analysis", icon: "Aa", name: "Word analysis", description: "Roots, forms, nuance, examples" },
  { id: "sentence-guide", icon: "文", name: "Sentence guide", description: "Meaning, grammar, line by line" },
  { id: "vocabulary", icon: "▤", name: "Build vocabulary", description: "Useful words from this text" },
  { id: "flashcards", icon: "⇄", name: "Make flashcards", description: "Anki-ready, reversible by default" },
  { id: "register-conversion", icon: "↕", name: "Convert register", description: "Formal ↔ informal, any language" },
];

type PromptTemplatePickerProps = {
  selectedTemplate: PromptTemplateId;
  sourceLanguage: Language;
  onTemplateChange: (template: PromptTemplateId) => void;
};

export function PromptTemplatePicker({ selectedTemplate, sourceLanguage, onTemplateChange }: PromptTemplatePickerProps) {
  const visibleTemplates = sourceLanguage === "Thai"
    ? [...templates, { id: "thai-script-conversion" as const, icon: "ก", name: "Convert Thai script", description: "Loopless Thai → regular Thai script" }]
    : templates;

  return (
    <>
      <div className="template-heading">
        <div><p className="section-kicker">03 / Choose a lens</p><h2 id="template-title">Start with a useful question</h2></div>
        <button className="text-button" type="button">See all templates <span aria-hidden="true">→</span></button>
      </div>
      <div className="template-grid">
        {visibleTemplates.map((template) => (
          <button className={`template-card${selectedTemplate === template.id ? " selected" : ""}`} type="button" key={template.id} aria-pressed={selectedTemplate === template.id} onClick={() => onTemplateChange(template.id)}>
            <span className="template-icon">{template.icon}</span>
            <span><strong>{template.name}</strong><small>{template.description}</small></span>
            <span className="card-arrow">↗</span>
          </button>
        ))}
      </div>
    </>
  );
}
