# Publication boundary

This repository is the public portfolio derivative of a proprietary TeachScribe engineering project.

The publication rule is intentionally narrow: **describe and evidence the engineering work, but do not publish the application source code.** The goal is to preserve as much recruiter-reviewable technical evidence as possible without exposing reusable product implementation.

## Included publicly

- product/problem context;
- high-level and contract-level architecture;
- model-selection methodology and aggregate results;
- INT8/FP32 retrieval comparison;
- measured latency, memory, startup, scheduling, preprocessing, thermal and battery-side results;
- de-identified temporal acceptance cases;
- validation counts, A/B outcome and evidence limitations;
- technical diagrams and the narrated technical deep dive;
- aggregate/de-identified CSV and JSON evidence.

## Intentionally not published

- React Native / TypeScript application source;
- Kotlin native-module source;
- tests, build/provisioning scripts and patches that expose implementation details;
- model binaries and APKs;
- private images, screenshots, thumbnails and linked per-query records;
- real media identifiers, filenames, exact capture dates or local paths;
- signing material and internal delivery correspondence.

This is therefore not an open-source release or a reimplementation. It is an engineering case study backed by measurements from the audited implementation.
