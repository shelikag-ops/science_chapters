# Sarah Science Chapters — Wiki

A living knowledge base for the Sarah Science Chapters project, maintained by Claude.

## What's currently here

~30+ chapter HTML files following the pattern `chapter-<id>-<topic>.html` covering A-strand (matter), B-strand (life), and more. Two governance docs: `CHAPTER_QUALITY_GUIDE.md` (style/quality bar) and `RETROFIT_PLAN.md` (which existing chapters need rework). Active git repo. Tightly coupled to Sarah Homeschooling — coordinate updates.

## How to use it

**Reading.** Open [`index.md`](index.md) for the catalog. Right now the wiki is a scaffold — content fills in as you and Claude work in this project.

**Asking questions.** Just ask Claude. It reads the wiki to answer and files interesting new syntheses back as wiki pages.

**Adding sources.** Drop a file into the project root. Tell Claude "read this and update the wiki" — it'll summarize, cross-reference, and log the ingest.

**Maintenance.** Periodically: "lint the wiki." Claude finds contradictions, stale claims, orphan pages, missing cross-references.

## Structure at a glance

- **`overview/`** — Where the project is right now, where it's going.
- **`subjects/`** — Entity pages (the "things" this project tracks).
- **`concepts/`** — Cross-cutting ideas in this project.
- **`platforms/`** — External services this project depends on.
- **`tools/`** — In-house tools and files in this project.
- **`sources/`** — Summary pages for ingested external sources.
- **`sessions/`** — Dated session notes.

The schema and conventions Claude follows live in [`../CLAUDE.md`](../CLAUDE.md) and [`../../CLAUDE.md`](../../CLAUDE.md).

## See also

- [`index.md`](index.md) — full catalog
- [`log.md`](log.md) — chronological event log
- [`improvements.md`](improvements.md) — Claude's standing suggestions
- [`../../INDEX.md`](../../INDEX.md) — cross-project directory
