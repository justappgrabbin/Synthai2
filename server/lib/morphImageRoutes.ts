import type { Express, Request, Response } from "express";

/**
 * Real Gemini image generation/editing for the Morph visual stage.
 * API credentials are server-only. No simulated images or hardcoded "connected" status.
 * Provider calls are deliberately rate-limited: generating images is billable.
 */
const IMAGE_MODELS = new Set(["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"]);
const RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);
const SIZES = new Set(["512", "1K", "2K", "4K"]);
const requests = new Map<string, { count: number; reset: number }>();

const apiKey = () => process.env.GEMINI_API_KEY || "";
function imageEnabled(): boolean {
  return Boolean(apiKey()) && process.env.MORPH_IMAGE_ENABLED === "true";
}
function sameOrigin(req: Request): boolean {
  const fetchSite = req.header("sec-fetch-site");
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) return false;
  const origin = req.header("origin");
  if (origin) {
    try {
      return new URL(origin).host === req.header("host");
    } catch { return false; }
  }
  return true;
}
function limitRequest(req: Request, res: Response): boolean {
  if (!sameOrigin(req)) {
    res.status(403).json({ error: "Morph generation is available only from this app's origin." });
    return false;
  }
  if (!imageEnabled()) {
    res.status(503).json({ error: "Image generation is not configured. You can still upload an image and make it interactive." });
    return false;
  }
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const slot = requests.get(ip);
  const next = !slot || slot.reset < now ? { count: 1, reset: now + 3_600_000 } : { ...slot, count: slot.count + 1 };
  requests.set(ip, next);
  if (requests.size > 2048) {
    for (const [key, value] of requests) if (value.reset < now) requests.delete(key);
  }
  if (next.count > 12) {
    res.status(429).json({ error: "Image rate limit reached. Please try again later." });
    return false;
  }
  return true;
}
function validPrompt(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 2000;
}
function modelFor(value: unknown): string {
  return typeof value === "string" && IMAGE_MODELS.has(value) ? value : "gemini-3.1-flash-lite-image";
}
function decodeImage(value: unknown): { mimeType: string; data: string } | null {
  if (typeof value !== "string" || value.length > 8_000_000) return null;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length < 100) return null;
  return { mimeType: match[1], data: match[2] };
}
async function gemini(model: string, parts: object[], generationConfig: object) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
        signal: controller.signal,
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig }),
      },
    );
    const payload = await response.json() as any;
    if (!response.ok) {
      const detail = typeof payload?.error?.message === "string" ? payload.error.message.slice(0, 200) : "Provider request failed";
      throw new Error(`Gemini ${response.status}: ${detail}`);
    }
    return payload;
  } finally { clearTimeout(timeout); }
}
function unpackImage(payload: any): { imageUrl: string; text: string } {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) throw new Error("Provider returned no image.");
  const image = parts.find((part: any) => part?.inlineData?.data && /^image\//.test(part.inlineData.mimeType || ""));
  if (!image) throw new Error("The provider returned text but no image.");
  return {
    imageUrl: `data:${image.inlineData.mimeType};base64,${image.inlineData.data}`,
    text: parts.map((part: any) => part.text || "").filter(Boolean).join("\n").slice(0, 2000),
  };
}
function imageConfig(model: string, ratio: unknown, size: unknown) {
  const selectedRatio = typeof ratio === "string" && RATIOS.has(ratio) ? ratio : "1:1";
  const selectedSize = typeof size === "string" && SIZES.has(size) ? size : "1K";
  return {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio: selectedRatio,
      ...(model === "gemini-3.1-flash-image" ? { imageSize: selectedSize === "512" ? "1K" : selectedSize } : {}),
    },
  };
}
function replyError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Image operation failed";
  res.status(message.includes("abort") ? 504 : 502).json({ error: message });
}

export function registerMorphImageRoutes(app: Express): void {
  app.get("/api/morph/image-status", (_req, res) => {
    res.json({
      configured: imageEnabled(),
      models: [...IMAGE_MODELS],
      message: imageEnabled() ? "Image provider configured" : "Upload remains available offline. A server key and MORPH_IMAGE_ENABLED=true are required for generation.",
    });
  });

  app.post("/api/morph/generate-image", async (req, res) => {
    if (!limitRequest(req, res)) return;
    if (!validPrompt(req.body?.prompt)) return void res.status(400).json({ error: "Enter an image description (up to 2000 characters)." });
    const model = modelFor(req.body.model);
    try {
      const payload = await gemini(model, [{ text: req.body.prompt.trim() }], imageConfig(model, req.body.aspectRatio, req.body.imageSize));
      res.json(unpackImage(payload));
    } catch (error) { replyError(res, error); }
  });

  app.post("/api/morph/edit-image", async (req, res) => {
    if (!limitRequest(req, res)) return;
    if (!validPrompt(req.body?.prompt)) return void res.status(400).json({ error: "Describe the image edit." });
    const base = decodeImage(req.body?.image);
    if (!base) return void res.status(400).json({ error: "Supply a PNG, JPEG or WebP image up to 6 MB." });
    const model = modelFor(req.body.model);
    try {
      const payload = await gemini(model, [{ text: req.body.prompt.trim() }, { inlineData: base }], imageConfig(model, req.body.aspectRatio, req.body.imageSize));
      res.json(unpackImage(payload));
    } catch (error) { replyError(res, error); }
  });

  app.post("/api/morph/enhance-prompt", async (req, res) => {
    if (!limitRequest(req, res)) return;
    if (!validPrompt(req.body?.prompt)) return void res.status(400).json({ error: "Enter a prompt first." });
    const style = typeof req.body.style === "string" ? req.body.style.slice(0, 45) : "cinematic";
    try {
      const payload = await gemini("gemini-3.8-flash",
        [{ text: `Rewrite the following image prompt as one vivid, faithful visual description. Style: ${style}. Preserve all subjects and instructions. Do not add disclaimers. Prompt: ${req.body.prompt}` }],
        { responseModalities: ["TEXT"] });
      const enhancedPrompt = payload?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join(" ").trim();
      if (!enhancedPrompt) throw new Error("No improved prompt returned.");
      res.json({ enhancedPrompt: enhancedPrompt.slice(0, 2000) });
    } catch (error) { replyError(res, error); }
  });
}
