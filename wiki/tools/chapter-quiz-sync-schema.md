---
type: tool
status: proposed
last_updated: 2026-05-07
sources: []
---

# Chapter Quiz Sync — proposed Notion DB schema

Schema for the new Notion database that will receive chapter-app quiz and homework submissions, replacing the one-way `/quiz` webhook with cross-device sync + AI evaluation.

**Database name:** `🧪 Sarah Chapter Quiz Attempts`
**Parent page:** Sarah HomeSchooling (`32f51d1b052380988f77e602fd730178`)
**Status:** proposed — pending Shell sign-off before Worker build.

---

## Columns

| # | Property | Type | Required | Purpose |
|---|---|---|---|---|
| 1 | Attempt | Title | yes | Composite human-readable label, e.g. `a3 · 2026-05-07 · quiz` |
| 2 | Student | Text | yes | `Sarah`. Future-proofed for siblings or other learners. |
| 3 | Chapter | Text | yes | Chapter id, e.g. `a3`, `b11`, `d3a` |
| 4 | Type | Select | yes | `quiz` or `homework` |
| 5 | Date | Date | yes | Date of the attempt |
| 6 | Auto Score | Number | yes | Multiple-choice questions she got right |
| 7 | Auto Total | Number | yes | Total multiple-choice questions in attempt |
| 8 | Open Count | Number | yes | Open-ended answers requiring AI eval |
| 9 | Percent | Number | yes | `Auto Score / Auto Total × 100` (computed by chapter app) |
| 10 | Answers JSON | Text | yes | Full per-question payload as JSON string. Long. |
| 11 | AI Evaluation | Text | no | **Overall summary only** (overall_summary, three_things_to_revisit, ready_to_advance). Per-question AI feedback lives inside Answers JSON — see below. Empty until eval completes. |
| 12 | AI Status | Select | yes | `pending` (just submitted) / `evaluated` (Worker filled AI Evaluation) / `error` (Worker hit an error grading) |
| 13 | Wrong Question IDs | Text | no | Comma-separated MCQ ids she got wrong, for spaced-review later |
| 14 | Synced At | Created Time | auto | Notion auto-fills |

---

## Why each column is here

**Identity columns** (Student, Chapter, Type, Date, Attempt) — these are how the dashboard filters and groups. Title is composite so a row is human-readable in the Notion view without expanding it.

**Score columns** (Auto Score, Auto Total, Open Count, Percent) — let the dashboard show a quick "X/Y correct, Z open" summary without having to parse Answers JSON. Open Count exists separately because open-ended answers don't auto-grade and shouldn't drag down the auto percent.

**Answers JSON** — full payload. Stored as JSON text because Notion has no nested-object type. The Worker enriches this in place with per-question AI feedback after grading. Each item gains an `ai` sub-object: `null` for MCQs (no need — auto-graded), and a feedback object for open-ended answers. Schema:

```json
[
  {
    "qid": 3,
    "q": "Why does a balloon float in air?",
    "a": "becase helium is lighter",
    "kind": "open",
    "correct": null,
    "ai": {
      "score": 2,
      "strengths": "Right mental model — 'lighter' is a great 3rd-grade way to say 'lower density'.",
      "gaps": "Spelling: 'because'. Could note that air is also a gas, just heavier.",
      "misconception_flag": null,
      "comment_for_sarah": "Yes! Helium is lighter than air, so the balloon goes up. Bonus: what would happen if you filled it with water?"
    }
  },
  {
    "qid": 4,
    "q": "Which of these is a gas?",
    "a": 2,
    "kind": "mcq",
    "correct": true,
    "ai": null
  }
]
```

Field guide for the `ai` sub-object on open-ended answers:

| Field | Audience | Notes |
|---|---|---|
| `score` | parent dashboard | 0–3 scale: 0 not attempted/off-topic, 1 partial mental model, 2 correct for grade, 3 above grade level |
| `strengths` | parent dashboard | What she got right, in teacher voice |
| `gaps` | parent dashboard | What's missing or wrong, in teacher voice |
| `misconception_flag` | parent dashboard | Specific named 3rd-grade misconception (e.g. `"thinks heavier objects fall faster"`) or `null` |
| `comment_for_sarah` | Sarah (kid voice) | Encouraging, age-appropriate feedback the chapter app can show her after submit |

**AI Evaluation + AI Status** — `AI Evaluation` (Notion column) holds the **overall summary** only: `overall_summary`, `three_things_to_revisit`, `ready_to_advance: bool`. Per-question detail lives inside `Answers JSON.ai`, not here. The Worker writes the row immediately with AI Status = `pending`, then asynchronously calls Claude Haiku 4.5, then PATCHes both the `AI Evaluation` summary AND the enriched `Answers JSON`, then flips AI Status to `evaluated`. If the API call errors, status flips to `error` and the dashboard surfaces a "retry" button.

**Wrong Question IDs** — comma-separated list of qids she missed on MCQs. Cheap to compute on submit, useful for the future spaced-review feature so missed questions resurface.

---

## What goes into the KV slot (separate, for autosave)

KV key: `chapter-inprogress:<student>:<chapter>` — e.g. `chapter-inprogress:Sarah:a3`

Value (JSON, overwritten on every autosave):

```json
{
  "quizAnswers": { "0": {...}, "1": {...} },
  "quizFlags": [3, 7],
  "quizHintsRevealed": { "5": true },
  "quizSkipped": [2],
  "currentIndex": 8,
  "lastEdited": "2026-05-07T14:32:11Z",
  "device": "desktop"
}
```

KV slot is cleared on quiz finish (when the Notion row is created). If she opens chapter-a3 on a second device while a slot exists, the chapter app prompts: *"Resume your in-progress attempt from desktop (started 14:32, 8/12 answered)?"*

---

## See also

- [`notion-database-ids.md`](notion-database-ids.md) — sibling schema for bee quiz attempts
- [`../../CLAUDE.md`](../../CLAUDE.md) — project schema
