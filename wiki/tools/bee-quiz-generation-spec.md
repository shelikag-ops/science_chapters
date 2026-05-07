---
type: tool
status: active
last_updated: 2026-04-26
sources: []
---

# Bee Quiz Generation Spec

The rules I (Claude) follow when generating bee quiz + word cards for a chapter. Mirrors the [`gemini-review-prompt.md`](gemini-review-prompt.md) — same spec on both sides ensures my output passes Gemini's review without round-trip.

---

## Per chapter, produce
- Exactly **15 multiple-choice questions** (3 per category × 5 categories)
- **8-12 word cards** for the chapter's key vocabulary
- Output as JSON (schema below)

## Question categories — exactly 3 each

| Category | What it tests |
|---|---|
| vocab | Direct definition recall ("X is called a:") |
| recall | Named facts, numbers, ordered things |
| misconception | Trap on a real wrong belief a 3rd-grader would have |
| sequence | Ordering, relative position, "which is closer/below/before" |
| negative-selection | "Which of these is NOT…" / "All EXCEPT" format |

## Cross-cutting requirements (apply across the 15)

1. **Half-right distractors** in ≥3 questions — wrong options that pair correct adjective with wrong noun ("Igneous Mineral" when answer is "Igneous Rock")
2. **Instrumentation/unit question** in ≥1 if the chapter has measurement content (anemometer, graduated cylinder, °C, kg, mL, m/s, etc.)
3. **Positional balance** — correct answers roughly even across a/b/c/d; no position with ≥6 hits
4. **Example-to-category framing** in ≥2 questions ("A bat is an example of which group of animals?")
5. **Buzzer-friendly rear-loaded stems** in ≥ half of non-negative-selection questions ("The state of matter that has X and Y is called what?" rather than "Which state of matter has X and Y?")

## Per-question rules
- Stem ≤ 25 words (it's a science test, not a reading test)
- Chapter content only — no outside facts introduced
- Plausible distractors (real misconceptions, not silly distractors)
- Single best answer
- Difficulty rating (easy/medium/hard) honest for an 8-9-year-old
- Negative-selection: capitalize NOT or EXCEPT in the question text
- Sequence: ordering must be objective (not opinion)

## Per-card rules
- Word never appears in its own definition
- No synonyms harder than the word itself (don't define "Evaporation" with "Vaporization")
- Kid-language only — a 3rd-grader can read it without a parent
- Concrete, memorable example with an emoji if it aids memory
- Cards cover the chapter's most important terms (not minor or arbitrary)

## Output JSON schema

```json
{
  "chapter": "<chapter id, e.g. d3a>",
  "topic": "<short topic name>",
  "bee_quiz": [
    {
      "id": 1,
      "category": "vocab|recall|misconception|sequence|negative-selection",
      "difficulty": "easy|medium|hard",
      "question": "...",
      "choices": { "a": "...", "b": "...", "c": "...", "d": "..." },
      "correct": "a|b|c|d",
      "distractor_strategy": "half-right|common-misconception|plausible|obvious-wrong",
      "misconception_targeted": "..."
    }
  ],
  "word_cards": [
    {
      "word": "...",
      "definition": "...",
      "example": "...",
      "emoji": "...",
      "difficulty": "easy|medium|hard"
    }
  ]
}
```

`misconception_targeted` is only present when `category` is `"misconception"`. `distractor_strategy` is required on every question.

## Pre-output self-check (Claude's mental review)

Before returning JSON, verify:
- [ ] 3 + 3 + 3 + 3 + 3 = 15 questions across the 5 categories
- [ ] 8-12 word cards
- [ ] ≥ 3 questions use `distractor_strategy: "half-right"`
- [ ] If chapter has measurement → ≥ 1 question on instrument or unit
- [ ] Correct answers distributed: count of `correct` per letter is roughly 3-4 each
- [ ] ≥ 2 questions use example-to-category framing
- [ ] ≥ half of non-negative-selection questions have answer-elicitation at the end
- [ ] All stems ≤ 25 words
- [ ] All questions answerable from chapter content only
- [ ] No word card has the word inside its own definition
- [ ] No word card uses a synonym harder than the word itself
- [ ] Coverage spans the chapter (not bunched on one slide)

If any check fails, revise BEFORE outputting.

---

## See also

- [`gemini-review-prompt.md`](gemini-review-prompt.md) — Gemini reviewer side (same spec)
- [`../concepts/bee-question-style.md`](../concepts/bee-question-style.md) — concept page
- [`../subjects/2027-science-bee-prep.md`](../subjects/2027-science-bee-prep.md) — master prep plan
- [`bee-mode-spec.md`](bee-mode-spec.md) — chapter-app integration spec
