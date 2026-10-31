import express, { type Express } from "express";
import { mountAppArchiveBuffer } from "../lib/appMountService";
import { getMountedRuntimeStatus, startMountedRuntime, stopMountedRuntime } from "../lib/mountedRuntimeService";
import { publishMeshEvent } from "../lib/meshEventStore";

const archiveParser = express.raw({
  type: ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
  limit: process.env.RESONANCE_ARCHIVE_LIMIT || "350mb",
});

export function registerResonanceNetworkRoutes(app: Express) {
  app.post("/api/resonance/install", archiveParser, async (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.byteLength === 0) {
        return res.status(400).json({ success: false, error: "Send the intact Resonance ZIP as the request body" });
      }

      const name = String(req.headers["x-app-name"] || "Resonance Network").slice(0, 120);
      const mounted = await mountAppArchiveBuffer({
        name,
        archive: req.body,
        icon: "Network",
      });

      const event = publishMeshEvent({
        source: "resonance-installer",
        type: "resonance.organism.mounted",
        topic: mounted.id,
        payload: {
          appId: mounted.id,
          name: mounted.name,
          profile: mounted.profile,
          archiveBytes: req.body.byteLength,
        },
      });

      return res.json({ success: true, app: mounted, event });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to mount Resonance Network",
      });
    }
  });

  app.get("/api/resonance/runtime/:id", async (req, res) => {
    try {
      res.json({ success: true, runtime: await getMountedRuntimeStatus(req.params.id) });
    } catch (error) {
      res.status(404).json({ success: false, error: error instanceof Error ? error.message : "Runtime not found" });
    }
  });

  app.post("/api/resonance/runtime/:id/start", async (req, res) => {
    try {
      const runtime = await startMountedRuntime(req.params.id);
      publishMeshEvent({
        source: "resonance-runtime",
        type: "resonance.organism.started",
        topic: req.params.id,
        payload: { kind: runtime.kind, pid: runtime.pid },
      });
      res.json({ success: true, runtime });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to start Resonance Network" });
    }
  });

  app.post("/api/resonance/runtime/:id/stop", async (req, res) => {
    try {
      const runtime = await stopMountedRuntime(req.params.id);
      publishMeshEvent({
        source: "resonance-runtime",
        type: "resonance.organism.stopped",
        topic: req.params.id,
        payload: { kind: runtime.kind },
      });
      res.json({ success: true, runtime });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to stop Resonance Network" });
    }
  });
}
