---
type: concept
status: active
last_updated: 2026-04-26
sources:
  - ../../CHAPTER_QUALITY_GUIDE.md
---

# Bee Question Style

How questions in science bees and olympiads differ from the BFSU chapter mastery questions Sarah is used to. This concept matters because bee prep isn't "more chapters" — it's the **same content** asked in a different posture.

---

## The two postures

### Mastery (BFSU chapter style)
- Probes whether she **understands** a concept
- Often application or troubleshooting ("if the wheel was bigger, would the friction…")
- Hints available, progressive
- CER follow-up (Claim → Evidence → Reasoning)
- Untimed
- Three-tier mix per [`../../CHAPTER_QUALITY_GUIDE.md`](../../CHAPTER_QUALITY_GUIDE.md): 10% vocab / 60% application / 30% troubleshooting

### Bee (competition style)
- Probes whether she **recalls** a fact, can categorize, or can resist a misconception trap
- Single best answer, tight wording, rear-loaded for buzzer
- No hints
- 15-30 seconds typical, sometimes 5 sec for buzzer rounds
- Heavy weight on vocab, named-thing recall, sequence/ordering, exclusion ("which is NOT")
- For oral bees: speed of recall matters as much as knowing the answer

---

## The five categories Sarah's bee quiz uses

| Category | What it tests | Example |
|---|---|---|
| vocab | Direct definition recall | "The four main compass directions are called __" |
| recall | Named facts, numbers | "The Sun rises in the __" |
| misconception | Trap on a real wrong belief | "Sarah faces South. Her LEFT hand points to the __" (catches relative-vs-absolute confusion) |
| sequence | Ordering, relative position | "Which planet is directly closer to the Sun than Earth?" |
| negative-selection | "Which is NOT" / "All EXCEPT" | "Which of these is NOT a cardinal direction?" |

The 5-category framework comes from analyzing how National Science Bee and NSF JSC questions are actually constructed. Default LLM-generated quizzes lean ~80% toward vocab — the 5-category split forces the harder cognitive load that buzzer competitions demand.

## Cross-cutting techniques in good bee questions

These appear *across* categories — they're not their own category, they're tactics applied within questions:

- **Half-right distractors** — wrong options that pair the correct adjective with the wrong noun ("Igneous Mineral" when answer is "Igneous Rock"). Catches students who recognize one half but haven't fully paired the concept.
- **Example-to-category framing** — "X is an example of which group?" tests reverse application of definitions, not just forward recall.
- **Buzzer-friendly rear-loading** — for read-aloud bees, putting the answer-elicitation at the END of the question lets a student buzz right at the giveaway. "The state of matter that has a definite volume but no definite shape is called what?" beats "Which state of matter has...?"
- **Instrument/unit specificity** — if the chapter mentions measurement, expect a question on the tool (anemometer, graduated cylinder) or unit (°C, kg).
- **Positional balance** — correct answer is distributed across a/b/c/d, not biased to any one position.

---

## Concrete contrast

**Mastery question** (from a chapter on friction):
> A skater is gliding across a frozen pond. She wants to slow down without falling. What force should she rely on, and how would she increase it? Explain using evidence from the experiments we did in this chapter.

**Bee question** (same topic, vocab category):
> The force that opposes motion when two surfaces rub against each other is called: (a) gravity (b) friction ✓ (c) inertia (d) momentum

**Bee question** (same topic, misconception category, half-right distractor):
> Friction always: (a) opposes motion ✓ (b) opposes gravity (c) creates motion (d) reduces weight

**Bee question** (same topic, negative-selection):
> Which of these is NOT a way to reduce friction? (a) Adding oil (b) Polishing surfaces (c) Pressing harder ✓ (d) Using rolling wheels

Same concept. Wildly different cognitive demand. Mastery requires understanding + articulation. Bee requires instant pattern-match plus resistance to traps.

---

## Why both matter

The trap in olympiad prep is to drill **only** bee-style questions. Kids who do that score well on the immediate exam but lose conceptual depth — they recognize "friction" without understanding why surfaces resist each other. The trap in chapter-only learning is the inverse: deep understanding but slow retrieval, which loses bee buzzer rounds.

The chapter app's [bee-mode toggle](../tools/bee-mode-spec.md) lets Sarah practice the same chapter material in mastery posture; the dedicated [bee quiz tab](../tools/bee-quiz-generation-spec.md) gives her purpose-built bee questions in bee posture.

---

## Question-type vocabulary (so we use consistent terms)

| Term | Meaning | Where used |
|---|---|---|
| **Vocab Q** | Direct definition recall | Bee quiz vocab category; SOF Achievers section |
| **Recall Q** | Named fact ("How many bones in a human body?") | Bee quiz recall category |
| **Sequence Q** | Ordering or relative position | Bee quiz sequence category; common in earth/astronomy |
| **Negative-selection Q** | "Which is NOT…" / "All EXCEPT" | Bee quiz negative-selection category; common buzzer tactic |
| **Application Q** | Apply concept to a novel scenario | Mastery only |
| **Troubleshooting Q** | Find what's wrong with a setup | Mastery only |
| **Misconception Q** | Trap that targets a common wrong belief | Mastery + bee misconception category |
| **CER Q** | Claim + Evidence + Reasoning | Mastery only (homework) |

The chapter quizzes are heavy on Application + Troubleshooting (60+30 = 90% per the quality guide). Bees are heavy on Vocab + Recall + Misconception + Sequence + Negative-Selection. **The 10% vocab tier in chapters is the bee-prep overlap zone.** When retrofitting chapters with bee prep in mind, that 10% may need to grow to 20-25% for high-bee-value chapters — flagged in [`../improvements.md`](../improvements.md).

---

## See also

- [`../subjects/2027-science-bee-prep.md`](../subjects/2027-science-bee-prep.md)
- [`../tools/gemini-review-prompt.md`](../tools/gemini-review-prompt.md)
- [`../tools/bee-quiz-generation-spec.md`](../tools/bee-quiz-generation-spec.md)
- [`../tools/bee-mode-spec.md`](../tools/bee-mode-spec.md)
- [`../subjects/chapter-bee-topic-map.md`](../subjects/chapter-bee-topic-map.md)
- [`../../CHAPTER_QUALITY_GUIDE.md`](../../CHAPTER_QUALITY_GUIDE.md)
