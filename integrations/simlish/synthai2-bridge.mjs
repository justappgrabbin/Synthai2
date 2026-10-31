/**
 * Device-local bridge attached to the ORIGINAL Simlish player page.
 * Only non-personal execution receipts cross the frame boundary.
 * Portrait bytes, birth data and IndexedDB projects never leave this frame.
 */
import { createSimlishMorphProvider } from "./morph-provider.mjs";
const parentWindow = globalThis.parent;
const sameOrigin = globalThis.location.origin;
const emit = (kind, payload) => {
  if (parentWindow === globalThis) return;
  parentWindow.postMessage({ source:"simlish-world-bridge-v1", kind, payload }, sameOrigin);
};

globalThis.addEventListener("synthai2:simlish-world-operation", event => {
  const d = event.detail;
  if (!d || d.changed !== true) return;
  emit("world.operation", {
    mode: d.mode, operation:d.operation, targetId:d.targetId,
    changed:true, formationRevision:d.formationRevision,
    completed:d.completed, saved:d.saved === true,
    activeObjects:d.activeObjects, composites:d.composites,
    interactionCount:d.interactionCount,
  });
});

globalThis.addEventListener("message", async event => {
  if (event.origin !== sameOrigin || event.source !== parentWindow) return;
  if (event.data?.source !== "synthai2-computer-v1") return;
  if (event.data.kind === "world.skin.apply") {
    // Only display/theme instructions cross the boundary. No foreign scripts,
    // game-state changes, saved photos, or personal chart content are accepted.
    const payload = event.data.payload;
    const validColor = value => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
    const validText = value => typeof value === "string" && value.length > 0 && value.length <= 700;
    if (!payload || !validColor(payload.accent) || !validColor(payload.shadow) ||
        !validText(payload.title) || !validText(payload.situation) || !validText(payload.challenge)) return;
    const existing = document.getElementById("synthai2-iching-skin");
    if (existing) existing.remove();
    const style = document.createElement("style");
    style.id = "synthai2-iching-skin";
    style.textContent = "body{background:" + payload.shadow + "}" +
      ".scene{background:" + payload.shadow + "ec;border-color:" + payload.accent + "aa}" +
      ".world-proof{border-color:" + payload.accent + "aa}" +
      ".scene .primary,.scene .active{background:" + payload.accent + "88;border-color:" + payload.accent + "}";
    document.head.appendChild(style);
    // Use the ORIGINAL action path. Choose Mission and chair; never simulate
    // the completion event or modify the world engine's saved state.
    document.querySelector('[data-mode="Mission"]')?.click();
    const target = document.getElementById("worldTarget");
    if (target && [...target.options].some(option => option.value === "chair")) {
      target.value = "chair";
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const sceneTitle = document.getElementById("scene-title");
    const sceneCopy = document.getElementById("scene-copy");
    if (sceneTitle) sceneTitle.textContent = payload.title;
    if (sceneCopy) sceneCopy.textContent = payload.situation + " " + payload.challenge;
    emit("world.skin.applied", {status:"ready"});
    return;
  }
  if (event.data.kind !== "character.reuse.request") return;
  // Reuse requires an explicit click in the SynthAi2 host, never silent access.
  try {
    const result = await createSimlishMorphProvider().prepare({
      intent:"portrait", reuseSavedPortrait:true,
    });
    if (result.status === "ready" && result.output?.dataUrl) {
      const image = document.querySelector(".guide");
      if (!image) throw new Error("Simlish original character display is unavailable");
      image.src = result.output.dataUrl;
      image.alt = "Your saved local Simlish character";
      image.classList.add("personalized");
    }
    emit("character.status", {
      status: result.status,
      reason: typeof result.reason === "string" ? result.reason : null,
    });
  } catch (error) {
    emit("character.status", {status:"unavailable",reason:error instanceof Error?error.message:"Character renderer failed"});
  }
});
emit("world.ready", {runtime:"original-simlish",playerMode:"live-formation-world"});
