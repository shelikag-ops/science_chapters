---
type: tool
status: active
last_updated: 2026-04-26
sources: []
---

# Notion Database IDs — Sarah Bee Sync

The 3 Notion databases the chapter HTML and word-jar.html sync to. Created 2026-04-26 under the **Sarah HomeSchooling** parent page (`32f51d1b052380988f77e602fd730178`).

**Worker URL:** `https://anthropic-proxy.shelikag.workers.dev`
**Auth pattern:** `localStorage.getItem('hs-notion-key')` → sent as `x-notion-key` header (mirrors `dashboard.html`)

---

## The three databases

| # | Database | DB ID | Notion URL |
|---|---|---|---|
| 1 | 🐝 Sarah Bee Quiz Attempts | `2de2bcd5b1cd46a59dc6289863d7c30b` | https://www.notion.so/2de2bcd5b1cd46a59dc6289863d7c30b |
| 2 | 🃏 Sarah Word Cards | `2b950200f7804b219b6c9bc311be47f1` | https://www.notion.so/2b950200f7804b219b6c9bc311be47f1 |
| 3 | 📅 Sarah Daily Bee Sessions | `f5fb1cbf41824e36adde8a47820a000d` | https://www.notion.so/f5fb1cbf41824e36adde8a47820a000d |

---

## Database 1 — 🐝 Sarah Bee Quiz Attempts

One row per bee quiz session. Auto-synced from chapter HTML at end of each attempt.

| Property | Type | Notes |
|---|---|---|
| Attempt | Title | Composite string like `d3a · 2026-09-12 · quick-5` |
| Chapter | Text | e.g. `d3a` |
| Date | Date | When the attempt happened |
| Mode | Select | `quick-5` / `full-15` / `mixed-review` |
| Score | Number | Number correct |
| Total | Number | Total questions in attempt |
| Percent | Number | Score / Total × 100, computed by app |
| Avg Sec per Q | Number | Average response time in seconds |
| Wrong Question IDs | Text | Comma-separated list of wrong Q IDs (e.g. `3,7,11`) |
| Synced At | Created Time | Auto |

## Database 2 — 🃏 Sarah Word Cards

One row per vocab card. Updated each time a card is reviewed (Leitner box transitions).

| Property | Type | Notes |
|---|---|---|
| Word | Title | The word itself |
| Chapter | Text | Chapter the card came from |
| Box | Select | `1-NEW` / `2-LEARNING` / `3-MASTERED` |
| Last Reviewed | Date | Date of most recent review |
| Correct Streak | Number | Current correct streak |
| Wrong Streak | Number | Current wrong streak |
| Total Reviews | Number | Lifetime review count |
| First Seen | Created Time | Auto |
| Last Updated | Last Edited Time | Auto |

## Database 3 — 📅 Sarah Daily Bee Sessions

One row per day she practices. Used for streak tracking + parent dashboard.

| Property | Type | Notes |
|---|---|---|
| Date | Title | `YYYY-MM-DD` format |
| Cards Reviewed | Number | Word cards reviewed that day |
| Quiz Attempts | Number | Bee quiz sessions completed |
| Words Mastered Today | Number | Cards that hit Box 3 today |
| Streak Days | Number | Consecutive days with practice |
| Notes | Text | Optional notes |

---

## How the chapter HTML uses these

```js
// Pattern mirrors dashboard.html lines 2031-2035, 7280-7283, 7295-7296
const PROXY = 'https://anthropic-proxy.shelikag.workers.dev';
const NOTION_TOKEN = localStorage.getItem('hs-notion-key') || '';

const BEE_QUIZ_DB    = '2de2bcd5b1cd46a59dc6289863d7c30b';
const WORD_CARDS_DB  = '2b950200f7804b219b6c9bc311be47f1';
const DAILY_SESSIONS_DB = 'f5fb1cbf41824e36adde8a47820a000d';

async function notionCreatePage(databaseId, properties) {
  if (!NOTION_TOKEN) return; // sync disabled
  return fetch(`${PROXY}/notion/v1/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-notion-key': NOTION_TOKEN
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties
    })
  });
}
```

Token is shared with `dashboard.html` (same localStorage key `hs-notion-key`). If user saves the token in dashboard's settings, bee app reads it for free.

---

## Integration access notes

The integration token used in `hs-notion-key` must have access to the Sarah HomeSchooling page (or an ancestor). Since the dashboard already syncs, this is presumably already configured. If sync fails with a 404, re-check the integration's connections in Notion.

---

## See also

- [`bee-quiz-generation-spec.md`](bee-quiz-generation-spec.md) — generation rules
- [`gemini-review-prompt.md`](gemini-review-prompt.md) — Gemini reviewer prompt
- [`bee-mode-spec.md`](bee-mode-spec.md) — chapter-app integration
- [`../subjects/2027-science-bee-prep.md`](../subjects/2027-science-bee-prep.md) — master prep plan
