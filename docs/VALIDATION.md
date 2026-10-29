# Validation

The application implementation is not included in this public case study. Validation was performed against the audited engineering repository before publication of this evidence-only derivative.

## Completed checks

Last complete run: **28 October 2026**. All checks passed.

| Check | Result |
| :-- | :-- |
| TypeScript | strict typecheck passed |
| ESLint | zero warnings |
| Node regression suite | **33/33 passed** |
| Python regression suite | **15/15 passed** |
| Refactor proof | **143** original units preserved, **0 mismatches** |
| On-device A/B | same Top-5 asset order and similarity scores for every compared search |

The automated tests cover date/DST behaviour, persistence, embedding-cache behaviour, tokenizer reference vectors, ranking helpers, pipeline event order, yielding and cancellation, session reuse/retry, invalid-vector handling, statistical helpers and A/B comparison logic.

## Performance scope

The 108-search performance benchmark was not repeated after the behaviour-preserving refactor. Latency, memory, energy and thermal numbers in this case study remain historical measurements from the benchmark build.

## Public evidence

The files under [`evidence/data/`](../evidence/data/) are copied from the audited engineering evidence without changing the numeric observations. They include model-selection results, Wilson intervals, paired exact McNemar comparisons, INT8-vs-FP32 retrieval results, sustained and warm search timings, startup milestones, temporal cases and scoped engineering measurements.

## Evidence stages

Desktop model selection, historical Android benchmarking, functional acceptance and post-delivery review are separate evidence stages. The small curated retrieval sets are not presented as a population-accuracy estimate, and the 50+ UK-school figure elsewhere in the case study is deployment reach rather than measured feature adoption.
