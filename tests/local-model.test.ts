import test from "node:test";
import assert from "node:assert/strict";
import { askLocalModel, probeLocalModel } from "../client/src/lib/localModel";

class FakeStorage {
  private values = new Map<string, string>();
  getItem(k: string) { return this.values.get(k) || null; }
  setItem(k: string, v: string) { this.values.set(k, v); }
  removeItem(k: string) { this.values.delete(k); }
}
const originalFetch = globalThis.fetch;
const originalStorage = (globalThis as any).localStorage;
const originalNative = (globalThis as any).SynthiaAndroid;
const fakeStorage = new FakeStorage();
(globalThis as any).localStorage = fakeStorage;

test.after(() => {
  globalThis.fetch = originalFetch;
  (globalThis as any).localStorage = originalStorage;
  (globalThis as any).SynthiaAndroid = originalNative;
});

test("missing native bridge and missing weights are NOT ready", async () => {
  (globalThis as any).SynthiaAndroid = undefined;
  globalThis.fetch = async () => { throw new Error("connection refused"); };
  const status = await probeLocalModel();
  assert.equal(status.available, false);
  assert.equal(status.nativeBridge, "missing");
  assert.equal(status.modelFound, false);
});

test("native bridge status is distinguished from a configured model name", async () => {
  (globalThis as any).SynthiaAndroid = {
    getLocalModelStatus: () => JSON.stringify({ ok: true, ready: true, phase: "running" }),
  };
  globalThis.fetch = async () => { throw new Error("not running"); };
  const status = await probeLocalModel();
  assert.equal(status.nativeBridge, "ready");
  assert.equal(status.available, true);
});

test("remote local server is not incorrectly described as APK embedded", async () => {
  (globalThis as any).SynthiaAndroid = undefined;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/api/tags")) {
      return new Response(JSON.stringify({ models: [{ name: "qwen2.5-coder:1.5b" }] }), { status: 200 });
    }
    throw new Error("no llama.cpp");
  };
  const status = await probeLocalModel();
  assert.equal(status.available, true);
  assert.equal(status.nativeBridge, "missing");
  assert.equal(status.ollamaServer !== null, true);
});

test("chat route returns actual provider response, not a canned UI text", async () => {
  (globalThis as any).SynthiaAndroid = undefined;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    if (String(input).endsWith("/api/chat")) {
      return new Response(JSON.stringify({ message: { content: "READY" } }), { status: 200 });
    }
    throw new Error("llama.cpp absent");
  };
  const result = await askLocalModel([{ role: "user", content: "test" }], { maxTokens: 16 });
  assert.equal(result.text, "READY");
  assert.match(result.via, /Ollama/);
});
