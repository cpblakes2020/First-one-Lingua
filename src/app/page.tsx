"use client";

import Link from "next/link";
import { IntakeWorkspace } from "@/components/intake/IntakeWorkspace";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Polyglot Language Learner home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>Polyglot<span className="brand-muted"> / learner</span></span>
        </Link>
        <div className="topbar-note">
          <span className="status-dot" aria-hidden="true" />
          Private workspace
        </div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">A study desk for the in-between languages</p>
          <h1 id="page-title">Bring a text.<br /><em>Leave with a system.</em></h1>
        </div>
        <p className="intro-copy">Turn a passage, page, or stray sentence into useful study material. Explain Japanese in Thai. Build Indonesian cards from Thai. Keep the languages you know in the room.</p>
      </section>

      <IntakeWorkspace />

      <footer className="page-footer"><span>Polyglot Language Learner</span><span>Target language first, always editable.</span></footer>
    </main>
  );
}
