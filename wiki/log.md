---
type: overview
last_updated: 2026-04-25
---

# Log

Append-only chronological log. Each entry uses the prefix `## [YYYY-MM-DD] <kind> | <one-line summary>` so it's parseable. Common kinds: `init`, `ingest`, `query`, `lint`, `session`, `decision`.

```
grep "^## \[" log.md | tail -10
```

---

## [2026-04-25] init | Wiki scaffolded as part of Projects-wide rollout

Created CLAUDE.md (project-specific, inherits from `../CLAUDE.md`) and wiki skeleton: `README.md`, `index.md`, `log.md`, `improvements.md`, plus the standard subfolders. No content yet — fills in as the project is worked on.

## [2026-04-26] query | Science bees Sarah can target for the 2027 season

Shell asked which science bees an 8-year-old (US 2nd/3rd grade ≈ India Class 2/3) can enter, with prep resources. Researched US, India, and online options; settled on four targets: SOF ISO, Silverzone iOS, NSTSE (India), National Science Bee Elementary (US), and NSF Junior Science Bee (US). NSF JSC also planned as the spring/summer 2027 capstone.

## [2026-04-26] decision | Bee prep integrates with chapter app, not as a separate track

Decided bee prep should ride on existing chapter quiz infrastructure rather than spawn a parallel curriculum. The chapters already include "SciOly Tier-3 trap" misconception callouts (see `chapter-d3a-directions.html` slide 4a) — the design intent was already bee-aware. Integration adds a *mode toggle* (mastery vs. bee), not new content.

## [2026-04-26] ingest | 2027 Science Bee Prep plan + chapter integration spec

Created four wiki pages:
- `subjects/2027-science-bee-prep.md` — master prep plan, 12-month phased timeline, weekly cadence, resource stack
- `subjects/chapter-bee-topic-map.md` — per-chapter mapping to bee syllabus areas
- `tools/bee-mode-spec.md` — spec for "bee mode" toggle in chapter quiz (timed, no hints, shuffled)
- `concepts/bee-question-style.md` — how bee questions differ from BFSU mastery questions

Updated `index.md` to register all four. Updated `improvements.md` with a flag about the 10/60/30 mastery distribution potentially needing to shift to 20/55/25 for chapters with high bee-prep value. Populated `overview/current-status.md` (was a stub).

## [2026-04-26] decision | Refocus to US-only bees; India events demoted to optional practice

Shell flagged that the India-heavy plan was confusing. Cut Silverzone iOS entirely (redundant with SOF). Demoted SOF ISO Class 2 (Nov/Dec 2026) and NSTSE Class 2 (Jan 2027) to *purely optional* practice exams. Primary bees are now NSB Elementary (US, Sep 2026-May 2027) and NSF Junior Science Bee (US, Apr-Aug 2027). Switched recommended workbook from MTG NSO (India syllabus) to Spectrum Science Grade 2 (US syllabus).

## [2026-04-26] ingest | Gemini chapter-review prompt + storage decision pending

Shell asked for two things: (1) a drop-in Gemini prompt to generate bee quiz + word cards + quality review per chapter, and (2) a recommendation for dynamic progress storage (Notion vs Google Drive).

Created `tools/gemini-chapter-review-prompt.md` with the full prompt (3 outputs: 15 MCQs by category, 8-12 word cards, 200-word quality review) plus usage workflow and variant prompts (JSON mode, HTML mode, quick-pass mode).

**Storage decision pending Shell's choice.** Recommended Google Sheets + Apps Script for technical simplicity (no Worker needed, native charts) over Notion (which she already uses but requires a Cloudflare Worker proxy to hold the API token client-side). Both are viable; will build prototype with whichever she picks.

**Architecture for chapter app integration:** Index cards = chapter-level decks (source of truth in chapter HTML markup) + daily aggregator (`word-jar.html` at project root, Leitner spaced-rep, reads from chosen backend). Bee Quiz tab uses Option B (Quick 5 / Full 15 / Mixed Review sub-modes).

## [2026-04-26] decision | Bee quiz framework finalized — 5 categories + 5 cross-cutting rules

After three rounds of feedback (Shell + Gemini reviewer pass), the bee quiz generation framework is locked:

**Categories (3 questions each, 15 total):** vocab, recall, misconception, sequence, negative-selection.

**Cross-cutting rules:**
1. Half-right distractors in ≥3 questions
2. Instrument/unit question in ≥1 if chapter has measurement content
3. Positional balance — correct answer roughly even across a/b/c/d
4. Example-to-category framing in ≥2 questions
5. Buzzer-friendly rear-loaded stems in ≥half of non-negative-selection questions

**Per-question rules:** stem ≤25 words; chapter content only; capitalize NOT/EXCEPT in negative-selection.

**Per-card rules:** word never in own definition; no synonyms harder than the word itself.

Saved as `tools/gemini-review-prompt.md` (reviewer side) and `tools/bee-quiz-generation-spec.md` (generator side, mirrored). Updated `concepts/bee-question-style.md` to reflect the 5-category framework. Same spec on both sides means generation passes review without round-trip.

## [2026-04-29] session | First working session note filed (covering Apr 25-29)

Session note `sessions/2026-04-29.md` filed to capture the multi-day arc: bee plan designed + chapter-d3a prototype shipped + 3 Notion databases live + 22-slide parent deck published. Cross-referenced from `index.md`.

## [2026-04-29] query | Confirm wiki follows Karpathy's LLM Wiki pattern

Shell asked to verify the wiki is structured per Karpathy's gist (`gist.github.com/karpathy/442a6bf555914893e9891c11519de94f`). Confirmed: the project's wiki has been built on this pattern since the Apr 25 bootstrap. All three layers (raw sources, wiki, CLAUDE.md schema), all three operations (Ingest/Query/Lint), and both special files (index.md, log.md with `## [YYYY-MM-DD] kind | title` prefix) are in place.

## [2026-04-29] ingest | First Gemini review pass complete — BDK approved with minor fixes

Drove Gemini in Chrome (logged-in account, Fast model) using the v3 reviewer prompt + condensed BDK source content + the v1 JSON. Verdict: **APPROVED WITH MINOR FIXES**. Five real fixes applied to produce v2 of `bee-content/01-bdk.json`:
1. Position rebalance (Q1 c→a, Q10 c→d) — fixes C-overrepresentation
2. Q6 replaced (cherry-picking → Some is NOT All) — closes coverage gap on Tool #5
3. Q9 stem shortened (25→21 words)
4. "Threat" word card reworded to avoid concept-circular framing
5. "Independent Test" card simplified for 3rd-grade language

One Gemini suggestion skipped — lowercase NOT/EXCEPT in Q13-15. Misread of the v3 spec which requires capitalization for buzzer visibility; root cause was my condensed prompt wording. Lesson: future reviews should paste the full wiki version of the rule, not abbreviated.

Full review archived at `wiki/sources/2026-04-29-gemini-review-bdk.md`. v1 → v2 history embedded in the JSON's `review_history` array.

Production-line validation: ✅ The two-LLM loop works. Ready to scale to remaining 40 chapters.

## [2026-04-29] ingest | First chapter through the bee-quiz production line — BDK

Generated bee quiz JSON for chapter 1 (Baloney Detection Kit, sequence #1 in the project's chapter ordering — `index.html` line 212). Source content fetched directly from `shelikag-ops.github.io/Baloney-Detection-Kit/` via curl since the microsite isn't a local file.

Output: `bee-content/01-bdk.json` — 15 questions (3 vocab + 3 recall + 3 misconception + 3 sequence + 3 negative-selection) + 10 word cards. All v3 framework rules pass per the embedded `self_check` block (half-right ≥3, example-to-category ≥2, buzzer-friendly ≥half non-NS, all stems ≤25 words, correct-answer position spread a/b/c/d 3/3/5/4).

Status: pending Gemini review. Once approved, will be the first of 41 chapters' worth of bee content.

## [2026-04-29] ingest | Chapter→Readers mapping table + Amazon links

Created `tools/chapter-to-readers-map.md` mapping all 36 BFSU chapters to specific DK First Science Encyclopedia subsections + Spectrum Grade 3 chapters + NASA Space Place gap-fill articles for Phase 6 astronomy chapters. Verified Amazon URLs: DK ([1465443444](https://www.amazon.com/dp/1465443444)), Spectrum Science Grade 3 ([1483811670](https://www.amazon.com/dp/1483811670)). Note: DK title is officially "First Science Encyclopedia" (corrected from the earlier "First Encyclopedia of Science" wording in the deck and prep plan).

## [2026-04-26] ingest | Slide deck v3 — Grade 3, homeschool, word jar, reading strategy

Updated `Sarah-2027-Science-Bee-Plan.pptx` (and PDF) at project root from 18 slides to 22 slides. Changes:
- Grade 3 throughout (Sarah's competition-window grade — not 2nd as v2 had it)
- New slide 7: How homeschoolers participate in NSB + NSF
- Slide 9: Saturday 15-min review expanded into 4 specific activities
- Slide 10: Phase B "spiral review" + "bee-mode runs" bullets explained in plain English
- New slide 14: DK + reader sequencing strategy (hybrid: match-then-sweep-then-drill)
- New slide 15: Word jar physical setup (materials, card format, daily routine)
- New slide 16: Bee Quiz tab integration (three weekly use patterns)

## [2026-04-26] ingest | Bee Quiz prototype shipped — chapter-d3a + word-jar.html

**Notion databases created** as children of the Sarah HomeSchooling page:
- 🐝 Sarah Bee Quiz Attempts: `2de2bcd5b1cd46a59dc6289863d7c30b`
- 🃏 Sarah Word Cards: `2b950200f7804b219b6c9bc311be47f1`
- 📅 Sarah Daily Bee Sessions: `f5fb1cbf41824e36adde8a47820a000d`

**chapter-d3a-directions.html** modified additively (4 surgical edits):
1. New 🐝 Bee Quiz tab button between Quiz and Teacher
2. New `panel-beequiz` with 3 mode buttons (Quick 5 / Full 15 / Mixed Review), question UI, results screen, and Word Cards section
3. Bee quiz CSS + word card flip CSS appended to existing `<style>` block
4. New `<script>` block at end with 15 bee questions, 10 word cards, mode logic, 30s timer with warning state, localStorage persistence, and Notion sync via `localStorage.getItem('hs-notion-key')` + `x-notion-key` header (mirrors dashboard.html pattern)

The 15 questions follow the v3 framework: 3 vocab + 3 recall + 3 misconception + 3 sequence + 3 negative-selection. 4 use half-right distractors, 2 use example-to-category framing, correct answers spread across a/b/c/d positions, all stems ≤25 words.

**word-jar.html** created at project root:
- Aggregates word cards from all chapters via `localStorage` keys `wc-cards-*` (chapter d3a publishes its cards to `wc-cards-d3a` on load)
- Leitner spaced repetition (Box 1 NEW → Box 2 LEARNING → Box 3 MASTERED) with intervals 1/3/7 days
- Daily session: 3 NEW + 3 LEARNING + 2 MASTERED = 8 cards, ~5 min
- Stats dashboard: total cards, learning, mastered, day streak
- Per-card sync to Word Cards database + daily summary sync to Daily Sessions database

Both files reuse the existing Cloudflare Worker at `https://anthropic-proxy.shelikag.workers.dev` and read the Notion token from the same `hs-notion-key` localStorage key dashboard.html uses, so no additional setup needed if the dashboard already has a token saved.

## [2026-04-26] decision | Reuse existing Cloudflare Worker for Notion sync

Found `Sarah Homeschooling/cloudflare-worker.js` deployed at `https://anthropic-proxy.shelikag.workers.dev`. Already has `/notion/*` proxy route, CORS, and KV config store. The bee app reuses this — zero new infrastructure. Notion token goes into the Worker as a secret env var (`NOTION_TOKEN`); chapter HTML calls `worker-url/notion/v1/...` with no auth header needed.

## [2026-04-26] decision | Workbook recommendation corrected to Grade 3 (Sarah's competition-window level)

Shell flagged that Sarah will be in 3rd grade during the Sep 2026-May 2027 competition window, asking why I recommended Grade 2 books. Two corrections:

1. **Factual error:** Spectrum Science series doesn't have a Grade 2 edition — starts at Grade 3. Recommendation of "Spectrum Science Grade 2" was impossible.
2. **Reasoning error:** Was being conservative for an 8yo, but for 8 months of prep, "current grade level" is too easy too fast. Should match competition tier.

**Updated recommendation:** Spectrum Science Grade 3 as primary (right level for comp window), DK First Encyclopedia of Science (ages 6-9, fits now through Phase B), optional supplement of 180 Days of Science Grade 3 OR Brain Quest Grade 3. Phase C (Jan 2027) adds Spectrum Grade 4 + DK Science Encyclopedia (ages 9-12) as stretch material.

Total spend now: ~$28 primary, ~$43 with supplement. Updated `tools/dk-workbook-routine.md` and `subjects/2027-science-bee-prep.md`.

## [2026-04-26] ingest | Chapter session counts scanned + completion calendar

Scanned all 36 chapter HTMLs via `parts-preview` block. Total: **51 sessions across 36 chapters** (avg 1.4 sessions/chapter). 15 chapters are 2-session: b3, b4, b4a, b4b, c2, c3, b5, b5a, b6, c5, c6, c7, d1, d2, d3.

Built projected calendar at 3 sessions/week starting May 4, 2026 with 6 weeks of slip baked in (Memorial Day, 2× summer travel, mid-Aug illness, Labor Day, late-Sep buffer). **Projected finish: Fri Oct 9, 2026** — coincides with NSB Elementary qualifier window opening.

Created `tools/chapter-session-tracker.md` with full table + weekly calendar. Created `tools/dk-workbook-routine.md` with concrete daily routine (DK First Encyclopedia + Spectrum Science Grade 2 + index-card word jar, ~75 min/week). Rewrote `subjects/2027-science-bee-prep.md` for US-primary focus.
