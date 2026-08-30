import { get, put } from "@vercel/blob";

const privateSyncToken = process.env.PRIVATE_SYNC_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

function requirePrivateSyncToken() {
  if (!privateSyncToken) throw new Error("Private sync is not configured.");
  return privateSyncToken;
}

export async function readPrivateWorkspace(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "private", token: requirePrivateSyncToken(), useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return new Response(result.stream).text();
}

export async function writePrivateWorkspace(pathname: string, payload: string): Promise<void> {
  await put(pathname, payload, {
    access: "private",
    token: requirePrivateSyncToken(),
    contentType: "text/plain",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}