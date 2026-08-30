"use client";

import { useEffect, useState } from "react";
import { LanguageSettings } from "@/components/intake/LanguageSettings";
import { PromptTemplatePicker } from "@/components/intake/PromptTemplatePicker";
import { UploadPanel } from "@/components/intake/UploadPanel";
import { SavedReview } from "@/components/review/SavedReview";
import type { SavedTaskRun } from "@/lib/storage/task-runs";
import type { Language, LearnerLevel, OutputStyle, PromptTemplateId } from "@/lib/types";

const examples = [
  { label: "Thai sentence", language: "Thai" as const, text: "พรุ่งนี้เราจะไปตลาดด้วยกัน" },
  { label: "Japanese compound", language: "Japanese" as const, text: "言語学習" },
  { label: "Indonesian affix", language: "Indonesian" as const, text: "berjalan" },
];

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Server error (${response.status}). Please try again.`);
  }
}

const languagePreferenceKey = "lingua:languagePreference";
const defaultSourceLanguage: Language = "Indonesian";
const defaultExplanationLanguage: Language = "English";

function loadLanguagePreference(): { sourceLanguage: Language; explanationLanguage: Language } {
  if (typeof window === "undefined") return { sourceLanguage: defaultSourceLanguage, explanationLanguage: defaultExplanationLanguage };
  try {
    const stored = JSON.parse(window.localStorage.getItem(languagePreferenceKey) || "null") as { sourceLanguage?: Language; explanationLanguage?: Language } | null;
    return {
      sourceLanguage: stored?.sourceLanguage || defaultSourceLanguage,
      explanationLanguage: stored?.explanationLanguage || defaultExplanationLanguage,
    };
  } catch {
    return { sourceLanguage: defaultSourceLanguage, explanationLanguage: defaultExplanationLanguage };
  }
}

export function IntakeWorkspace() {
  const [mode, setMode] = useState<"text" | "document">("text");
  const [text, setText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<Language>(defaultSourceLanguage);
  const [explanationLanguage, setExplanationLanguage] = useState<Language>(defaultExplanationLanguage);
  const [learnerLevel, setLearnerLevel] = useState<LearnerLevel>("Intermediate");
  const [outputStyle, setOutputStyle] = useState<OutputStyle>("Detailed");
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplateId>("word-analysis");
  const [loadedExample, setLoadedExample] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [promptPreview, setPromptPreview] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [taskResult, setTaskResult] = useState("");
  const [reviewRuns, setReviewRuns] = useState<SavedTaskRun[]>([]);
  const [reviewStatus, setReviewStatus] = useState("");

  useEffect(() => {
    void fetch("/api/task-runs").then((response) => response.json()).then((data: { taskRuns?: SavedTaskRun[] }) => setReviewRuns(data.taskRuns || [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    const preference = loadLanguagePreference();
    setSourceLanguage(preference.sourceLanguage);
    setExplanationLanguage(preference.explanationLanguage);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(languagePreferenceKey, JSON.stringify({ sourceLanguage, explanationLanguage }));
  }, [sourceLanguage, explanationLanguage]);

  function loadExample(example: (typeof examples)[number]) {
    setText(example.text);
    setSourceLanguage(example.language);
    setLoadedExample(`${example.label} loaded`);
    if (example.language !== "Thai" && selectedTemplate === "thai-script-conversion") {
      setSelectedTemplate("word-analysis");
    }
  }

  async function saveTextInput() {
    setSaveStatus("Saving study input...");
    try {
      const response = await fetch("/api/text-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceLanguage, userLanguage: explanationLanguage, learnerLevel, outputStyle }),
      });
      const result = await parseJsonResponse<{ error?: string; textInputId?: string }>(response);
      if (!response.ok || !result.textInputId) throw new Error(result.error || "The study input could not be saved.");
      setSaveStatus("Study input saved");
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "The study input could not be saved.");
    }
  }

  async function previewPrompt() {
    setPromptPreview("Building task prompt...");
    try {
      const response = await fetch("/api/prompts/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceLanguage, userLanguage: explanationLanguage, learnerLevel, outputStyle, promptTemplateId: selectedTemplate }),
      });
      const result = await parseJsonResponse<{ error?: string; prompt?: string }>(response);
      if (!response.ok || !result.prompt) throw new Error(result.error || "The prompt could not be built.");
      setPromptPreview(result.prompt);
    } catch (error) {
      setPromptPreview(error instanceof Error ? error.message : "The prompt could not be built.");
    }
  }

  async function runTask() {
    setTaskStatus("Working with Claude...");
    setTaskResult("");
    try {
      const response = await fetch("/api/tasks/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceLanguage, userLanguage: explanationLanguage, learnerLevel, outputStyle, promptTemplateId: selectedTemplate }),
      });
      const result = await parseJsonResponse<{ error?: string; result?: string }>(response);
      if (!response.ok || !result.result) throw new Error(result.error || "The task could not be completed.");
      setTaskResult(result.result);
      setTaskStatus("Task complete");
    } catch (error) {
      setTaskStatus(error instanceof Error ? error.message : "The task could not be completed.");
    }
  }

  async function saveForReview() {
    setReviewStatus("Saving...");
    try {
      const response = await fetch("/api/task-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: text, result: taskResult, sourceLanguage, userLanguage: explanationLanguage, learnerLevel, outputStyle, promptTemplateId: selectedTemplate }),
      });
      const data = await parseJsonResponse<{ error?: string; taskRun?: SavedTaskRun }>(response);
      if (!response.ok || !data.taskRun) throw new Error(data.error || "The result could not be saved.");
      setReviewRuns((runs) => [data.taskRun!, ...runs]);
      setReviewStatus("Saved for review");
    } catch (error) {
      setReviewStatus(error instanceof Error ? error.message : "The result could not be saved.");
    }
  }

  function openSavedRun(run: SavedTaskRun) {
    setText(run.sourceText);
    setSourceLanguage(run.sourceLanguage);
    setExplanationLanguage(run.userLanguage);
    setLearnerLevel(run.learnerLevel);
    setOutputStyle(run.outputStyle);
    setSelectedTemplate(run.promptTemplateId);
    setTaskResult(run.result);
    setTaskStatus("Saved result opened");
    setReviewStatus("");
  }

  async function updateSavedRun(run: SavedTaskRun) {
    const response = await fetch(`/api/task-runs/${run.taskRunId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: run.notes }),
    });
    if (response.ok) setReviewRuns((runs) => runs.map((item) => item.taskRunId === run.taskRunId ? run : item));
  }

  async function deleteSavedRun(taskRunId: string) {
    const response = await fetch(`/api/task-runs/${taskRunId}`, { method: "DELETE" });
    if (response.ok) setReviewRuns((runs) => runs.filter((run) => run.taskRunId !== taskRunId));
  }

  function clearInput() {
    setText("");
    setLoadedExample("");
    setSaveStatus("");
    setPromptPreview("");
    setTaskStatus("");
    setTaskResult("");
  }

  return (
    <>
      <section className="workspace-grid" aria-label="Study intake workspace">
        <div className="intake-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">01 / Bring material</p><h2>What are we studying?</h2></div>
            <span className="panel-count">2 ways in</span>
          </div>
          <div className="mode-tabs" role="tablist" aria-label="Material type">
            <button className={`mode-tab${mode === "text" ? " active" : ""}`} type="button" role="tab" aria-selected={mode === "text"} onClick={() => setMode("text")}>Enter text <span>⌘ 1</span></button>
            <button className={`mode-tab${mode === "document" ? " active" : ""}`} type="button" role="tab" aria-selected={mode === "document"} onClick={() => setMode("document")}>Upload document <span>⌘ 2</span></button>
          </div>
          {mode === "text" ? (
            <>
              <label className="text-label" htmlFor="study-text">Paste a word, sentence, or passage</label>
              <textarea id="study-text" className="study-text" value={text} maxLength={12000} onChange={(event) => setText(event.target.value)} placeholder="Try something in a language you are learning..." />
              <div className="field-footer"><span>{text.length} / 12,000 characters</span><button className="clear-input-button" type="button" disabled={!text} onClick={clearInput}>Clear</button><span>Text stays in this workspace</span></div>
              <div className="example-row" aria-label="Quick examples"><span className="example-label">Try an example</span>{examples.map((example) => <button type="button" key={example.label} onClick={() => loadExample(example)}>{example.label}</button>)}{loadedExample && <span className="example-status" role="status">{loadedExample}</span>}</div>
              <div className="input-action-row"><button className="save-input-button" type="button" disabled={!text.trim()} onClick={() => void saveTextInput()}>Save study input</button><button className="preview-prompt-button" type="button" disabled={!text.trim()} onClick={() => void previewPrompt()}>Preview task prompt</button><button className="run-task-button" type="button" disabled={!text.trim() || taskStatus === "Working with Claude..."} onClick={() => void runTask()}>Run task</button>{saveStatus && <span className="example-status" role="status">{saveStatus}</span>}</div>
              {promptPreview && <pre className="prompt-preview" aria-label="Task prompt preview">{promptPreview}</pre>}
              {taskStatus && <p className="task-status" role="status">{taskStatus}</p>}
              {taskResult && <section className="task-result" aria-label="Claude task result"><div className="result-label">Claude result · {explanationLanguage}</div><div className="result-text">{taskResult}</div><div className="result-actions"><button className="save-input-button" type="button" onClick={() => void saveForReview()}>Save for review</button>{reviewStatus && <span className="example-status" role="status">{reviewStatus}</span>}</div></section>}
            </>
          ) : (
            <UploadPanel onTextExtracted={(extractedText, filename) => { setText(extractedText); setLoadedExample(`${filename} loaded`); setMode("text"); }} />
          )}
        </div>
        <LanguageSettings sourceLanguage={sourceLanguage} explanationLanguage={explanationLanguage} learnerLevel={learnerLevel} outputStyle={outputStyle} onSourceLanguageChange={(language) => { setSourceLanguage(language); if (language !== "Thai" && selectedTemplate === "thai-script-conversion") setSelectedTemplate("word-analysis"); }} onExplanationLanguageChange={setExplanationLanguage} onLearnerLevelChange={setLearnerLevel} onOutputStyleChange={setOutputStyle} onPresetChange={(source, explanation) => { setSourceLanguage(source); setExplanationLanguage(explanation); if (source !== "Thai" && selectedTemplate === "thai-script-conversion") setSelectedTemplate("word-analysis"); }} />
      </section>
      <section className="template-section" aria-labelledby="template-title"><PromptTemplatePicker selectedTemplate={selectedTemplate} sourceLanguage={sourceLanguage} onTemplateChange={setSelectedTemplate} /></section>
      <SavedReview runs={reviewRuns} onOpen={openSavedRun} onUpdate={(run) => void updateSavedRun(run)} onDelete={(taskRunId) => void deleteSavedRun(taskRunId)} />
    </>
  );
}
