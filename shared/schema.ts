import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Token ledger - tracks monthly token allowances
export const tokenLedger = pgTable("token_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // Format: "YYYY-MM"
  tokensRemaining: integer("tokens_remaining").notNull().default(5),
  tokensUsed: integer("tokens_used").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTokenLedgerSchema = createInsertSchema(tokenLedger).omit({
  id: true,
  createdAt: true,
});

export type InsertTokenLedger = z.infer<typeof insertTokenLedgerSchema>;
export type TokenLedger = typeof tokenLedger.$inferSelect;

// Ideon Seeds - player input and parsed semantic structure
export const ideonSeeds = pgTable("ideon_seeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  rawText: text("raw_text").notNull(),
  
  // Semantic layers (5 conscious layers)
  movement: jsonb("movement"), // Individuality - "I Define" - Activity, Uniqueness
  evolution: jsonb("evolution"), // Mind - "I Remember" - Character, Role
  being: jsonb("being"), // Body - "I Am" - Biology, Genetics
  design: jsonb("design"), // Ego - "I Design" - Growth, Self
  space: jsonb("space"), // Personality - "I Think" - Type, Presence
  
  // Meta layers (latent)
  transpersonal: jsonb("transpersonal"), // Archetypal patterns
  void: jsonb("void"), // Pure potential, noise vectors
  
  // Symbolic parsing
  symbolicStructure: jsonb("symbolic_structure"), // Parsed punctuation operators
  
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertIdeonSeedSchema = createInsertSchema(ideonSeeds).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertIdeonSeed = z.infer<typeof insertIdeonSeedSchema>;
export type IdeonSeed = typeof ideonSeeds.$inferSelect;

// World Manifestations - generated outputs from GANs
export const worldManifestations = pgTable("world_manifestations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ideonSeedId: varchar("ideon_seed_id").notNull().references(() => ideonSeeds.id),
  
  // Generated narrative/description
  narrative: text("narrative"),
  
  // World attributes derived from semantic layers
  worldAttributes: jsonb("world_attributes"), // Physical rules, tone, mood, etc.
  
  // GAN outputs
  semanticGanResult: jsonb("semantic_gan_result"), // Image URLs, style vectors
  videoGanResult: jsonb("video_gan_result"), // Animation URLs, temporal data
  
  // Discriminator feedback (the "felt sense")
  coherenceScore: integer("coherence_score"), // 0-100
  resonanceScore: integer("resonance_score"), // 0-100
  beautyScore: integer("beauty_score"), // 0-100
  
  // Reflection data
  reflectionNotes: text("reflection_notes"), // What the observer understood
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorldManifestationSchema = createInsertSchema(worldManifestations).omit({
  id: true,
  createdAt: true,
});

export type InsertWorldManifestation = z.infer<typeof insertWorldManifestationSchema>;
export type WorldManifestation = typeof worldManifestations.$inferSelect;
