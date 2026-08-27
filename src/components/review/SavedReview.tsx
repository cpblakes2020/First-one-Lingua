"use client";

import type { SavedTaskRun } from "@/lib/storage/task-runs";
import { downloadTaskRun } from "@/lib/exports";

type SavedReviewProps = {
  runs: SavedTaskRun[];
  onOpen: (run: SavedTaskRun) => void;
  onUpdate: (run: SavedTaskRun) => void;
  onDelete: (taskRunId: string) => void;
};

export function SavedReview({ runs, onOpen, onUpdate, onDelete }: SavedReviewProps) {
  if (!runs.length) return null;

  return (
    <section className="review-section" aria-labelledby="review-title">
      <div className="template-heading">
        <div><p className="section-kicker">04 / Return to your work</p><h2 id="review-title">Saved review</h2></div>
        <span className="panel-count">{runs.length} saved {runs.length === 1 ? "result" : "results"}</span>
      </div>
      <div className="review-list">
        {runs.map((run) => (
          <article className="review-item" key={run.taskRunId}>
            <button className="review-open" type="button" onClick={() => onOpen(run)}>
              <span className="review-item-main"><strong>{run.sourceText.slice(0, 72)}{run.sourceText.length > 72 ? "..." : ""}</strong><small>{run.sourceLanguage} through {run.userLanguage} · {run.promptTemplateId}</small></span>
              <span className="card-arrow">↗</span>
            </button>
            <textarea className="review-notes" defaultValue={run.notes} aria-label={`Notes for ${run.sourceText.slice(0, 30)}`} placeholder="Add a note for later review..." onBlur={(event) => { if (event.target.value !== run.notes) onUpdate({ ...run, notes: event.target.value }); }} />
            <div className="review-actions">
              <button type="button" onClick={() => downloadTaskRun(run, "txt")}>Download TXT</button>
              <button type="button" onClick={() => downloadTaskRun(run, "csv")}>Anki CSV</button>
              <button type="button" onClick={() => downloadTaskRun(run, "tsv")}>Anki TSV</button>
              <button className="danger-button" type="button" onClick={() => { if (window.confirm("Delete this saved review?")) onDelete(run.taskRunId); }}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
