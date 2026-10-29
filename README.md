<p align="center">
  <img src="docs/readme/hero.svg" width="100%" alt="TeachScribe — on-device multimodal photo retrieval. Applied AI engineering by Alberto Reyes Castro." />
</p>

<p align="center"><strong>Production pipeline · Shipped within TeachScribe's 50+ UK-school deployment · DfE AI Tools for Education programme</strong></p>

<p align="center">
  <a href="https://github.com/user-attachments/files/34106097/TeachScribe_On_Device_Multimodal_Retrieval_Public_Engineering_Case_Study.pdf"><img src="docs/readme/button-report.svg" height="42" alt="Engineering report" /></a>&nbsp;
  <a href="https://albertoreyescastro.github.io"><img src="docs/readme/button-portfolio.svg" height="42" alt="Portfolio" /></a>&nbsp;
  <a href="https://www.linkedin.com/in/alberto-reyes-ba5546238"><img src="docs/readme/button-linkedin.svg" height="42" alt="LinkedIn" /></a>
</p>

# TeachScribe — On-Device Multimodal Photo Retrieval

**Applied AI engineering case study · Alberto Reyes Castro**

This public portfolio repository documents the architecture, measured results, validation outcomes and de-identified evidence behind an on-device photo-retrieval feature built for TeachScribe. The proprietary application source code is intentionally not published.

## Technical deep dive

https://github.com/user-attachments/assets/686275ae-5e92-4469-83d3-fb213f77ac7a

**98-second narrated walkthrough** — on-device multimodal retrieval, model selection, INT8 deployment, Android optimisation, measured performance and validation.

## Problem

Early Years observations can be associated with many photos captured around the same period. The feature uses the observation text plus an optional local date/window filter to rank relevant photos directly on the Android tablet, then leaves the final choice to the teacher.

The retrieval path is fully local: text and images are encoded on-device, image embeddings are reused from a persistent cache, and the ranked Top-5 remains a human-reviewed suggestion rather than an automated decision.

## Production context

The pipeline has been integrated into TeachScribe and shipped within its deployment to **50+ UK schools**. That number is deployment reach, not measured adoption of this specific feature. The quantitative results below come from controlled engineering evaluation rather than production telemetry.

## Engineering contribution

- compared **5 pretrained vision-language models** and selected TinyCLIP 39M/16;
- deployed separate INT8 text/image ONNX encoders on constrained Android hardware;
- implemented native image preprocessing and persistent embedding reuse;
- measured and tuned scheduling, preprocessing, memory, startup, thermal and battery-side behaviour;
- preserved explicit human review and independent search-history records;
- validated the later refactor with 33 Node tests, 15 Python tests and an on-device A/B comparison.

## Results

| Result | Scope |
| :-- | :-- |
| **441.07 ms median / 459.28 ms P95** | 108 consecutive cached searches over 44 photos |
| **1.82% drift** | first 20 vs last 20 medians in that sequence |
| **74.77% smaller text encoder** | 178,520,196 to 45,042,123 bytes after INT8 quantisation |
| **97/110 same top-1 image** | INT8 vs FP32 descriptive total across three related sets |
| **76.3 MiB idle PSS** | lazy image session; 166.6 MiB preload variant rejected |
| **17/20 Hit@1** | TinyCLIP 39M/16 on the curated Hard set; 95% Wilson CI 64–95% |

![108 cached searches](docs/figures/sustained_latency.svg)

## Architecture

![Local retrieval architecture](docs/figures/architecture.svg)

The architecture uses separate text and image encoders, native Android preprocessing, persistent image-vector reuse, cosine ranking and explicit human review. Detailed contracts and cache behaviour are retained in [Architecture](docs/ARCHITECTURE.md).

## Inspect the evidence

The repository publishes aggregate numeric evidence rather than only screenshots or headline claims. See [Evidence data](evidence/data/README.md), [Validation](docs/VALIDATION.md), [Limitations](docs/LIMITATIONS.md), [Privacy](docs/PRIVACY.md) and the [Publication boundary](docs/PUBLICATION_BOUNDARY.md).

## Rights

This is an engineering case study rather than an open-source application release. See [Rights and attribution notice](NOTICE.md) and [Third-party notices](THIRD_PARTY_NOTICES.md).

---

**Alberto Reyes Castro · Applied AI Engineer · London, UK**  
[Portfolio](https://albertoreyescastro.github.io) · [GitHub](https://github.com/albertoreyescastro) · [LinkedIn](https://www.linkedin.com/in/alberto-reyes-ba5546238)
