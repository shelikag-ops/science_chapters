---
type: tool
status: active
last_updated: 2026-05-07
sources: []
---

# Chapter Quiz Sync — deploy guide for Shell

How to deploy the chapter-quiz cross-device sync + AI eval + print-to-PDF feature. Complete these steps once, then test in `chapter-a3-air-substance.html`.

**You are deploying:**
1. New Notion database for chapter-quiz attempts
2. New Worker module appended to your existing `anthropic-proxy.shelikag.workers.dev` Worker
3. (Already done in this repo) A-3 chapter retrofitted to use the new endpoints

---

## Step 1 — Create the Notion database

In Notion, under the **Sarah HomeSchooling** page (the same parent as Bee Quiz Attempts), create a new database called **🧪 Sarah Chapter Quiz Attempts**.

Add these properties exactly (full schema in [`chapter-quiz-sync-schema.md`](chapter-quiz-sync-schema.md)):

| Property | Type | Options |
|---|---|---|
| Attempt | Title | — |
| Student | Text | — |
| Chapter | Text | — |
| Type | Select | options: `quiz`, `homework` |
| Date | Date | — |
| Auto Score | Number | — |
| Auto Total | Number | — |
| Open Count | Number | — |
| Percent | Number | — |
| Answers JSON | Text | — |
| AI Evaluation | Text | — |
| AI Status | Select | options: `pending`, `evaluated`, `error` |
| Wrong Question IDs | Text | — |

Once created, copy the database ID from the URL (the 32-char hex chunk before any `?`). You'll plug it into the Worker as `CHAPTER_QUIZ_DB_ID`.

**Important — Notion integration access:** the integration token already configured for `hs-notion-key` must have access to this new database. Notion → database → top-right `⋯` → Connections → add the same integration that the Bee Quiz Attempts DB uses.

---

## Step 2 — Add the Worker module

Copy [`/worker/chapter-quiz-sync.js`](../../worker/chapter-quiz-sync.js) into your `Sarah Homeschooling/` worker repo, alongside the existing `cloudflare-worker.js`.

In `cloudflare-worker.js`, import it and add a route check at the top of your fetch handler:

```js
import { handleChapterQuiz } from './chapter-quiz-sync.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/chapter-quiz')) {
      return handleChapterQuiz(request, env, ctx);
    }
    // ... existing routes (/notion/*, /quiz, etc.)
  }
};
```

---

## Step 3 — Configure Worker secrets and vars

```bash
cd path/to/Sarah\ Homeschooling/worker

# AI eval API key (Claude Haiku 4.5)
wrangler secret put ANTHROPIC_API_KEY
# (paste your key when prompted)

# NOTION_TOKEN should already be set — verify with:
wrangler secret list
```

In `wrangler.toml`, add the database ID as a var (not a secret — it's not sensitive):

```toml
[vars]
CHAPTER_QUIZ_DB_ID = "PASTE_THE_32_CHAR_HEX_ID_HERE"
```

Also confirm the KV namespace binding exists (it should, from the bee-app setup). The Worker code references `env.KV`:

```toml
kv_namespaces = [
  { binding = "KV", id = "EXISTING_KV_NAMESPACE_ID" }
]
```

---

## Step 4 — Deploy

```bash
wrangler deploy
```

---

## Step 5 — Smoke tests

```bash
# 1. Listing past attempts (empty initially) — expect {attempts: []}
curl 'https://anthropic-proxy.shelikag.workers.dev/chapter-quiz?student=Sarah&chapter=a3'

# 2. Mid-quiz autosave — write
curl -X PUT 'https://anthropic-proxy.shelikag.workers.dev/chapter-quiz/inprogress' \
  -H 'Content-Type: application/json' \
  -d '{"student":"Sarah","chapter":"a3","state":{"quizAnswers":{"0":{"selected":1,"correct":true}},"currentIndex":1,"lastEdited":"2026-05-07T14:00:00Z"}}'

# 3. Mid-quiz autosave — read back
curl 'https://anthropic-proxy.shelikag.workers.dev/chapter-quiz/inprogress?student=Sarah&chapter=a3'

# 4. Submit a fake completed attempt — expect {id, autoCorrect, autoTotal, openCount, percent}
curl -X POST 'https://anthropic-proxy.shelikag.workers.dev/chapter-quiz' \
  -H 'Content-Type: application/json' \
  -d '{"student":"Sarah","chapter":"a3","type":"quiz","payload":{"ts":"2026-05-07T14:30:00Z","answers":[{"qid":0,"q":"What is air?","a":"a mix of gases","kind":"open","correct":null}]}}'
```

After step 4, open the Notion DB — you should see a new row with `AI Status: pending`, then ~5–15 seconds later the status flips to `evaluated` and per-question `ai` blocks appear inside the `Answers JSON` cell.

---

## Step 6 — Browser test on A-3

1. Open `chapter-a3-air-substance.html` in your browser.
2. Click the **Quiz** tab.
3. Type "Sarah" as the student name and click Start.
4. Answer a couple questions — within ~2s a green `🟢 Synced` pill should appear bottom-right.
5. Open the same chapter on a second device (or even another browser) and start the quiz with the same student name → it should prompt: *"Resume your in-progress attempt?"*
6. Finish the quiz. The result screen should show three buttons: 🔍 Review, 📄 Print feedback report, 🔁 Retake. The pill should flip to 🟣 Grading… then 🟢 Feedback ready, and a per-question feedback panel appears below the score.
7. Click **📄 Print feedback report** → browser print dialog opens → choose "Save as PDF" to share the file with Sarah.

---

## What to do if AI eval gets stuck

If the pill stays on 🟣 Grading… for over a minute, check the Notion row's `AI Status` field. If it says `error`, the `AI Evaluation` text field will contain the error message (Anthropic API issue, JSON parse failure, etc.). Most common cause: the daily 200-eval cap was hit — wait until tomorrow or raise `DAILY_EVAL_CAP` in `chapter-quiz-sync.js`.

---

## See also

- [`chapter-quiz-sync-schema.md`](chapter-quiz-sync-schema.md) — column definitions + JSON shape
- [`notion-database-ids.md`](notion-database-ids.md) — sibling bee-app schema this mirrors
- [`/worker/chapter-quiz-sync.js`](../../worker/chapter-quiz-sync.js) — Worker source
- `chapter-a3-air-substance.html` — pilot retrofit (lines 200, ~215–560)
