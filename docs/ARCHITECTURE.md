# Architecture

This public case study describes the production retrieval architecture without publishing TeachScribe's proprietary application source code.

The system combines a React Native/Expo interface, local media enumeration, a CLIP-compatible tokenizer, separate text and image ONNX encoders, native Android image preprocessing, a persistent embedding cache and explicit human review. Inference and ranking run on the device. Accepting a result does not train or update the pretrained model, and this retrieval path contains no face-recognition or identity-matching stage.

## Retrieval flow

1. Request photo access, enumerate accessible media and resolve an optional local date/window filter.
2. Snapshot the observation and candidate list for one active search.
3. Tokenise the text to the CLIP context length and encode a 512-component query vector.
4. Reuse valid image vectors from memory or SQLite. Only cache misses require image preprocessing and image-model inference.
5. Compute cosine similarity, sort descending and initially present five suggestions.
6. Preserve the original successful-search result separately from the user's later photo/no-match decision.

The persistent image-vector cache changes the cost structure materially: a fully cached search can avoid loading or running the image encoder and instead pays for text encoding, cache access, scoring, sorting and UI scheduling.

![Local retrieval architecture](figures/architecture.svg)

## Inference contracts

| Stage | Contract |
| :-- | :-- |
| Text input | int32 `[1,77]` token IDs |
| Text output | 512-component embedding |
| Image input | float32 `[1,3,224,224]` tensor |
| Image output | 512-component embedding |
| Native buffer | 150,528 Float32 values / 602,112 little-endian bytes |
| Ranking | cosine similarity, sorted descending; score is not a probability |

Text and image sessions are acquired lazily and reused within a process. Query vectors are recomputed per search; valid image vectors are reusable. A failed session acquisition can be retried. An all-cached search does not need the image session.

## Native image path

The Android preprocessing path performs bounded decoding, crop-preserving downsampling, centred square cropping, antialiased bicubic resizing to 224×224, RGB scaling and CLIP normalisation in NCHW order. Defensive pixel bounds reject implausibly large inputs. The measured preprocessing improvements in this case study use different photographs and are therefore not presented as a strict paired A/B speedup.

## Cache lifecycle

Cache identity combines a model/cache version with media metadata. It is intentionally not presented as a content hash: edits that preserve every key field can evade invalidation, and model or preprocessing changes require a cache-version decision.

RAM coalesces repeated work. Missing valid vectors are hydrated from SQLite; invalid dimensions, byte counts, non-finite values or invalid norms are rejected. Fresh invalid embeddings are rejected before caching. Successful gallery refreshes prune stale or inaccessible keys. Process restart discards sessions and RAM but preserves valid persisted vectors.

## Durable state

| Store | Purpose | Retention |
| :-- | :-- | :-- |
| Image embeddings | Versioned vectors and norms for reuse | Pruned against accessible keys/version |
| Search history | Query/filter, compared count and original Top-5 metadata | Latest 100 successful searches |
| Reviewed observations | Explicit selected-photo or no-match decision | Until user deletion |
| Diagnostics | Timings, counters and outcome metadata | Bounded development/diagnostic retention |

Search history and human review are deliberately separate. Reopening historical results preserves the original ranking snapshot rather than silently recomputing it. The recorded candidate count is the number successfully compared, which can differ from the requested pool when a media file cannot be read or encoded.

## Timing boundary

The reported search timer ends before final rendering and before diagnostic/history persistence. Image read, preprocessing and inference timings are nested inside broader ranking intervals, so phase timings must not be added as if they were independent components. The headline cached-search numbers are therefore **instrumented pipeline latency**, not universal tap-to-visible latency.

## Public/private boundary

This document intentionally preserves the engineering contracts, architecture and trade-offs while omitting source-file names, implementation bodies, proprietary UI code, native-module source, tests and build scripts. See [`PUBLICATION_BOUNDARY.md`](PUBLICATION_BOUNDARY.md).
