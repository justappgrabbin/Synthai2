import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { uploadProjectToGoogleDrive, uploadFileToGoogleDrive } from "./lib/googleDriveService";
import { createOrUpdateGitHubRepo } from "./lib/githubService";
import { importGitHubRepo } from "./lib/githubImportService";
import { deployToNetlify } from "./lib/netlifyService";
import { orchestrateWorldGeneration, checkTokenAvailability, consumeToken } from "./services/world-orchestrator";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== StoryForge World Generation API ==========
  
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "YOU-N-I-VERSE Studio API" });
  });

  // Token status - check available tokens for current month
  app.get("/api/tokens/status", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      
      const tokenStatus = await checkTokenAvailability(userId);
      res.json(tokenStatus);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to check token status" 
      });
    }
  });

  // Create new ideon (generate world from text)
  app.post("/api/ideons", async (req, res) => {
    try {
      const createSchema = z.object({
        userId: z.string(),
        rawText: z.string().min(1),
      });
      
      const { userId, rawText } = createSchema.parse(req.body);
      
      // Check token availability
      const { available } = await checkTokenAvailability(userId);
      if (!available) {
        return res.status(403).json({ 
          error: "No tokens available for this month. You receive 5 tokens per month." 
        });
      }
      
      // Consume a token
      const consumed = await consumeToken(userId);
      if (!consumed) {
        return res.status(403).json({ 
          error: "Failed to consume token. Please try again." 
        });
      }
      
      // Orchestrate world generation
      const result = await orchestrateWorldGeneration(userId, rawText);
      
      res.json({
        success: true,
        ideonSeed: result.ideonSeed,
        worldManifestation: result.worldManifestation,
        processingTime: result.processingTime,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate world" 
      });
    }
  });

  // Get all ideons for a user
  app.get("/api/ideons", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      
      const ideons = await storage.getIdeonSeedsByUser(userId);
      res.json(ideons);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch ideons" 
      });
    }
  });

  // Get specific ideon by ID
  app.get("/api/ideons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ideon = await storage.getIdeonSeed(id);
      
      if (!ideon) {
        return res.status(404).json({ error: "Ideon not found" });
      }
      
      res.json(ideon);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch ideon" 
      });
    }
  });

  // Get world manifestation by ideon ID
  app.get("/api/worlds/:ideonId", async (req, res) => {
    try {
      const { ideonId } = req.params;
      const world = await storage.getWorldManifestationByIdeonId(ideonId);
      
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      
      res.json(world);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch world" 
      });
    }
  });

  // ========== Deployment & Export API ==========
  
  // Google Drive export endpoint
  app.post("/api/export/google-drive", async (req, res) => {
    try {
      const { projectName, files } = req.body;

      if (!projectName || !files || !Array.isArray(files)) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const result = await uploadProjectToGoogleDrive(projectName, files);

      res.json({
        success: true,
        folderUrl: result.folder.webViewLink,
        folderName: result.folder.name,
        fileCount: result.files.length,
      });
    } catch (error: any) {
      console.error("Google Drive export error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to export to Google Drive",
        notConnected: error.message?.includes('not connected')
      });
    }
  });

  // GitHub push endpoint
  app.post("/api/push/github", async (req, res) => {
    try {
      const { repoName, files, description } = req.body;

      if (!repoName || !files || !Array.isArray(files)) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const result = await createOrUpdateGitHubRepo(repoName, files, description);

      res.json({
        success: true,
        url: result.url,
        username: result.username,
        repoName: result.repoName,
      });
    } catch (error: any) {
      console.error("GitHub push error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to push to GitHub",
        notConnected: error.message?.includes('not connected')
      });
    }
  });

  // GitHub import endpoint
  app.post("/api/import/github", async (req, res) => {
    try {
      const { repoUrl } = req.body;

      if (!repoUrl) {
        return res.status(400).json({ error: "Repository URL is required" });
      }

      const result = await importGitHubRepo(repoUrl);

      res.json({
        success: true,
        repoName: result.repoName,
        owner: result.owner,
        zipData: result.zipData.toString('base64'),
      });
    } catch (error: any) {
      console.error("GitHub import error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to import from GitHub"
      });
    }
  });

  // Netlify deployment endpoint
  app.post("/api/deploy/netlify", async (req, res) => {
    try {
      const { apiKey, files, siteName } = req.body;

      if (!apiKey || !files || !Array.isArray(files)) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const result = await deployToNetlify(apiKey, files, siteName);

      res.json({
        success: true,
        url: result.url,
        deployId: result.deployId,
        siteId: result.siteId,
      });
    } catch (error: any) {
      console.error("Netlify deployment error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to deploy to Netlify"
      });
    }
  });

  // ========== ZIP Archive Management API ==========
  
  // Get all ZIPs
  app.get("/api/zips", async (_req, res) => {
    try {
      const zips = await storage.getAllZips();
      res.json(zips);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ZIP archives" });
    }
  });

  // Get single ZIP
  app.get("/api/zips/:id", async (req, res) => {
    try {
      const zip = await storage.getZip(req.params.id);
      if (!zip) {
        return res.status(404).json({ error: "ZIP not found" });
      }
      res.json(zip);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ZIP" });
    }
  });

  // Create ZIP record (simplified - without actual object storage)
  app.post("/api/zips", async (req, res) => {
    try {
      const { filename, objectPath, size } = req.body;
      
      const zip = await storage.createZip({
        filename,
        originalName: filename,
        uploadDate: new Date().toISOString(),
        size,
        objectPath,
        structure: {
          entries: [],
          totalSize: size,
          fileCount: 0,
          directoryCount: 0,
        },
        analysis: {
          description: "Archive uploaded",
          projectType: "unknown",
          technologies: [],
          confidence: 0.5,
        },
      });

      res.json({ id: zip.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to create ZIP record" });
    }
  });

  // Delete ZIP
  app.delete("/api/zips/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteZip(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "ZIP not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ZIP" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
