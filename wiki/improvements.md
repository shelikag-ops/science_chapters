---
type: overview
status: active
last_updated: 2026-04-26
---

# Improvements

Standing list of suggestions for the Sarah Science Chapters project itself. Populated as Claude observes patterns worth flagging.

## Open suggestions

### 2026-04-26 · Reconsider 10/60/30 mastery mix for high-bee-value chapters

The current `CHAPTER_QUALITY_GUIDE.md` mandates a 10% vocab / 60% application / 30% troubleshooting question mix per chapter. For chapters that map heavily to the 2027 bee syllabus (see [`subjects/chapter-bee-topic-map.md`](subjects/chapter-bee-topic-map.md)) this may be too vocab-light — bees test recall density above all. **Suggestion:** for chapters tagged with ≥3 bee-syllabus matches, shift to ~20/55/25. Re-test on `chapter-d3a-directions.html` first.

### 2026-04-26 · Align RETROFIT_PLAN priority with bee timeline

The current retrofit order isn't bee-aware. Suggestion: re-sort the Grade-B and Grade-C tier in `RETROFIT_PLAN.md` so chapters most needed for Phase B prep (Aug-Dec 2026 SOF/Silverzone push) get retrofitted first. Specifically, prioritize:
1. Phase 4 Matter chapters (a3-air, a4-water, a5-states-of-matter) — heavy in SOF Class 3
2. Phase 6 Earth/Space (d4-sun-moon, d5-day-night, d6-seasons) — heavy in NSB Astronomy
3. Phase 1 Life chapters (b3, b4) — already Grade A in part, but verify bee-mode compatibility

### 2026-04-26 · Add `<meta name="bee-topics">` tag to all chapter retrofits

Per [`tools/bee-mode-spec.md`](tools/bee-mode-spec.md), every chapter should declare its bee-syllabus coverage in metadata. Make this a required field in the chapter retrofit checklist alongside the existing 7 quality patterns.

## See also

- [`overview/current-status.md`](overview/current-status.md)
- [`subjects/2027-science-bee-prep.md`](subjects/2027-science-bee-prep.md)
- [`tools/bee-mode-spec.md`](tools/bee-mode-spec.md)
- [`../CLAUDE.md`](../CLAUDE.md)
- [`../../INDEX.md`](../../INDEX.md)
