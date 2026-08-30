import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

// process.cwd() is read-only on Vercel serverless; only os.tmpdir() is writable there.
const storageRoot = path.join(os.tmpdir(), "lingua-storage", "documents");

export type StoredDocument = {
  documentId: string;
  storagePath: string;
};

export async function storeDocument(file: File): Promise<StoredDocument> {
  const documentId = randomUUID();
  const extension = path.extname(file.name).toLowerCase();
  const storagePath = path.join(storageRoot, `${documentId}${extension}`);
  await mkdir(storageRoot, { recursive: true });
  await writeFile(storagePath, Buffer.from(await file.arrayBuffer()));
  return { documentId, storagePath };
}
