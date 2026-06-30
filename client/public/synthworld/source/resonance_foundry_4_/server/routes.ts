import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertGroupSchema, insertCastingSchema, insertOpportunitySchema, insertMembershipSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.get("/api/users/current", async (req, res) => {
    try {
      const user = await storage.getCurrentUser();
      if (!user) {
        res.status(404).json({ error: "No current user" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get current user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid user data", details: parsed.error.flatten() });
        return;
      }
      
      const existingUser = await storage.getUserByUsername(parsed.data.username);
      if (existingUser) {
        res.status(400).json({ error: "Username already exists" });
        return;
      }
      
      const user = await storage.createUser(parsed.data);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Groups
  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to get groups" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to get group" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const parsed = insertGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid group data", details: parsed.error.flatten() });
        return;
      }
      
      const group = await storage.createGroup(parsed.data);
      
      // Add creator as member if there's a current user
      const currentUser = await storage.getCurrentUser();
      if (currentUser) {
        await storage.createMembership({
          userId: currentUser.id,
          groupId: group.id,
          role: "initiator"
        });
      }
      
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.patch("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.updateGroup(req.params.id, req.body);
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  app.post("/api/groups/:id/join", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }
      
      // Check if already a member
      const existingMemberships = await storage.getMembershipsByUser(currentUser.id);
      if (existingMemberships.some(m => m.groupId === req.params.id)) {
        res.status(400).json({ error: "Already a member of this group" });
        return;
      }
      
      // Assign role based on HD type
      const hdProfile = currentUser.hdProfile as any;
      let role = "builder";
      if (hdProfile) {
        const roleMap: Record<string, string> = {
          manifestor: "initiator",
          generator: "builder",
          manifesting_generator: "amplifier",
          projector: "advisor",
          reflector: "synthesizer"
        };
        role = roleMap[hdProfile.type] || "builder";
      }
      
      const membership = await storage.createMembership({
        userId: currentUser.id,
        groupId: req.params.id,
        role
      });
      
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to join group" });
    }
  });

  // Memberships
  app.get("/api/memberships/mine", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        res.json([]);
        return;
      }
      
      const memberships = await storage.getMembershipsByUser(currentUser.id);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ error: "Failed to get memberships" });
    }
  });

  app.get("/api/memberships/group/:groupId", async (req, res) => {
    try {
      const memberships = await storage.getMembershipsByGroup(req.params.groupId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ error: "Failed to get memberships" });
    }
  });

  // Castings (I Ching)
  app.get("/api/castings", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (currentUser) {
        const castings = await storage.getCastingsByUser(currentUser.id);
        res.json(castings);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get castings" });
    }
  });

  app.post("/api/castings", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      
      const casting = await storage.createCasting({
        userId: currentUser?.id,
        groupId: req.body.groupId,
        question: req.body.question
      });
      
      res.status(201).json(casting);
    } catch (error) {
      res.status(500).json({ error: "Failed to create casting" });
    }
  });

  // Matches
  app.get("/api/matches", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        res.json([]);
        return;
      }
      
      const matches = await storage.getMatchesByUser(currentUser.id);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: "Failed to get matches" });
    }
  });

  app.post("/api/matches/find", async (req, res) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      
      const matches = await storage.findMatchesForUser(currentUser.id);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: "Failed to find matches" });
    }
  });

  // Opportunities
  app.get("/api/opportunities", async (req, res) => {
    try {
      const opportunities = await storage.getAllOpportunities();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get opportunities" });
    }
  });

  app.get("/api/opportunities/:id", async (req, res) => {
    try {
      const opportunity = await storage.getOpportunity(req.params.id);
      if (!opportunity) {
        res.status(404).json({ error: "Opportunity not found" });
        return;
      }
      res.json(opportunity);
    } catch (error) {
      res.status(500).json({ error: "Failed to get opportunity" });
    }
  });

  app.post("/api/opportunities", async (req, res) => {
    try {
      const parsed = insertOpportunitySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid opportunity data", details: parsed.error.flatten() });
        return;
      }
      
      const opportunity = await storage.createOpportunity(parsed.data);
      res.status(201).json(opportunity);
    } catch (error) {
      res.status(500).json({ error: "Failed to create opportunity" });
    }
  });

  app.patch("/api/opportunities/:id", async (req, res) => {
    try {
      const opportunity = await storage.updateOpportunity(req.params.id, req.body);
      if (!opportunity) {
        res.status(404).json({ error: "Opportunity not found" });
        return;
      }
      res.json(opportunity);
    } catch (error) {
      res.status(500).json({ error: "Failed to update opportunity" });
    }
  });

  return httpServer;
}
