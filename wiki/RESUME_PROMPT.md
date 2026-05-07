# Resume prompt — Sarah Science Chapters bee-quiz auto-pilot

Copy-paste the block below into a new co-work session.

---

I'm continuing the Sarah Science Chapters bee-quiz auto-pilot from a previous session.

## Context — read these first
- Project root: `Sarah Science Chapters/` (this is the selected workspace folder)
- Generator spec: `wiki/tools/bee-quiz-generation-spec.md` (the rules I follow when producing the JSON)
- Reviewer prompt: `wiki/tools/gemini-review-prompt.md` (the v3 prompt Gemini uses to grade my JSON)
- Chapter sequence: `index.html` has the canonical seq order (1, 2, 3, 4, 5, 6, …) — follow that order
- Per-chapter status: there are `wiki/chN-deliverables/` folders for chapters already done

## What's already done
- ch2 (A/B-1 Organising Things into Categories) — JSON v2, Gemini APPROVED, patched HTML in `wiki/ch2-deliverables/`
- ch3 (A-2 Solids, Liquids, and Gases) — JSON v2, Gemini APPROVED with minor fixes (applied), patched HTML in `wiki/ch3-deliverables/`
- ch4 (A-3 Air Is a Substance) — JSON v2, Gemini APPROVED with minor fixes (applied), embedded in local `chapter-a3-air-substance.html`, committed locally as `6ddd151`
- ch5 (D-1 Gravity I) — JSON v1, embedded in local `chapter-d1-gravity-1.html`, Gemini round-trip skipped due to context budget

## What to do next
**Resume auto-pilot from chapter seq #6 — B-2: Living vs Natural Earth vs Human-Made.**
That's a separate microsite at `https://shelikag-ops.github.io/Living-Manmade/` (repo `shelikag-ops/Living-Manmade`).

For each chapter, in seq order:
1. Extract the chapter content (curl from URL if microsite, read local file if it's a `chapter-*.html`)
2. Generate the bee quiz JSON per `wiki/tools/bee-quiz-generation-spec.md` (15 MCQs in 5 categories of 3, plus 8-12 word cards). Run the self-check before submitting.
3. Submit to the **"Science Bee Prep Strategy and Feedback"** Gemini chat via Claude in Chrome (the prior session used this same chat — find it in the Gemini sidebar). Capture the verdict.
4. Apply Gemini's per-question and per-card fixes. Bump the JSON to v2.
5. Embed the JSON as `<script type="application/json" id="bee-quiz-data">` before `</body>` in the chapter's HTML. Commit locally with the established message style: `<CODE> v<N> bee-quiz: embed Gemini-approved quiz JSON` followed by a short list of fixes applied.
6. Save deliverables under `wiki/chN-deliverables/` (patched HTML, patch file, gemini_review_v1.md).
7. Move to the next chapter without checking in.

## Key constraints
- **Don't pause to ask permission to advance to the next chapter.** This is on auto-pilot.
- **Don't try to git push from the sandbox** — it has no GitHub credentials. Previous sessions also pushed from the user's Mac terminal, not from co-work. See `_fix_git.sh` for the established pattern. Just commit locally and save the deliverable; the user runs `git push` from their Mac.
- For chapters that live in separate microsite repos (seq 1, 2, 3, 6, etc), don't try to clone them locally for editing — produce a patch file and patched HTML in `wiki/chN-deliverables/` so the user can apply on their Mac.
- Publish progress updates in chat as you go (the user is on auto-pilot but watching).

## Once you're done with a chapter
Update a running `wiki/auto-pilot-status.md` file (create if missing) with the seq, verdict, and any blockers, so a future resume session can pick up cleanly.

Start by reading the three wiki files above, then begin chapter seq #6 (B-2).
