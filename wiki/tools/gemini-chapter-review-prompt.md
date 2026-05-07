---
type: tool
status: active
last_updated: 2026-04-26
sources: []
---

# Gemini Chapter-Review Prompt

The drop-in prompt for using Gemini as a second-opinion reviewer + bee-content generator for each chapter. Workflow: open chapter HTML → copy contents → paste this prompt + chapter into Gemini → get back 15 bee questions + 8-12 word cards + 200-word quality review.

**Why Gemini in the loop:** A second LLM provides quality control that catches things the chapter author (or Claude) misses. Also generates the bee-quiz content at scale — generating 15 questions × 36 chapters by hand is too much; with Gemini it's chapter-by-chapter as Sarah works through them.

**When to use:**
- After completing or substantially editing a chapter
- Before integrating bee quiz content into the chapter HTML
- As part of any chapter retrofit per [`../../RETROFIT_PLAN.md`](../../RETROFIT_PLAN.md)

---

## The prompt (copy-paste below into Gemini)

````
You are helping prepare Sarah, an 8-year-old US homeschool student, for the 2027 National Science Bee Elementary (NSB) competition. Sarah will compete as a 3rd grader during Sep 2026 - May 2027.

Her science curriculum is the BFSU (Building Foundations of Scientific Understanding) chapter set, built as standalone HTML web apps. Each chapter has tabs: Lesson | Homework | Quiz (Mastery) | Bee Quiz | Teacher. The chapter content I'll paste includes lots of HTML/CSS/JS boilerplate — please ignore that and focus on the actual lesson content (slide text, callouts, mystery boxes, vocabulary used).

Your job is to produce THREE outputs:

═══════════════════════════════════════════════════
OUTPUT 1: 15 Bee Quiz questions (single-best-answer MCQ)
═══════════════════════════════════════════════════

Generate exactly 15 multiple-choice questions covering this chapter's content. Distribute as:
- 5 VOCAB questions: test definition recall ("X is called: ___")
- 5 RECALL questions: test fact recall ("How many X?", "X happens when ___")
- 5 MISCONCEPTION questions: target a common wrong belief or trap (the chapter's "SciOly Tier-3 trap" callouts are great seeds for these)

For each question:
- 4 options labeled (a) (b) (c) (d)
- Mark the correct answer with ✓
- Wording must be unambiguous — single best answer
- Distractors should be plausible-but-wrong, not silly
- Reading level: 3rd grade or below
- If a technical term must be used in the stem, define it inline in the question
- No "all of the above" or "none of the above" options
- No double-negatives

Format each as:
Q[N]. [CATEGORY] [Question text]
(a) Option A
(b) Option B ✓
(c) Option C
(d) Option D
Why correct: [1-sentence explanation, max 20 words]

═══════════════════════════════════════════════════
OUTPUT 2: 8-12 Word Cards
═══════════════════════════════════════════════════

Generate 8-12 vocabulary cards covering the chapter's key terms. Each card:
- WORD: the term, in Title Case
- DEFINITION: 1-2 sentences, 3rd-grade reading level. Define in plain language; avoid using other technical terms unless already defined in the chapter.
- EXAMPLE: 1 short sentence with an emoji that makes the word concrete and memorable
- DIFFICULTY: easy / medium / hard
  - easy = the chapter mentions this word multiple times and it's foundational
  - medium = the chapter introduces this word once or twice
  - hard = the chapter alludes to or implies this concept; it's a stretch word

Format each as:
WORD: [Term]
DEFINITION: [definition]
EXAMPLE: [emoji] [example]
DIFFICULTY: [easy/medium/hard]

═══════════════════════════════════════════════════
OUTPUT 3: Chapter Quality Review (max 200 words, prose)
═══════════════════════════════════════════════════

Briefly evaluate the chapter for bee-prep readiness. Address:
1. Are the key bee-syllabus topics for this subject area covered? Name any obvious gaps for the 3rd-grade NSB syllabus.
2. Are there factual errors, age-inappropriate framings, or claims that won't survive a stricter reader?
3. Name the 1-2 specific additions that would most improve bee-prep value (e.g., "add a slide on X," "expand the misconception trap on Y").
4. Is the SciOly Tier-3 misconception trap explicit enough? If the chapter has none, suggest one.

═══════════════════════════════════════════════════
EXAMPLES (from chapter d3a — Cardinal Directions)
═══════════════════════════════════════════════════

Sample Bee Quiz questions:

Q1. [VOCAB] The four main compass directions (N, S, E, W) are called:
(a) cardinal directions ✓
(b) ordinal directions
(c) intermediate directions
(d) compass points
Why correct: "Cardinal" is the standard term for the four primary compass points.

Q5. [MISCONCEPTION] Sarah turns around to face South. Her LEFT hand now points to the:
(a) East ✓
(b) West
(c) North
(d) South
Why correct: When facing South, "left" relative to her body points East. Targets the relative-vs-absolute direction trap.

Sample Word Card:

WORD: Compass Rose
DEFINITION: A circle on a map that shows the four cardinal directions: N, E, S, W.
EXAMPLE: 🗺 Look for the compass rose in the corner of any map.
DIFFICULTY: easy

═══════════════════════════════════════════════════
THE CHAPTER IS BELOW THIS LINE — PROCEED WITH OUTPUTS 1, 2, 3
═══════════════════════════════════════════════════

[PASTE CHAPTER HTML HERE]
````

---

## Workflow

1. Open the chapter HTML you want to review
2. Copy all of it (Cmd+A, Cmd+C)
3. Open a fresh Gemini conversation
4. Paste the prompt above, then paste the chapter HTML where indicated
5. Gemini returns three outputs
6. You skim **Output 3** (the review) first — fix any flagged issues in the chapter source
7. Hand **Output 1 + Output 2** to whoever's doing the HTML integration (probably Claude or you), or paste them into a transform script that produces ready-to-paste HTML
8. After integration, the chapter has its Bee Quiz tab + Word Cards section live, and Sarah's attempts log to the [progress backend](#) (TBD: Sheets or Notion)

---

## When to update this prompt

- If Gemini's output quality drifts (categories getting confused, distractors too silly, etc.) — tighten the relevant section
- If the bee question categories evolve (e.g., adding "PROCESS" questions for experiment-design Qs) — add to Output 1 spec
- If the Word Card schema changes (e.g., adding an audio pronunciation field) — update Output 2 format
- After any change, bump `last_updated` and add a one-line entry to [`../log.md`](../log.md)

## Variants worth keeping in your back pocket

- **JSON output mode:** if you want machine-readable output for batch HTML generation, append to the prompt: `OUTPUT FORMAT OVERRIDE: return all three outputs as a single JSON object with keys "bee_questions", "word_cards", "review". No prose outside the JSON.`
- **HTML-ready output:** if you trust Gemini's HTML generation, append: `Return Outputs 1 and 2 as HTML snippets matching the chapter's existing structure (use class names: q-card, choice, word-card, word-front, word-back).`
- **Quick-pass mode:** for a rapid sanity check on an in-progress chapter, append: `Skip Outputs 1 and 2; do only Output 3. Be more critical than usual.`

---

## See also

- [`../subjects/2027-science-bee-prep.md`](../subjects/2027-science-bee-prep.md)
- [`../tools/bee-mode-spec.md`](../tools/bee-mode-spec.md) — the original bee-mode toggle spec (the bee quiz tab and word cards are an extension of this)
- [`../tools/dk-workbook-routine.md`](../tools/dk-workbook-routine.md)
- [`../concepts/bee-question-style.md`](../concepts/bee-question-style.md) — the question-style taxonomy this prompt uses
- [`../../CHAPTER_QUALITY_GUIDE.md`](../../CHAPTER_QUALITY_GUIDE.md)
