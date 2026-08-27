import { NextResponse } from "next/server";
import { deleteTaskRun, updateTaskRunNotes } from "@/lib/storage/task-runs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { notes?: unknown } | null;
  if (typeof body?.notes !== "string" || body.notes.length > 5000) {
    return NextResponse.json({ error: "Notes must be 5,000 characters or fewer." }, { status: 400 });
  }

  try {
    const taskRun = await updateTaskRunNotes(id, body.notes);
    return NextResponse.json({ taskRun });
  } catch {
    return NextResponse.json({ error: "Saved review item was not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await deleteTaskRun(id);
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Saved review item was not found." }, { status: 404 });
  }
}