import { randomUUID } from "node:crypto";
import { readJsonBlob, writeJsonBlob } from "@/lib/storage/blob-json";
import type { Flashcard } from "@/lib/flashcards";
import type { Language, LearnerLevel, OutputStyle, PromptTemplateId } from "@/lib/types";

const blobPathname = "lingua/task-runs.json";

export type FollowUpExchange = {
  question: string;
  answer: string;
  createdAt: string;
};

export type SavedTaskRun = {
  taskRunId: string;
  sourceText: string;
  sourceLanguage: Language;
  userLanguage: Language;
  learnerLevel: LearnerLevel;
  outputStyle: OutputStyle;
  promptTemplateId: PromptTemplateId;
  result: string;
  flashcards?: Flashcard[];
  followUps?: FollowUpExchange[];
  notes: string;
  createdAt: string;
};

async function readAll(): Promise<SavedTaskRun[]> {
  return readJsonBlob<SavedTaskRun[]>(blobPathname, []);
}

async function writeAll(taskRuns: SavedTaskRun[]): Promise<void> {
  await writeJsonBlob(blobPathname, taskRuns);
}

export async function saveTaskRun(input: Omit<SavedTaskRun, "taskRunId" | "createdAt">) {
  const taskRun: SavedTaskRun = { ...input, taskRunId: randomUUID(), createdAt: new Date().toISOString() };
  const taskRuns = await readAll();
  taskRuns.push(taskRun);
  await writeAll(taskRuns);
  return taskRun;
}

export async function updateTaskRunNotes(taskRunId: string, notes: string) {
  const taskRuns = await readAll();
  const index = taskRuns.findIndex((taskRun) => taskRun.taskRunId === taskRunId);
  if (index === -1) throw new Error("Saved review item was not found.");
  const updatedTaskRun = { ...taskRuns[index], notes };
  taskRuns[index] = updatedTaskRun;
  await writeAll(taskRuns);
  return updatedTaskRun;
}

export async function deleteTaskRun(taskRunId: string) {
  const taskRuns = await readAll();
  const remaining = taskRuns.filter((taskRun) => taskRun.taskRunId !== taskRunId);
  if (remaining.length === taskRuns.length) throw new Error("Saved review item was not found.");
  await writeAll(remaining);
}

export async function listTaskRuns() {
  const taskRuns = await readAll();
  return taskRuns.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

