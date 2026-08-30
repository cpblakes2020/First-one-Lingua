import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { readJsonBlob, writeJsonBlob } from "@/lib/storage/blob-json";

const workspaceKeyHeader = "x-polyglot-workspace-key";
const maxPayloadLength = 5 * 1024 * 1024;

function workspacePath(request: Request) {
  const workspaceKey = request.headers.get(workspaceKeyHeader)?.trim() || "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(workspaceKey)) return null;
  const workspaceId = createHash("sha256").update(workspaceKey).digest("base64url");
  return `lingua/workspaces/${workspaceId}.json`;
}

export async function GET(request: Request) {
  const pathname = workspacePath(request);
  if (!pathname) return NextResponse.json({ error: "Enter a valid sync code." }, { status: 400 });
  try {
    const payload = await readJsonBlob<string | null>(pathname, null);
    return NextResponse.json({ payload });
  } catch {
    return NextResponse.json({ error: "Private sync is unavailable. Configure Vercel Blob for this deployment." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const pathname = workspacePath(request);
  if (!pathname) return NextResponse.json({ error: "Enter a valid sync code." }, { status: 400 });
  try {
    const body = await request.json().catch(() => null) as { payload?: unknown } | null;
    if (typeof body?.payload !== "string" || !body.payload || body.payload.length > maxPayloadLength) {
      return NextResponse.json({ error: "The encrypted workspace payload is invalid." }, { status: 400 });
    }
    await writeJsonBlob(pathname, body.payload);
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Private sync is unavailable. Configure Vercel Blob for this deployment." }, { status: 503 });
  }
}