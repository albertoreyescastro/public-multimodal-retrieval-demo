import {
  AutoProcessor,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  RawImage,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

env.allowLocalModels = false;

const MODEL_ID = "Xenova/clip-vit-base-patch32";

const SAMPLE_GALLERY = [
  {
    id: "tiger",
    title: "Tiger",
    sourceLabel: "Hugging Face Transformers.js docs",
    source: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/tiger.jpg",
    displayUrl: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/tiger.jpg",
    kind: "sample",
  },
  {
    id: "football",
    title: "Football match",
    sourceLabel: "Hugging Face Transformers.js docs",
    source: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/football-match.jpg",
    displayUrl: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/football-match.jpg",
    kind: "sample",
  },
  {
    id: "cats",
    title: "Cats",
    sourceLabel: "Hugging Face Transformers.js docs",
    source: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg",
    displayUrl: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg",
    kind: "sample",
  },
  {
    id: "astronaut",
    title: "Astronaut",
    sourceLabel: "Hugging Face Transformers.js docs",
    source: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/astronaut.png",
    displayUrl: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/astronaut.png",
    kind: "sample",
  },
  {
    id: "butterfly",
    title: "Butterfly",
    sourceLabel: "Hugging Face Transformers.js docs",
    source: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/butterfly.jpg",
    displayUrl: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/butterfly.jpg",
    kind: "sample",
  },
  {
    id: "portrait",
    title: "Portrait",
    sourceLabel: "Hugging Face Transformers.js docs",
    source: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/portrait-of-woman_small.jpg",
    displayUrl: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/portrait-of-woman_small.jpg",
    kind: "sample",
  },
];

const els = {
  form: document.querySelector("#search-form"),
  query: document.querySelector("#query"),
  searchButton: document.querySelector("#search-button"),
  initialiseButton: document.querySelector("#initialise-button"),
  upload: document.querySelector("#image-upload"),
  resetButton: document.querySelector("#reset-button"),
  results: document.querySelector("#results"),
  template: document.querySelector("#result-card-template"),
  statusText: document.querySelector("#status-text"),
  statusMetric: document.querySelector("#status-metric"),
  progress: document.querySelector("#progress"),
  runtimeLabel: document.querySelector("#runtime-label"),
  statusDot: document.querySelector("#status-dot"),
  latencyCard: document.querySelector("#latency-card"),
  latencyValue: document.querySelector("#latency-value"),
};

let gallery = SAMPLE_GALLERY.map((item) => ({ ...item }));
let runtime = null;
let runtimePromise = null;
let indexedVectors = new Map();
let isBusy = false;

function normalise(values) {
  const vector = Array.from(values, Number);
  let sumSquares = 0;
  for (const value of vector) sumSquares += value * value;
  const norm = Math.sqrt(sumSquares) || 1;
  return vector.map((value) => value / norm);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) dot += a[i] * b[i];
  return dot;
}

function setRuntimeState(state, label) {
  els.statusDot.className = "status-dot";
  if (state) els.statusDot.classList.add(state);
  els.runtimeLabel.textContent = label;
}

function setStatus(text, metric = "", progress = null) {
  els.statusText.textContent = text;
  els.statusMetric.textContent = metric;
  if (progress === null) {
    els.progress.removeAttribute("value");
  } else {
    els.progress.value = Math.max(0, Math.min(100, progress));
  }
}

function setBusy(value) {
  isBusy = value;
  els.searchButton.disabled = value;
  els.initialiseButton.disabled = value;
  els.upload.disabled = value;
}

function renderGallery(items = gallery, ranked = false) {
  els.results.replaceChildren();

  for (const [index, item] of items.entries()) {
    const fragment = els.template.content.cloneNode(true);
    const card = fragment.querySelector(".result-card");
    const image = fragment.querySelector("img");
    const rank = fragment.querySelector(".rank-badge");
    const title = fragment.querySelector("h3");
    const sourceLabel = fragment.querySelector(".source-label");
    const scoreBlock = fragment.querySelector(".score-block");
    const scoreValue = fragment.querySelector(".score-value");

    image.src = item.displayUrl;
    image.alt = item.title;
    title.textContent = item.title;
    sourceLabel.textContent = item.sourceLabel;

    if (ranked) {
      card.classList.add("ranked");
      rank.textContent = `#${index + 1}`;
      scoreBlock.hidden = false;
      scoreValue.textContent = item.score.toFixed(3);
    }

    els.results.append(fragment);
  }
}

function createProgressHandler(stage) {
  return (event) => {
    if (!event || typeof event !== "object") return;

    const rawProgress = Number(event.progress);
    if (Number.isFinite(rawProgress)) {
      const value = rawProgress <= 1 ? rawProgress * 100 : rawProgress;
      setStatus(stage, `${Math.round(value)}%`, value);
      return;
    }

    if (event.status === "ready") {
      setStatus(stage, "ready", 100);
    }
  };
}

async function loadRuntime() {
  if (runtime) return runtime;
  if (runtimePromise) return runtimePromise;

  runtimePromise = (async () => {
    setBusy(true);
    setRuntimeState("loading", "Loading CLIP");

    try {
      setStatus("Loading tokenizer and image processor…", "", null);
      const [tokenizer, processor] = await Promise.all([
        AutoTokenizer.from_pretrained(MODEL_ID),
        AutoProcessor.from_pretrained(MODEL_ID),
      ]);

      setStatus("Downloading text encoder…", "", null);
      const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, {
        progress_callback: createProgressHandler("Downloading text encoder…"),
      });

      setStatus("Downloading vision encoder…", "", null);
      const visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, {
        progress_callback: createProgressHandler("Downloading vision encoder…"),
      });

      runtime = { tokenizer, processor, textModel, visionModel };
      setRuntimeState("ready", "CLIP ready · browser inference");
      setStatus("Model ready. Building the in-memory image index…", "", 100);
      return runtime;
    } catch (error) {
      console.error(error);
      runtimePromise = null;
      setRuntimeState("error", "Model load failed");
      setStatus(
        "Could not load the model. Check your connection and browser console, then try again.",
        "",
        0,
      );
      throw error;
    } finally {
      setBusy(false);
    }
  })();

  return runtimePromise;
}

async function encodeImage(item) {
  const models = await loadRuntime();
  const rawImage = await RawImage.read(item.source);
  const imageInputs = await models.processor(rawImage);
  const { image_embeds: imageEmbeds } = await models.visionModel(imageInputs);
  return normalise(imageEmbeds.data);
}

async function ensureGalleryIndexed() {
  await loadRuntime();

  const missing = gallery.filter((item) => !indexedVectors.has(item.id));
  if (missing.length === 0) return;

  setBusy(true);
  const start = performance.now();

  try {
    for (const [index, item] of missing.entries()) {
      setStatus(
        `Encoding gallery image ${index + 1} of ${missing.length}: ${item.title}`,
        "",
        (index / missing.length) * 100,
      );
      const vector = await encodeImage(item);
      indexedVectors.set(item.id, vector);
    }

    const elapsed = performance.now() - start;
    setStatus(
      `Indexed ${missing.length} image${missing.length === 1 ? "" : "s"} in memory.`,
      `${elapsed.toFixed(0)} ms`,
      100,
    );
  } finally {
    setBusy(false);
  }
}

async function encodeText(query) {
  const models = await loadRuntime();
  const textInputs = models.tokenizer([query], {
    padding: true,
    truncation: true,
  });
  const { text_embeds: textEmbeds } = await models.textModel(textInputs);
  return normalise(textEmbeds.data);
}

async function runSearch(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery || isBusy) return;

  setBusy(true);
  els.latencyCard.hidden = true;

  try {
    await ensureGalleryIndexed();
    setStatus(`Encoding query: “${cleanQuery}”`, "", null);

    const start = performance.now();
    const queryVector = await encodeText(cleanQuery);
    const ranked = gallery
      .map((item) => ({
        ...item,
        score: cosineSimilarity(queryVector, indexedVectors.get(item.id)),
      }))
      .sort((a, b) => b.score - a.score);
    const elapsed = performance.now() - start;

    renderGallery(ranked, true);
    els.latencyValue.textContent = `${elapsed.toFixed(1)} ms`;
    els.latencyCard.hidden = false;
    setStatus(`Ranked ${ranked.length} images for “${cleanQuery}”.`, "local inference", 100);
  } catch (error) {
    console.error(error);
    setRuntimeState("error", "Search failed");
    setStatus("Search failed. See the browser console for details and retry.", "", 0);
  } finally {
    setBusy(false);
  }
}

async function initialise() {
  if (isBusy) return;

  setBusy(true);
  try {
    await loadRuntime();
    await ensureGalleryIndexed();
    setRuntimeState("ready", "CLIP ready · gallery indexed");
  } catch {
    // State is already surfaced to the UI by loadRuntime/ensureGalleryIndexed.
  } finally {
    setBusy(false);
  }
}

async function addUploads(files) {
  const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
  if (selected.length === 0) return;

  const additions = selected.slice(0, 8).map((file, index) => {
    const objectUrl = URL.createObjectURL(file);
    return {
      id: `upload-${Date.now()}-${index}`,
      title: file.name,
      sourceLabel: "Local upload · browser session only",
      source: file,
      displayUrl: objectUrl,
      kind: "upload",
    };
  });

  gallery.push(...additions);
  els.resetButton.disabled = false;
  renderGallery();

  if (!runtime) {
    setStatus(`${additions.length} local image${additions.length === 1 ? "" : "s"} added.`, "not indexed yet", 0);
    return;
  }

  setBusy(true);
  try {
    for (const [index, item] of additions.entries()) {
      setStatus(
        `Encoding uploaded image ${index + 1} of ${additions.length}: ${item.title}`,
        "",
        (index / additions.length) * 100,
      );
      indexedVectors.set(item.id, await encodeImage(item));
    }
    setStatus(`${additions.length} local image${additions.length === 1 ? "" : "s"} added to the in-memory index.`, "", 100);
  } finally {
    setBusy(false);
  }
}

function removeUploads() {
  for (const item of gallery.filter((entry) => entry.kind === "upload")) {
    indexedVectors.delete(item.id);
    URL.revokeObjectURL(item.displayUrl);
  }

  gallery = gallery.filter((item) => item.kind !== "upload");
  els.resetButton.disabled = true;
  els.upload.value = "";
  els.latencyCard.hidden = true;
  renderGallery();
  setStatus("Local uploads removed. The public sample gallery is unchanged.", "", runtime ? 100 : 0);
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(els.query.value);
});

els.initialiseButton.addEventListener("click", initialise);

els.upload.addEventListener("change", () => {
  addUploads(els.upload.files);
});

els.resetButton.addEventListener("click", removeUploads);

document.querySelectorAll("[data-query]").forEach((button) => {
  button.addEventListener("click", () => {
    els.query.value = button.dataset.query;
    runSearch(button.dataset.query);
  });
});

renderGallery();
