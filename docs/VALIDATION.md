# Validation

The TeachScribe application implementation is not published in this public case study. Validation was performed against the audited private engineering repository; de-identified evidence and an independent verification script are published here.

## Completed private-repository checks

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

## Deployed snapshot vs post-delivery hardening

The delivered/production snapshot predates the later fail-closed guards for freshly computed non-finite or wrong-dimension embeddings. Those guards were added during the audited post-delivery portfolio review. They affect invalid values only; valid finite 512-dimensional embeddings follow the previous path unchanged.

## Performance scope

The 108-search performance benchmark was **not** repeated after the behaviour-preserving refactor. Latency, memory, energy and thermal numbers in this case study remain historical measurements from the benchmark build.

## Public reproducibility

Run:

```bash
python evidence/verify_stats.py
```

The script uses only the Python standard library and recomputes the headline sustained-search median/P95/drift, INT8 text-model size reduction, descriptive FP32/INT8 retrieval totals, Wilson intervals and exact McNemar values from the committed CSV/JSON evidence. It is independent portfolio verification tooling, not TeachScribe application source.

## Canonical public artifacts

| Artifact | SHA-256 |
| :-- | :-- |
| Public engineering case-study PDF v2 | `85e72a451426c4a52917521015ff71ffcfa95ccf15a827c80e878451e72c0fd7` |
| Narrated technical deep-dive MP4 | `4bee6f67bdc46b14b25141c12c4b48379eb67eb7a5098a4a4651ad6f74188539` |

The video hash is the canonical final MP4 independently cross-checked during the publication audit. The PDF v2 is the audited 26-page public report uploaded as a GitHub attachment and linked from the README.

## Public evidence

The files under [`evidence/data/`](../evidence/data/) are copied from the audited engineering evidence without changing the numeric observations. They include model-selection results, Wilson intervals, paired exact McNemar comparisons, INT8-vs-FP32 retrieval results, sustained and warm search timings, startup milestones, temporal cases and scoped engineering measurements.

## Evidence stages

Desktop model selection, historical Android benchmarking, functional acceptance and post-delivery review are separate evidence stages. The small curated retrieval sets are not presented as a population-accuracy estimate, and the 50+ UK-school figure elsewhere in the case study is deployment reach rather than measured feature adoption.

## Hiring review

The full proprietary engineering repository — including implementation, tests, validation tooling and delivery evidence — can be shared with hiring teams on request, with TeachScribe's permission. It is intentionally not linked publicly because access is controlled.
