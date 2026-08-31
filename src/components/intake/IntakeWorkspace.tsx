"use client";

import { useEffect, useRef, useState } from "react";
import { LanguageSettings } from "@/components/intake/LanguageSettings";
import { PromptTemplatePicker } from "@/components/intake/PromptTemplatePicker";
import { UploadPanel } from "@/components/intake/UploadPanel";
import { SavedReview } from "@/components/review/SavedReview";
import type { Flashcard } from "@/lib/flashcards";
import type { FollowUpExchange, SavedTaskRun } from "@/lib/storage/task-runs";
import { createWorkspaceKey, decryptWorkspace, encryptWorkspace, isWorkspaceKey } from "@/lib/workspace-crypto";
import type { LlmProviderId } from "@/lib/llm/provider";
import type { Language, LearnerLevel, OutputStyle, PromptTemplateId } from "@/lib/types";

const followUpPhrases = ["For this particular phrase", "What would be another way to say"];

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
const workspaceKeyPreferenceKey = "lingua:workspaceKey";
const providerKeyPreferenceKey = "lingua:providerKeys";
const selectedProviderPreferenceKey = "lingua:selectedProvider";
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

function loadProviderKeys(): Partial<Record<LlmProviderId, string>> {
  try {
    return JSON.parse(window.localStorage.getItem(providerKeyPreferenceKey) || "{}") as Partial<Record<LlmProviderId, string>>;
  } catch {
    return {};
  }
}

function saveProviderKeys(keys: Partial<Record<LlmProviderId, string>>) {
  window.localStorage.setItem(providerKeyPreferenceKey, JSON.stringify(keys));
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
  const [apiKey, setApiKey] = useState("");
  const [providerId, setProviderId] = useState<LlmProviderId>("anthropic");
  const [rememberApiKey, setRememberApiKey] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [workspaceKey, setWorkspaceKey] = useState("");
  const [workspaceStatus, setWorkspaceStatus] = useState("Preparing private sync...");
  const [followUps, setFollowUps] = useState<FollowUpExchange[]>([]);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpPreview, setFollowUpPreview] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("");
  const followUpTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [needsWorkspaceSetup, setNeedsWorkspaceSetup] = useState(false);
  const [showWorkspaceCodeInput, setShowWorkspaceCodeInput] = useState(false);
  const [workspaceSetupInput, setWorkspaceSetupInput] = useState("");
  const [workspaceSetupError, setWorkspaceSetupError] = useState("");

  useEffect(() => {
    const savedWorkspaceKey = window.localStorage.getItem(workspaceKeyPreferenceKey);
    if (savedWorkspaceKey && isWorkspaceKey(savedWorkspaceKey)) {
      setWorkspaceKey(savedWorkspaceKey);
      return;
    }
    setNeedsWorkspaceSetup(true);
  }, []);

  useEffect(() => {
    const savedProvider = window.localStorage.getItem(selectedProviderPreferenceKey);
    const nextProvider = savedProvider === "openai" ? "openai" : "anthropic";
    const keys = loadProviderKeys();
    setProviderId(nextProvider);
    setApiKey(keys[nextProvider] || "");
    setRememberApiKey(Boolean(keys[nextProvider]));
  }, []);

  useEffect(() => {
    if (!isWorkspaceKey(workspaceKey)) {
      if (workspaceKey) setWorkspaceStatus("Enter the 43-character sync code to load reviews.");
      return;
    }
    window.localStorage.setItem(workspaceKeyPreferenceKey, workspaceKey);
    setWorkspaceStatus("Loading encrypted reviews...");
    void (async () => {
      try {
        const response = await fetch("/api/workspace", { headers: { "x-polyglot-workspace-key": workspaceKey } });
        const data = await parseJsonResponse<{ error?: string; payload?: string | null }>(response);
        if (!response.ok) throw new Error(data.error || "The private workspace could not be loaded.");
        const runs = data.payload ? await decryptWorkspace<unknown>(data.payload, workspaceKey) : [];
        if (!Array.isArray(runs)) throw new Error("The private workspace is invalid.");
        setReviewRuns(runs as SavedTaskRun[]);
        setWorkspaceStatus(data.payload ? "Encrypted reviews synced" : "New private workspace ready");
      } catch (error) {
        setReviewRuns([]);
        setWorkspaceStatus(error instanceof Error ? error.message : "The private workspace could not be loaded.");
      }
    })();
  }, [workspaceKey]);

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

  function changeProvider(nextProvider: LlmProviderId) {
    const keys = loadProviderKeys();
    setProviderId(nextProvider);
    setApiKey(keys[nextProvider] || "");
    setRememberApiKey(Boolean(keys[nextProvider]));
    window.localStorage.setItem(selectedProviderPreferenceKey, nextProvider);
  }

  function changeApiKey(nextApiKey: string) {
    setApiKey(nextApiKey);
    if (rememberApiKey) saveProviderKeys({ ...loadProviderKeys(), [providerId]: nextApiKey });
  }

  function changeRememberApiKey(remember: boolean) {
    setRememberApiKey(remember);
    const keys = loadProviderKeys();
    if (remember && apiKey) keys[providerId] = apiKey;
    if (!remember) delete keys[providerId];
    saveProviderKeys(keys);
  }

  function forgetApiKey() {
    const keys = loadProviderKeys();
    delete keys[providerId];
    saveProviderKeys(keys);
    setApiKey("");
    setRememberApiKey(false);
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
    setTaskStatus(`Working with ${providerId === "anthropic" ? "Anthropic" : "OpenAI"}...`);
    setTaskResult("");
    setFlashcards([]);
    setFollowUps([]);
    setShowFollowUpForm(false);
    setFollowUpText("");
    setFollowUpPreview("");
    setFollowUpStatus("");
    try {
      const response = await fetch("/api/tasks/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-polyglot-provider": providerId, ...(apiKey ? { "x-polyglot-api-key": apiKey } : {}) },
        body: JSON.stringify({ text, sourceLanguage, userLanguage: explanationLanguage, learnerLevel, outputStyle, promptTemplateId: selectedTemplate }),
      });
      const result = await parseJsonResponse<{ error?: string; result?: string; flashcards?: Flashcard[] }>(response);
      if (!response.ok || !result.result) throw new Error(result.error || "The task could not be completed.");
      setTaskResult(result.result);
      setFlashcards(result.flashcards || []);
      setTaskStatus("Task complete");
    } catch (error) {
      setTaskStatus(error instanceof Error ? error.message : "The task could not be completed.");
    }
  }

  async function saveForReview() {
    setReviewStatus("Saving...");
    try {
      const taskRun: SavedTaskRun = { taskRunId: crypto.randomUUID(), sourceText: text.trim(), result: taskResult.trim(), flashcards, followUps, sourceLanguage, userLanguage: explanationLanguage, learnerLevel, outputStyle, promptTemplateId: selectedTemplate, notes: "", createdAt: new Date().toISOString() };
      const runs = [taskRun, ...reviewRuns];
      await saveWorkspaceReviews(runs);
      setReviewRuns(runs);
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
    setFlashcards(run.flashcards || []);
    setFollowUps(run.followUps || []);
    setShowFollowUpForm(false);
    setFollowUpText("");
    setFollowUpPreview("");
    setFollowUpStatus("");
    setTaskStatus("Saved result opened");
    setReviewStatus("");
  }

  async function updateSavedRun(run: SavedTaskRun) {
    const runs = reviewRuns.map((item) => item.taskRunId === run.taskRunId ? run : item);
    try {
      await saveWorkspaceReviews(runs);
      setReviewRuns(runs);
    } catch {
      setWorkspaceStatus("Notes could not be synced.");
    }
  }

  async function deleteSavedRun(taskRunId: string) {
    const runs = reviewRuns.filter((run) => run.taskRunId !== taskRunId);
    try {
      await saveWorkspaceReviews(runs);
      setReviewRuns(runs);
    } catch {
      setWorkspaceStatus("The review could not be deleted from sync.");
    }
  }

  async function saveWorkspaceReviews(runs: SavedTaskRun[]) {
    if (!isWorkspaceKey(workspaceKey)) throw new Error("Enter a valid private sync code before saving.");
    setWorkspaceStatus("Encrypting and syncing reviews...");
    const payload = await encryptWorkspace(runs, workspaceKey);
    const response = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json", "x-polyglot-workspace-key": workspaceKey }, body: JSON.stringify({ payload }) });
    const data = await parseJsonResponse<{ error?: string }>(response);
    if (!response.ok) throw new Error(data.error || "The private workspace could not be saved.");
    setWorkspaceStatus("Encrypted reviews synced");
  }

  async function copyWorkspaceKey() {
    try {
      await navigator.clipboard.writeText(workspaceKey);
      setWorkspaceStatus("Sync code copied");
    } catch {
      setWorkspaceStatus("Copy the sync code manually.");
    }
  }

  function useExistingWorkspaceCode() {
    const trimmed = workspaceSetupInput.trim();
    if (!isWorkspaceKey(trimmed)) {
      setWorkspaceSetupError("Enter the 43-character sync code exactly as saved.");
      return;
    }
    window.localStorage.setItem(workspaceKeyPreferenceKey, trimmed);
    setWorkspaceKey(trimmed);
    setNeedsWorkspaceSetup(false);
    setShowWorkspaceCodeInput(false);
    setWorkspaceSetupInput("");
    setWorkspaceSetupError("");
  }

  function createNewWorkspace() {
    const nextWorkspaceKey = createWorkspaceKey();
    window.localStorage.setItem(workspaceKeyPreferenceKey, nextWorkspaceKey);
    setWorkspaceKey(nextWorkspaceKey);
    setNeedsWorkspaceSetup(false);
  }

  function clearInput() {
    setText("");
    setLoadedExample("");
    setSaveStatus("");
    setPromptPreview("");
    setTaskStatus("");
    setTaskResult("");
    setFlashcards([]);
    setFollowUps([]);
    setShowFollowUpForm(false);
    setFollowUpText("");
    setFollowUpPreview("");
    setFollowUpStatus("");
  }

  function insertFollowUpPhrase(phrase: string) {
    const textarea = followUpTextareaRef.current;
    if (!textarea) {
      setFollowUpText((value) => `${value}${phrase} `);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setFollowUpText((value) => `${value.slice(0, start)}${phrase} ${value.slice(end)}`);
    requestAnimationFrame(() => {
      const cursor = start + phrase.length + 1;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function previewFollowUpPrompt() {
    setFollowUpPreview("Building follow-up prompt...");
    try {
      const response = await fetch("/api/prompts/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: text, previousResult: taskResult, question: followUpText, sourceLanguage, userLanguage: explanationLanguage, learnerLevel, outputStyle }),
      });
      const result = await parseJsonResponse<{ error?: string; prompt?: string }>(response);
      if (!response.ok || !result.prompt) throw new Error(result.error || "The follow-up prompt could not be built.");
      setFollowUpPreview(result.prompt);
    } catch (error) {
      setFollowUpPreview(error instanceof Error ? error.message : "The follow-up prompt could not be built.");
    }
  }

  async function runFollowUpTask() {
    setFollowUpStatus(`Working with ${providerId === "anthropic" ? "Anthropic" : "OpenAI"}...`);
    try {
      const response = await fetch("/api/tasks/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-polyglot-provider": providerId, ...(apiKey ? { "x-polyglot-api-key": apiKey } : {}) },
        body: JSON.stringify({ sourceText: text, previousResult: taskResult, question: followUpText, sourceLanguage, userLanguage: explanationLanguage, learnerLevel, outputStyle }),
      });
      const result = await parseJsonResponse<{ error?: string; result?: string }>(response);
      if (!response.ok || !result.result) throw new Error(result.error || "The follow-up question could not be answered.");
      setFollowUps((items) => [...items, { question: followUpText.trim(), answer: result.result!, createdAt: new Date().toISOString() }]);
      setFollowUpText("");
      setFollowUpPreview("");
      setFollowUpStatus("Follow-up answered");
    } catch (error) {
      setFollowUpStatus(error instanceof Error ? error.message : "The follow-up question could not be answered.");
    }
  }

  return (
    <>
      {needsWorkspaceSetup ? (
        <section className="workspace-setup" aria-label="Private workspace setup">
          <p className="section-kicker">Private sync</p>
          <h2>Do you already have a private sync code?</h2>
          <p>This browser does not have a saved sync code yet. Enter your existing code to open your saved reviews, or create a new private workspace.</p>
          {showWorkspaceCodeInput ? (
            <div className="workspace-setup-form">
              <label htmlFor="workspace-setup-code">Private sync code</label>
              <input id="workspace-setup-code" value={workspaceSetupInput} autoComplete="off" spellCheck={false} onChange={(event) => setWorkspaceSetupInput(event.target.value)} />
              {workspaceSetupError && <p className="workspace-setup-error" role="alert">{workspaceSetupError}</p>}
              <div className="workspace-setup-actions">
                <button className="save-input-button" type="button" onClick={useExistingWorkspaceCode}>Use this code</button>
                <button className="preview-prompt-button" type="button" onClick={() => { setShowWorkspaceCodeInput(false); setWorkspaceSetupError(""); }}>Back</button>
              </div>
            </div>
          ) : (
            <div className="workspace-setup-actions">
              <button className="save-input-button" type="button" onClick={() => setShowWorkspaceCodeInput(true)}>Yes, I have a code</button>
              <button className="preview-prompt-button" type="button" onClick={createNewWorkspace}>No, create a new private workspace</button>
            </div>
          )}
        </section>
      ) : (
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
              {taskResult && <section className="task-result" aria-label="Claude task result"><div className="result-label">Claude result · {explanationLanguage}</div>{flashcards.length ? <div className="flashcard-editor">{flashcards.map((card, index) => <article className="flashcard-edit" key={`${index}-${card.front}`}><label>Front<textarea value={card.front} onChange={(event) => setFlashcards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, front: event.target.value } : item))} /></label><label>Back<textarea value={card.back} onChange={(event) => setFlashcards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, back: event.target.value } : item))} /></label><label>Tags<input value={card.tags.join(", ")} onChange={(event) => setFlashcards((cards) => cards.map((item, itemIndex) => itemIndex === index ? { ...item, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) } : item))} /></label><button type="button" className="remove-card-button" aria-label={`Remove flashcard ${index + 1}`} onClick={() => setFlashcards((cards) => cards.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></article>)}<button className="preview-prompt-button" type="button" onClick={() => setFlashcards((cards) => [...cards, { front: "", back: "", tags: [] }])}>Add card</button></div> : <div className="result-text">{taskResult}</div>}<div className="result-actions"><button className="save-input-button" type="button" disabled={!isWorkspaceKey(workspaceKey) || flashcards.some((card) => !card.front.trim() || !card.back.trim())} onClick={() => void saveForReview()}>Save for review</button>{reviewStatus && <span className="example-status" role="status">{reviewStatus}</span>}</div>
                <div className="follow-up-section">
                  {followUps.map((item, index) => (
                    <div className="follow-up-entry" key={`${index}-${item.createdAt}`}>
                      <p className="follow-up-question"><strong>Q:</strong> {item.question}</p>
                      <p className="follow-up-answer"><strong>A:</strong> {item.answer}</p>
                    </div>
                  ))}
                  <button className="preview-prompt-button" type="button" onClick={() => setShowFollowUpForm((value) => !value)}>{showFollowUpForm ? "Close follow-up" : "Ask a follow-up question"}</button>
                  {showFollowUpForm && (
                    <div className="follow-up-form">
                      <div className="example-row" aria-label="Insert a phrase">
                        <span className="example-label">Insert a phrase</span>
                        {followUpPhrases.map((phrase) => <button type="button" key={phrase} onClick={() => insertFollowUpPhrase(phrase)}>{phrase}</button>)}
                      </div>
                      <textarea ref={followUpTextareaRef} className="follow-up-textarea" value={followUpText} onChange={(event) => setFollowUpText(event.target.value)} placeholder="Ask about the result above..." />
                      {followUpPreview && <pre className="prompt-preview" aria-label="Follow-up prompt preview">{followUpPreview}</pre>}
                      <div className="input-action-row">
                        <button className="preview-prompt-button" type="button" disabled={!followUpText.trim()} onClick={() => void previewFollowUpPrompt()}>Preview task prompt</button>
                        <button className="run-task-button" type="button" disabled={!followUpText.trim() || followUpStatus.startsWith("Working with")} onClick={() => void runFollowUpTask()}>Run task</button>
                        {followUpStatus && <span className="example-status" role="status">{followUpStatus}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </section>}
            </>
          ) : (
            <UploadPanel apiKey={apiKey} providerId={providerId} onTextExtracted={(extractedText, filename) => { setText(extractedText); setLoadedExample(`${filename} loaded`); setMode("text"); }} />
          )}
        </div>
        <LanguageSettings sourceLanguage={sourceLanguage} explanationLanguage={explanationLanguage} learnerLevel={learnerLevel} outputStyle={outputStyle} apiKey={apiKey} providerId={providerId} rememberApiKey={rememberApiKey} workspaceKey={workspaceKey} workspaceStatus={workspaceStatus} onSourceLanguageChange={(language) => { setSourceLanguage(language); if (language !== "Thai" && selectedTemplate === "thai-script-conversion") setSelectedTemplate("word-analysis"); }} onExplanationLanguageChange={setExplanationLanguage} onLearnerLevelChange={setLearnerLevel} onOutputStyleChange={setOutputStyle} onApiKeyChange={changeApiKey} onProviderChange={changeProvider} onRememberApiKeyChange={changeRememberApiKey} onForgetApiKey={forgetApiKey} onWorkspaceKeyChange={setWorkspaceKey} onCopyWorkspaceKey={() => void copyWorkspaceKey()} onPresetChange={(source, explanation) => { setSourceLanguage(source); setExplanationLanguage(explanation); if (source !== "Thai" && selectedTemplate === "thai-script-conversion") setSelectedTemplate("word-analysis"); }} />
      </section>
      <section className="template-section" aria-labelledby="template-title"><PromptTemplatePicker selectedTemplate={selectedTemplate} sourceLanguage={sourceLanguage} onTemplateChange={setSelectedTemplate} /></section>
      <SavedReview runs={reviewRuns} onOpen={openSavedRun} onUpdate={(run) => void updateSavedRun(run)} onDelete={(taskRunId) => void deleteSavedRun(taskRunId)} />
        </>
      )}
    </>
  );
}
