import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Human Design Energy Types
export const EnergyType = z.enum([
  "manifestor",
  "generator", 
  "manifesting_generator",
  "projector",
  "reflector"
]);
export type EnergyType = z.infer<typeof EnergyType>;

// Human Design Strategy
export const Strategy = z.enum([
  "inform",
  "wait_to_respond",
  "wait_for_invitation",
  "wait_lunar_cycle"
]);
export type Strategy = z.infer<typeof Strategy>;

// Program Week Phase
export const ProgramPhase = z.enum([
  "discovery",
  "assessment", 
  "placement",
  "activation",
  "optimization",
  "sustain"
]);
export type ProgramPhase = z.infer<typeof ProgramPhase>;

// Role assignments based on energy
export const GroupRole = z.enum([
  "initiator",
  "builder", 
  "amplifier",
  "advisor",
  "synthesizer",
  "stabilizer"
]);
export type GroupRole = z.infer<typeof GroupRole>;

// I Ching Hexagram base structure
export const HexagramLineSchema = z.enum(["yin", "yang", "changing_yin", "changing_yang"]);
export type HexagramLine = z.infer<typeof HexagramLineSchema>;

// Birth data for HD calculation
export const BirthDataSchema = z.object({
  year: z.number().min(1900).max(2100),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  timezone: z.string()
});
export type BirthData = z.infer<typeof BirthDataSchema>;

// Human Design Profile
export const HumanDesignProfileSchema = z.object({
  type: EnergyType,
  strategy: Strategy,
  authority: z.string(),
  profile: z.string(),
  definedCenters: z.array(z.string()),
  openCenters: z.array(z.string()),
  gates: z.array(z.number().min(1).max(64)),
  channels: z.array(z.string())
});
export type HumanDesignProfile = z.infer<typeof HumanDesignProfileSchema>;

// I Ching Hexagram
export const HexagramSchema = z.object({
  number: z.number().min(1).max(64),
  name: z.string(),
  chineseName: z.string(),
  meaning: z.string(),
  lines: z.array(HexagramLineSchema).length(6),
  judgment: z.string(),
  image: z.string()
});
export type Hexagram = z.infer<typeof HexagramSchema>;

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  birthData: jsonb("birth_data").$type<BirthData>(),
  hdProfile: jsonb("hd_profile").$type<HumanDesignProfile>(),
  interests: text("interests").array(),
  skills: text("skills").array(),
  resonanceScore: real("resonance_score").default(50),
  createdAt: timestamp("created_at").defaultNow()
});

// Custom schema for user creation from form
export const insertUserSchema = z.object({
  username: z.string().min(3),
  displayName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  birthData: BirthDataSchema.optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Groups table
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  niche: text("niche").notNull(),
  phase: text("phase").notNull().default("discovery"),
  resonanceScore: real("resonance_score").default(50),
  dailyTarget: real("daily_target").default(100),
  totalEarnings: real("total_earnings").default(0),
  memberIds: text("member_ids").array(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true
});
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

// Group Memberships with roles
export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  groupId: varchar("group_id").notNull(),
  role: text("role").notNull(),
  roleFitScore: real("role_fit_score").default(0),
  contributionScore: real("contribution_score").default(0),
  joinedAt: timestamp("joined_at").defaultNow()
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  joinedAt: true
});
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;

// I Ching Castings
export const castings = pgTable("castings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  groupId: varchar("group_id"),
  hexagram: jsonb("hexagram").$type<Hexagram>(),
  question: text("question"),
  interpretation: text("interpretation"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCastingSchema = createInsertSchema(castings).omit({
  id: true,
  createdAt: true
});
export type InsertCasting = z.infer<typeof insertCastingSchema>;
export type Casting = typeof castings.$inferSelect;

// Resonance Matches
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull(),
  user2Id: varchar("user2_id").notNull(),
  resonanceScore: real("resonance_score").notNull(),
  synergyFactors: jsonb("synergy_factors").$type<string[]>(),
  frictionFactors: jsonb("friction_factors").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true
});
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Financial Opportunities
export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").default(0),
  synergyBonus: real("synergy_bonus").default(0),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true
});
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunities.$inferSelect;

// Static data for I Ching
export const HEXAGRAM_DATA: Record<number, { name: string; chineseName: string; meaning: string; judgment: string; image: string }> = {
  1: { name: "The Creative", chineseName: "Qian", meaning: "Pure yang energy, creative force", judgment: "The Creative works sublime success, furthering through perseverance.", image: "Heaven above heaven - the creative force doubled" },
  2: { name: "The Receptive", chineseName: "Kun", meaning: "Pure yin energy, nurturing force", judgment: "The Receptive brings sublime success, perseverance of a mare.", image: "Earth above earth - the receptive nature" },
  3: { name: "Difficulty at the Beginning", chineseName: "Zhun", meaning: "Initial struggles lead to growth", judgment: "Success through perseverance. Appoint helpers.", image: "Water over thunder - chaos before order" },
  11: { name: "Peace", chineseName: "Tai", meaning: "Harmony between heaven and earth", judgment: "The small departs, the great approaches. Success.", image: "Earth over heaven - perfect balance" },
  15: { name: "Modesty", chineseName: "Qian", meaning: "Humility brings success", judgment: "The modest person has good fortune.", image: "Earth over mountain - a hidden treasure" },
  23: { name: "Splitting Apart", chineseName: "Bo", meaning: "Dissolution and decay", judgment: "It does not further to go anywhere.", image: "Mountain over earth - erosion and collapse" },
  40: { name: "Deliverance", chineseName: "Jie", meaning: "Release from tension", judgment: "Swift return brings good fortune.", image: "Thunder over water - liberation" },
  58: { name: "The Joyous", chineseName: "Dui", meaning: "Joy through connection", judgment: "The joyous succeeds through perseverance.", image: "Lake over lake - shared joy multiplies" },
  64: { name: "Before Completion", chineseName: "Wei Ji", meaning: "Transition point, almost there", judgment: "Success in small matters.", image: "Fire over water - opposites in tension" }
};

// Human Design Centers
export const HD_CENTERS = [
  "Head", "Ajna", "Throat", "G-Center", "Heart/Will", 
  "Sacral", "Solar Plexus", "Spleen", "Root"
] as const;

// Energy type descriptions
export const ENERGY_TYPE_INFO: Record<EnergyType, { description: string; strategy: string; strengths: string[] }> = {
  manifestor: {
    description: "Pure initiators who start things and make an impact",
    strategy: "Inform before acting",
    strengths: ["Starting new projects", "Breaking patterns", "Independence"]
  },
  generator: {
    description: "Builders with sustainable life force energy",
    strategy: "Wait to respond",
    strengths: ["Sustained work", "Mastery", "Satisfaction when aligned"]
  },
  manifesting_generator: {
    description: "Multi-passionate builders who initiate and respond",
    strategy: "Wait to respond, then inform",
    strengths: ["Multi-tasking", "Speed", "Finding shortcuts"]
  },
  projector: {
    description: "Guides who see systems and direct energy",
    strategy: "Wait for the invitation",
    strengths: ["Managing others", "System insight", "Efficiency"]
  },
  reflector: {
    description: "Mirrors who sample and reflect group energy",
    strategy: "Wait a lunar cycle",
    strengths: ["Reading environments", "Wisdom", "Objectivity"]
  }
};

// Role descriptions
export const ROLE_INFO: Record<GroupRole, { description: string; bestFor: EnergyType[] }> = {
  initiator: {
    description: "Starts new ventures and creates momentum",
    bestFor: ["manifestor", "manifesting_generator"]
  },
  builder: {
    description: "Does sustained work to bring ideas to life",
    bestFor: ["generator", "manifesting_generator"]
  },
  amplifier: {
    description: "Increases group energy and visibility",
    bestFor: ["generator", "projector"]
  },
  advisor: {
    description: "Provides guidance and strategic direction",
    bestFor: ["projector"]
  },
  synthesizer: {
    description: "Connects ideas and sees the big picture",
    bestFor: ["projector", "reflector"]
  },
  stabilizer: {
    description: "Maintains harmony and consistent output",
    bestFor: ["generator", "reflector"]
  }
};
