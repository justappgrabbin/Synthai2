import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { uploadProjectToGoogleDrive, uploadFileToGoogleDrive } from "./lib/googleDriveService";
import { createOrUpdateGitHubRepo } from "./lib/githubService";
import { importGitHubRepo } from "./lib/githubImportService";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);

  return httpServer;
}
