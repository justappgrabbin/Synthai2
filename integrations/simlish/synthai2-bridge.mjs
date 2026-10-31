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
