# Browser Multimodal Retrieval Demo

An independent, browser-based image retrieval demo built from scratch with a standard public CLIP model and public sample data.

Users describe an image in natural language, the browser encodes the text and gallery images into the same embedding space, and the gallery is ranked by cosine similarity. Inference runs locally in the browser through Transformers.js / ONNX Runtime Web; there is no application backend.

> **Boundary:** this repository contains no TeachScribe source code, assets, UI, data, private architecture, or implementation details. It is a deliberately generic portfolio demonstration using public tooling and data.

## What this demonstrates

- multimodal text-to-image retrieval with a shared embedding space;
- client-side ML inference with a web-ready ONNX model;
- separate image and text encoders;
- normalised embeddings and cosine-similarity ranking;
- in-memory gallery indexing;
- browser-side latency measurement;
- local image uploads that remain in the browser session;
- a static deployment surface with no server-side application code.

## High-level flow

```text
public sample images / local uploads
              |
              v
       CLIP vision encoder
              |
              v
   normalised image embeddings
              |
              +-------------------------+
                                        |
text query -> CLIP text encoder -> normalised text embedding
                                        |
                                        v
                              cosine similarity
                                        |
                                        v
                                  ranked gallery
```

The sample implementation uses `Xenova/clip-vit-base-patch32` with Transformers.js. The first run downloads the public model from Hugging Face; subsequent runs can use the browser cache.

## Why this is intentionally separate from proprietary work

This demo is not a source release or reimplementation of a commercial product. It intentionally avoids product-specific code and architecture. In particular, it does **not** include TeachScribe's application code, mobile integration, persistent embedding storage, internal scheduling/caching logic, private model packaging, production data, branding, or UI.

The purpose is narrower: provide a directly inspectable example of the underlying public ML concept while keeping commercial implementation details private.

## Run locally

Because the page imports an ES module and downloads model assets, serve the directory over HTTP rather than opening `index.html` directly from disk.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a modern browser.

No package install or build step is required.

## Use the demo

1. Click **Initialise model**, or submit a query to initialise automatically.
2. Wait for the CLIP text and vision encoders to download and for the public sample gallery to be indexed.
3. Search with a natural-language description such as `people playing football` or `an astronaut in space`.
4. Inspect the ranked gallery and cosine-similarity scores.
5. Optionally add local images. They are processed in the current browser session and are not uploaded to an application server.

The first model load can take time because the ONNX weights are downloaded in the browser. Query-time ranking is measured separately after the image gallery has been indexed.

## Implementation notes

The app uses two public CLIP projection models: a vision encoder for gallery items and a text encoder for queries. Image vectors are computed once per browser session and stored only in memory. Each query produces one text vector, which is compared against the current image vectors with cosine similarity.

This separation makes the demo easy to reason about and keeps the retrieval path explicit without reproducing any private production system.

## Sample data

The default gallery loads example images from the Hugging Face `Xenova/transformers.js-docs` dataset used in Transformers.js documentation. Those images are not redistributed in this repository and remain subject to their respective source/licensing terms.

## Technology

- JavaScript / ES modules
- Transformers.js 3.8.1
- ONNX Runtime Web through Transformers.js
- CLIP ViT-B/32 (`Xenova/clip-vit-base-patch32`)
- HTML + CSS
- browser-native File API and Performance API

## Deployment

The project is intentionally static and can be served by GitHub Pages or any ordinary static host. No GitHub Actions workflow is required for the demo itself.

## Scope and limitations

This is a compact portfolio demo, not a production retrieval service. It uses a small public gallery, keeps embeddings only in memory, depends on the user's browser/device for inference performance, and does not claim production-scale latency, quality, memory, energy, or deployment results.

The cosine scores are model similarities within this demo; they are not calibrated probabilities.
