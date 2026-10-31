import test from "node:test";
import assert from "node:assert/strict";
import { registerMorphImageRoutes } from "../server/lib/morphImageRoutes.ts";

function harness(path, method = "post", body = {}) {
  const routes = new Map();
  const app = {
    get(p, h) { routes.set(`get:${p}`, h); },
    post(p, h) { routes.set(`post:${p}`, h); },
  };
  registerMorphImageRoutes(app);
  const responses = {};
  const res = {
    status(n) { responses.status = n; return res; },
    json(value) { responses.payload = value; return res; },
  };
  const req = {
    ip: "198.51.100.42",
    socket: { remoteAddress: "198.51.100.42" },
    body,
    header(name) { return name === "host" ? "example.test" : name === "sec-fetch-site" ? "same-origin" : undefined; },
  };
  return { invoke: () => routes.get(`${method}:${path}`)(req, res), responses };
}

test("provider status does not claim connectivity without an enabled server key", () => {
  const key = process.env.GEMINI_API_KEY, enabled = process.env.MORPH_IMAGE_ENABLED;
  delete process.env.GEMINI_API_KEY;
  process.env.MORPH_IMAGE_ENABLED = "false";
  try {
    const { invoke, responses } = harness("/api/morph/image-status", "get");
    invoke();
    assert.equal(responses.payload.configured, false);
  } finally {
    if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
    if (enabled === undefined) delete process.env.MORPH_IMAGE_ENABLED; else process.env.MORPH_IMAGE_ENABLED = enabled;
  }
});

test("generation fails closed when unconfigured", async () => {
  const key = process.env.GEMINI_API_KEY, enabled = process.env.MORPH_IMAGE_ENABLED;
  delete process.env.GEMINI_API_KEY; process.env.MORPH_IMAGE_ENABLED = "false";
  try {
    const { invoke, responses } = harness("/api/morph/generate-image", "post", { prompt: "A tree" });
    await invoke();
    assert.equal(responses.status, 503);
    assert.match(responses.payload.error, /not configured/i);
  } finally {
    if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
    if (enabled === undefined) delete process.env.MORPH_IMAGE_ENABLED; else process.env.MORPH_IMAGE_ENABLED = enabled;
  }
});

test("generation reads image bytes from real provider response without a fake fallback", async () => {
  const key = process.env.GEMINI_API_KEY, enabled = process.env.MORPH_IMAGE_ENABLED, previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-server-key"; process.env.MORPH_IMAGE_ENABLED = "true";
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal(init.headers["x-goog-api-key"], "test-server-key");
    const args = JSON.parse(init.body);
    assert.equal(args.contents[0].parts[0].text, "A glowing portal");
    assert.equal(args.generationConfig.imageConfig.aspectRatio, "16:9");
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "aGVsbG8=" } }] } }] }) };
  };
  try {
    const { invoke, responses } = harness("/api/morph/generate-image", "post", { prompt: "A glowing portal", aspectRatio: "16:9" });
    await invoke();
    assert.equal(responses.payload.imageUrl, "data:image/png;base64,aGVsbG8=");
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = previousFetch;
    if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
    if (enabled === undefined) delete process.env.MORPH_IMAGE_ENABLED; else process.env.MORPH_IMAGE_ENABLED = enabled;
  }
});

test("invalid image is rejected before calling paid provider", async () => {
  const key = process.env.GEMINI_API_KEY, enabled = process.env.MORPH_IMAGE_ENABLED;
  process.env.GEMINI_API_KEY = "test-server-key"; process.env.MORPH_IMAGE_ENABLED = "true";
  try {
    const { invoke, responses } = harness("/api/morph/edit-image", "post", { prompt: "Change lighting", image: "https://unexpected.example/image" });
    await invoke();
    assert.equal(responses.status, 400);
    assert.match(responses.payload.error, /PNG|JPEG|WebP/);
  } finally {
    if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
    if (enabled === undefined) delete process.env.MORPH_IMAGE_ENABLED; else process.env.MORPH_IMAGE_ENABLED = enabled;
  }
});
