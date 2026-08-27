import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const storageRoot = path.join(process.cwd(), ".lingua-storage", "text-inputs");

export type StoredTextInput = {
  textInputId: string;
  storagePath: string;
};

export async function storeTextInput(data: unknown): Promise<StoredTextInput> {
  const textInputId = randomUUID();
  const storagePath = path.join(storageRoot, `${textInputId}.json`);
  await mkdir(storageRoot, { recursive: true });
  await writeFile(storagePath, JSON.stringify(data, null, 2), "utf8");
  return { textInputId, storagePath };
}
