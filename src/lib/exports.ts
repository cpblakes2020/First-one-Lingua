import type { SavedTaskRun } from "@/lib/storage/task-runs";

function escapeCell(value: string, delimiter: string) {
  const normalized = value || "";
  if (delimiter === "\t") return normalized.replace(/\t/g, " ").replace(/\r?\n/g, " ");
  return `"${normalized.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export function taskRunExport(run: SavedTaskRun, delimiter: "," | "\t") {
  const headers = ["Front", "Back", "Source language", "Explanation language", "Prompt", "Notes"];
  const values = [run.sourceText, run.result, run.sourceLanguage, run.userLanguage, run.promptTemplateId, run.notes || ""];
  return `${headers.map((header) => escapeCell(header, delimiter)).join(delimiter)}\n${values.map((value) => escapeCell(value, delimiter)).join(delimiter)}\n`;
}

export function downloadTaskRun(run: SavedTaskRun, format: "csv" | "tsv" | "txt") {
  const content = format === "txt"
    ? `Source (${run.sourceLanguage})\n${run.sourceText}\n\nClaude result (${run.userLanguage})\n${run.result}\n\nNotes\n${run.notes || ""}`
    : taskRunExport(run, format === "csv" ? "," : "\t");
  const mimeType = format === "txt" ? "text/plain" : format === "csv" ? "text/csv" : "text/tab-separated-values";
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `polyglot-${run.taskRunId}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
