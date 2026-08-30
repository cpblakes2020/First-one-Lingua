const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(value: Uint8Array) {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function keyFor(workspaceKey: string) {
  return crypto.subtle.importKey("raw", fromBase64Url(workspaceKey), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export function createWorkspaceKey() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export function isWorkspaceKey(value: string) {
  try {
    return fromBase64Url(value).length === 32;
  } catch {
    return false;
  }
}

export async function encryptWorkspace(value: unknown, workspaceKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFor(workspaceKey), encoder.encode(JSON.stringify(value)));
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptWorkspace<T>(payload: string, workspaceKey: string): Promise<T> {
  const [encodedIv, encodedCiphertext] = payload.split(".");
  if (!encodedIv || !encodedCiphertext) throw new Error("The synced workspace is invalid.");
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(encodedIv) }, await keyFor(workspaceKey), fromBase64Url(encodedCiphertext));
  return JSON.parse(decoder.decode(plaintext)) as T;
}