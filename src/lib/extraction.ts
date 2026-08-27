import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export type ExtractedDocument = {
  text: string;
  pageCount: number;
};

function extractHtmlText(source: string) {
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePdfText(source: string) {
  return source
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractDocumentText(filePath: string, mimeType: string): Promise<ExtractedDocument> {
  const source = await readFile(filePath);
  if (mimeType === "text/html") {
    return { text: extractHtmlText(source.toString("utf8")), pageCount: 1 };
  }
  if (mimeType === "text/plain" || mimeType === "text/xml" || mimeType === "application/xml") {
    return { text: source.toString("utf8").trim(), pageCount: 1 };
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer: source });
    return { text: result.value.trim(), pageCount: 1 };
  }

  const parser = new PDFParse({ data: source });
  try {
    const parsed = await parser.getText();
    const pages = parsed.pages.map((page) => page.text.trim()).filter(Boolean);
    return { text: normalizePdfText(pages.join("\n\n")), pageCount: parsed.total || pages.length || 1 };
  } finally {
    await parser.destroy();
  }
}
