---
type: tool
status: planned
last_updated: 2026-04-26
sources:
  - ../../chapter-d3a-directions.html
  - ../../CHAPTER_QUALITY_GUIDE.md
---

# Bee Mode — Chapter App Integration Spec

The "bee mode" toggle for the chapter HTML quiz. Re-uses the existing 30-question quiz infrastructure; changes presentation, not content.

**Status:** spec only. Not yet implemented. Implementation belongs in a dedicated build session.

---

## Why this exists

Sarah's prep for the 2027 science bee season (see [`../subjects/2027-science-bee-prep.md`](../subjects/2027-science-bee-prep.md)) needs her to practice the **same** chapter material in two postures:

1. **Mastery mode** — current default. Hints, CER, untimed. Builds understanding.
2. **Bee mode** — new. No hints, 30-sec timer per question, shuffled, MCQ-only. Builds speed-recall.

The chapters already encode bee-relevant material (the `chapter-d3a-directions.html` quiz includes explicit "SciOly Tier-3 trap" misconceptions). The work here is exposing that material in bee-friendly presentation.

---

## What the user sees

A new button in the quiz section header:

```
🧠 Quiz       [ Mastery Mode ▼ ]   ← toggle
                Mastery Mode
                Bee Mode (timed)
                Bee Mode (untimed) ← for early Phase A
```

When **Bee Mode (timed)** is active:

- All `.q-hints` elements hidden via CSS class `.bee-active`
- A countdown timer overlay appears on each `.q-card` (30 sec default)
- Question order shuffled on session start
- Auto-advance on answer or timeout (no "Next" button needed)
- Final result screen shows score **and** average response time
- The "Flag" button (`.q-flag`) becomes "Mark for review" — still works post-session
- The progress dot (`.qn`) gains a new state `.qn.timeout` (red dashed) for unanswered timed-out questions

When **Bee Mode (untimed)** is active: same as above but no timer. Used in Phase A to build the muscle without time pressure.

---

## Implementation sketch

### File structure
- New shared script: `bee-mode.js` at project root, included in every chapter via one extra `<script>` tag in `<head>` near line 92 of the existing chapter pattern
- New shared CSS: append to existing chapter `<style>` block OR extract to `bee-mode.css` if Sarah wants per-chapter editability
- No changes to question data — bee mode reads existing quiz markup

### Public API the chapter HTML needs
The current chapter has functions like `renderQuiz()`, `submitAnswer()`, `nextQuestion()` (inferred from the `.qn-grid`, `.choice-list`, `.q-feedback` classes). Bee mode hooks should:

```js
window.BeeMode = {
  enter(opts = { timed: true, perQuestionSec: 30, shuffle: true }) { /* ... */ },
  exit() { /* restore mastery mode */ },
  isActive: false,
};
```

### Required hooks in existing chapter code
The chapter quiz logic must expose three hook points:

1. **`onQuestionRender(qEl, qData)`** — bee mode injects timer overlay
2. **`onAnswerSelected(qEl, isCorrect)`** — bee mode auto-advances
3. **`onQuizStart(questionList)`** — bee mode shuffles

If hook points don't exist yet, the simplest path is for `bee-mode.js` to **observe** rather than **integrate**: use `MutationObserver` on `.q-card.active` to inject timers without touching chapter code. Slower to build but zero coupling — good for the 38 existing chapters.

### Per-chapter metadata
Each chapter HTML gains one `<meta>` tag in `<head>`:

```html
<meta name="bee-topics" content="cardinal-directions,navigation,earth-science,axis,poles">
```

This drives [`../subjects/chapter-bee-topic-map.md`](../subjects/chapter-bee-topic-map.md) and lets a future dashboard query "show me all chapters tagged for SOF ISO Earth Science."

### Per-question metadata (optional, post-MVP)
For the 30-question quiz to be optimal in bee mode, each `.q-card` could gain `data-bee-applicable="true|false"`. Some chapter questions (e.g., open-ended "explain to a toddler") shouldn't appear in bee mode at all.

---

## Score tracking (post-MVP)

Bee mode results should persist to localStorage so Sarah can see week-over-week improvement:

```js
{
  "chapter-d3a": [
    { date: "2026-09-12", mode: "bee-timed", score: 22, total: 30, avgSec: 18.4 },
    { date: "2026-09-19", mode: "bee-timed", score: 26, total: 30, avgSec: 14.1 }
  ]
}
```

A "Sarah's Bee Stats" page (`bee-stats.html` at project root) reads from all chapter localStorage and shows a simple chart.

---

## Migration plan for the 38 existing chapters

Per [`../../RETROFIT_PLAN.md`](../../RETROFIT_PLAN.md), chapters are graded A-D. Apply bee mode in this order:

1. **First wave (Grade A chapters):** they already meet quality bar; bee mode just turns on. Expected: 5-8 chapters work day-1.
2. **Second wave (Grade B chapters):** during their planned retrofit, the retrofit author also adds the `<meta name="bee-topics">` tag and verifies the 30-Q quiz has enough recall-style questions (≥10 of 30). The reference chapter `chapter-d3a-directions.html` should be the template.
3. **Third wave (Grade C/D chapters):** bee mode probably waits for full retrofit anyway.

The shared `bee-mode.js` ships once and works for all chapters as they're updated.

---

## Edge cases / open questions

- **Slides have embedded mini-questions** (the "🧪 Try It Yourself" callouts). These are not part of the quiz pool. Bee mode should ignore them.
- **The `body.presenting` class** rewrites the layout for projector use. Bee mode and presenting mode should be mutually exclusive — entering one exits the other.
- **Teacher mode** (`teacher-only` class) is separate; bee mode hides teacher controls when active.
- **Mobile (<700px)** — the timer overlay needs a compact layout; spec assumes a top-right pill on desktop, full-width banner on mobile.
- **The "boss" difficulty questions** (`.q-difficulty.boss`) — should bee mode include them? Recommend: yes for NSB prep, no for SOF Class 3 (where Achievers section is a separate tier).

---

## See also

- [`../subjects/2027-science-bee-prep.md`](../subjects/2027-science-bee-prep.md)
- [`../subjects/chapter-bee-topic-map.md`](../subjects/chapter-bee-topic-map.md)
- [`../concepts/bee-question-style.md`](../concepts/bee-question-style.md)
- [`../../CHAPTER_QUALITY_GUIDE.md`](../../CHAPTER_QUALITY_GUIDE.md)
- [`../../RETROFIT_PLAN.md`](../../RETROFIT_PLAN.md)
