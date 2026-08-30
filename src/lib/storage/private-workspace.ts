import { get, put } from "@vercel/blob";

const privateSyncStoreId = process.env.PRIVATE_SYNC__STORE_ID;

function privateSyncOptions() {
  if (!privateSyncStoreId) throw new Error("Private sync is not configured.");
  return { storeId: privateSyncStoreId };
}

export async function readPrivateWorkspace(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "private", ...privateSyncOptions(), useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return new Response(result.stream).text();
}

export async function writePrivateWorkspace(pathname: string, payload: string): Promise<void> {
  await put(pathname, payload, {
    access: "private",
    ...privateSyncOptions(),
    contentType: "text/plain",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}