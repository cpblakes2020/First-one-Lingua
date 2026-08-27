"use client";

import { useRef, useState } from "react";

type UploadPanelProps = {
  onTextExtracted: (text: string, filename: string) => void;
};

export function UploadPanel({ onTextExtracted }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setStatus(`Reading ${file.name}...`);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const result = await response.json() as { error?: string; text?: string; filename?: string; pageCount?: number };
      if (!response.ok || !result.text || !result.filename) throw new Error(result.error || "The document could not be read.");
      onTextExtracted(result.text, result.filename);
      setStatus(`${result.filename} loaded${result.pageCount && result.pageCount > 1 ? ` · ${result.pageCount} pages` : ""}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The document could not be read.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="upload-placeholder">
      <input ref={inputRef} className="visually-hidden" type="file" accept=".html,.htm,.txt,.xml,.docx,.pdf,.jpg,.jpeg,.png,text/html,text/plain,text/xml,application/xml,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/jpeg,image/png" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); }} />
      <span className="upload-icon" aria-hidden="true">↑</span>
      <strong>{isUploading ? "Reading document..." : "Bring DOCX, image, HTML, text, XML, or PDF"}</strong>
      <p>Text is extracted on the server and placed into your study workspace.</p>
      <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()}>{isUploading ? "Working..." : "Choose document"}</button>
      {status && <span className="upload-status" role="status">{status}</span>}
    </div>
  );
}
