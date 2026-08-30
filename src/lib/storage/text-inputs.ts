import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

export type StoredTextInput = {
  textInputId: string;
  storagePath: string;
};

export async function storeTextInput(data: unknown): Promise<StoredTextInput> {
  const textInputId = randomUUID();
  const pathname = `lingua/text-inputs/${textInputId}.json`;
  await put(pathname, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return { textInputId, storagePath: pathname };
}

