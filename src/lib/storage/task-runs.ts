import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import type { Language, LearnerLevel, OutputStyle, PromptTemplateId } from "@/lib/types";

// process.cwd() is read-only on Vercel serverless; only os.tmpdir() is writable there.
const storageRoot = path.join(os.tmpdir(), "lingua-storage", "task-runs");

export type SavedTaskRun = {
  taskRunId: string;
  sourceText: string;
  sourceLanguage: Language;
  userLanguage: Language;
  learnerLevel: LearnerLevel;
  outputStyle: OutputStyle;
  promptTemplateId: PromptTemplateId;
  result: string;
  notes: string;
  createdAt: string;
};

export async function saveTaskRun(input: Omit<SavedTaskRun, "taskRunId" | "createdAt">) {
  const taskRun: SavedTaskRun = { ...input, taskRunId: randomUUID(), createdAt: new Date().toISOString() };
  await mkdir(storageRoot, { recursive: true });
  await writeFile(path.join(storageRoot, `${taskRun.taskRunId}.json`), JSON.stringify(taskRun, null, 2), "utf8");
  return taskRun;
}

export async function updateTaskRunNotes(taskRunId: string, notes: string) {
  const filePath = path.join(storageRoot, `${taskRunId}.json`);
  const taskRun = JSON.parse(await readFile(filePath, "utf8")) as SavedTaskRun;
  const updatedTaskRun = { ...taskRun, notes };
  await writeFile(filePath, JSON.stringify(updatedTaskRun, null, 2), "utf8");
  return updatedTaskRun;
}

export async function deleteTaskRun(taskRunId: string) {
  await unlink(path.join(storageRoot, `${taskRunId}.json`));
}

export async function listTaskRuns() {
  await mkdir(storageRoot, { recursive: true });
  const filenames = await readdir(storageRoot);
  const runs = await Promise.all(filenames.filter((filename) => filename.endsWith(".json")).map(async (filename) => JSON.parse(await readFile(path.join(storageRoot, filename), "utf8")) as SavedTaskRun));
  return runs.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}
