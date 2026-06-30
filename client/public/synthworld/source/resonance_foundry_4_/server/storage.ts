import { 
  type User, 
  type InsertUser, 
  type Group,
  type InsertGroup,
  type Membership,
  type InsertMembership,
  type Casting,
  type InsertCasting,
  type Match,
  type InsertMatch,
  type Opportunity,
  type InsertOpportunity,
  type HumanDesignProfile,
  type EnergyType,
  type Hexagram,
  HEXAGRAM_DATA
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getCurrentUser(): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Groups
  getGroup(id: string): Promise<Group | undefined>;
  getAllGroups(): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<Group>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<boolean>;

  // Memberships
  getMembership(id: string): Promise<Membership | undefined>;
  getMembershipsByUser(userId: string): Promise<Membership[]>;
  getMembershipsByGroup(groupId: string): Promise<Membership[]>;
  createMembership(membership: InsertMembership): Promise<Membership>;

  // Castings
  getCasting(id: string): Promise<Casting | undefined>;
  getCastingsByUser(userId: string): Promise<Casting[]>;
  getAllCastings(): Promise<Casting[]>;
  createCasting(casting: InsertCasting): Promise<Casting>;

  // Matches
  getMatch(id: string): Promise<Match | undefined>;
  getMatchesByUser(userId: string): Promise<Match[]>;
  getAllMatches(): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  findMatchesForUser(userId: string): Promise<Match[]>;

  // Opportunities
  getOpportunity(id: string): Promise<Opportunity | undefined>;
  getAllOpportunities(): Promise<Opportunity[]>;
  getOpportunitiesByGroup(groupId: string): Promise<Opportunity[]>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity | undefined>;

  // Stats
  getStats(): Promise<{ totalUsers: number; activeGroups: number; totalEarnings: number; avgResonance: number }>;
}

// Human Design calculation helpers
function calculateHumanDesignProfile(birthData: any): HumanDesignProfile {
  // Simplified HD calculation based on birth data
  const seed = birthData.year * 1000 + birthData.month * 100 + birthData.day;
  
  const types: EnergyType[] = ["manifestor", "generator", "manifesting_generator", "projector", "reflector"];
  const type = types[seed % types.length];
  
  const strategies = {
    manifestor: "inform",
    generator: "wait_to_respond",
    manifesting_generator: "wait_to_respond",
    projector: "wait_for_invitation",
    reflector: "wait_lunar_cycle"
  } as const;
  
  const authorities = ["emotional", "sacral", "splenic", "ego", "self-projected", "mental", "lunar"];
  const profiles = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"];
  
  const allCenters = ["Head", "Ajna", "Throat", "G-Center", "Heart/Will", "Sacral", "Solar Plexus", "Spleen", "Root"];
  const definedCount = 3 + (seed % 5);
  const definedCenters = allCenters.slice(0, definedCount);
  const openCenters = allCenters.slice(definedCount);
  
  // Generate gates based on birth data
  const gateCount = 6 + (seed % 8);
  const gates: number[] = [];
  for (let i = 0; i < gateCount; i++) {
    gates.push(1 + ((seed + i * 7) % 64));
  }
  
  // Generate channels (pairs of connected gates)
  const channels: string[] = [];
  for (let i = 0; i < Math.min(gates.length - 1, 3); i++) {
    channels.push(`${gates[i]}-${gates[i + 1]}`);
  }

  return {
    type,
    strategy: strategies[type],
    authority: authorities[seed % authorities.length],
    profile: profiles[seed % profiles.length],
    definedCenters,
    openCenters,
    gates,
    channels
  };
}

// I Ching hexagram generation
function generateHexagram(): Hexagram {
  const hexNumbers = [1, 2, 3, 11, 15, 23, 40, 58, 64];
  const number = hexNumbers[Math.floor(Math.random() * hexNumbers.length)];
  const data = HEXAGRAM_DATA[number] || HEXAGRAM_DATA[1];
  
  const lineTypes = ["yin", "yang", "changing_yin", "changing_yang"] as const;
  const lines = Array.from({ length: 6 }, () => 
    lineTypes[Math.floor(Math.random() * 4)]
  );

  return {
    number,
    name: data.name,
    chineseName: data.chineseName,
    meaning: data.meaning,
    judgment: data.judgment,
    image: data.image,
    lines
  };
}

// Calculate resonance between two users
function calculateResonance(user1: User, user2: User): { score: number; synergy: string[]; friction: string[] } {
  const hd1 = user1.hdProfile as HumanDesignProfile | null;
  const hd2 = user2.hdProfile as HumanDesignProfile | null;
  
  if (!hd1 || !hd2) {
    return { score: 50, synergy: [], friction: [] };
  }

  let score = 50;
  const synergy: string[] = [];
  const friction: string[] = [];

  // Type compatibility
  const typeCompatibility: Record<string, Record<string, number>> = {
    manifestor: { projector: 20, generator: 10, reflector: 15, manifesting_generator: 5, manifestor: -5 },
    generator: { projector: 15, manifestor: 10, manifesting_generator: 10, reflector: 10, generator: 5 },
    manifesting_generator: { projector: 15, generator: 10, manifestor: 5, reflector: 10, manifesting_generator: 5 },
    projector: { generator: 20, manifesting_generator: 15, manifestor: 10, reflector: 10, projector: 5 },
    reflector: { generator: 15, manifesting_generator: 10, projector: 10, manifestor: 10, reflector: 20 }
  };

  const typeBonus = typeCompatibility[hd1.type]?.[hd2.type] || 0;
  score += typeBonus;
  
  if (typeBonus > 10) {
    synergy.push(`${hd1.type}-${hd2.type} synergy`);
  } else if (typeBonus < 0) {
    friction.push(`Similar energy types`);
  }

  // Shared gates
  const sharedGates = hd1.gates.filter(g => hd2.gates.includes(g));
  if (sharedGates.length > 0) {
    score += sharedGates.length * 3;
    synergy.push(`${sharedGates.length} shared gates`);
  }

  // Complementary centers
  const complementaryCenters = hd1.definedCenters.filter(c => hd2.openCenters.includes(c));
  if (complementaryCenters.length > 0) {
    score += complementaryCenters.length * 4;
    synergy.push(`Complementary centers`);
  }

  // Shared interests
  if (user1.interests && user2.interests) {
    const sharedInterests = user1.interests.filter(i => user2.interests?.includes(i));
    if (sharedInterests.length > 0) {
      score += sharedInterests.length * 5;
      synergy.push(`Shared interests`);
    }
  }

  // Potential friction
  if (hd1.authority === hd2.authority && hd1.authority !== "emotional") {
    friction.push(`Same authority style`);
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  return { score, synergy, friction };
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private groups: Map<string, Group>;
  private memberships: Map<string, Membership>;
  private castings: Map<string, Casting>;
  private matches: Map<string, Match>;
  private opportunities: Map<string, Opportunity>;
  public currentUserId: string | null = null;

  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.memberships = new Map();
    this.castings = new Map();
    this.matches = new Map();
    this.opportunities = new Map();
    
    this.seedData();
  }
  
  setCurrentUserId(userId: string | null) {
    this.currentUserId = userId;
  }

  private seedData() {
    // Create sample users with HD profiles
    const sampleUsers = [
      { username: "alex_energy", displayName: "Alex Martinez", interests: ["content creation", "marketing"], skills: ["video editing", "copywriting"] },
      { username: "jordan_flow", displayName: "Jordan Chen", interests: ["tech services", "consulting"], skills: ["web development", "strategy"] },
      { username: "sam_sync", displayName: "Sam Williams", interests: ["hospitality", "events"], skills: ["event planning", "networking"] },
      { username: "taylor_wave", displayName: "Taylor Brooks", interests: ["crafts", "e-commerce"], skills: ["design", "sales"] },
    ];

    sampleUsers.forEach((userData, idx) => {
      const id = randomUUID();
      const birthData = {
        year: 1985 + idx * 3,
        month: 1 + (idx * 2) % 12,
        day: 1 + (idx * 5) % 28,
        hour: 8 + idx * 3,
        minute: 30,
        timezone: "UTC"
      };
      
      const user: User = {
        id,
        ...userData,
        email: `${userData.username}@example.com`,
        birthData,
        hdProfile: calculateHumanDesignProfile(birthData),
        resonanceScore: 45 + Math.floor(Math.random() * 40),
        createdAt: new Date()
      };
      
      this.users.set(id, user);
    });

    // Create sample groups
    const sampleGroups = [
      { name: "Content Creators Collective", niche: "Digital Content", description: "A group focused on creating and monetizing digital content together." },
      { name: "Tech Services Hub", niche: "Consulting", description: "Pooling tech expertise for B2B consulting opportunities." },
    ];

    const userIds = Array.from(this.users.keys());

    sampleGroups.forEach((groupData, idx) => {
      const id = randomUUID();
      const memberIds = userIds.slice(idx * 2, idx * 2 + 2);
      
      const group: Group = {
        id,
        ...groupData,
        phase: "discovery",
        resonanceScore: 55 + Math.floor(Math.random() * 30),
        dailyTarget: 100,
        totalEarnings: Math.floor(Math.random() * 500),
        memberIds,
        createdAt: new Date()
      };
      
      this.groups.set(id, group);

      // Create memberships
      const roles = ["initiator", "builder", "amplifier", "advisor", "synthesizer", "stabilizer"];
      memberIds.forEach((userId, roleIdx) => {
        const membershipId = randomUUID();
        const membership: Membership = {
          id: membershipId,
          userId,
          groupId: id,
          role: roles[roleIdx % roles.length],
          roleFitScore: 0.6 + Math.random() * 0.35,
          contributionScore: Math.floor(Math.random() * 100),
          joinedAt: new Date()
        };
        this.memberships.set(membershipId, membership);
      });
    });

    // Create sample opportunities
    const groupIds = Array.from(this.groups.keys());
    if (groupIds.length > 0) {
      const opportunity: Opportunity = {
        id: randomUUID(),
        groupId: groupIds[0],
        title: "First $100 Day",
        description: "Achieve our first $100 revenue day as a group",
        targetAmount: 100,
        currentAmount: 45,
        synergyBonus: 5,
        status: "active",
        createdAt: new Date()
      };
      this.opportunities.set(opportunity.id, opportunity);
    }
    
    // Set first user as current user for demo purposes
    const firstUserId = Array.from(this.users.keys())[0];
    if (firstUserId) {
      this.currentUserId = firstUserId;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getCurrentUser(): Promise<User | undefined> {
    if (this.currentUserId) {
      return this.users.get(this.currentUserId);
    }
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const birthData = insertUser.birthData;
    
    const user: User = {
      id,
      username: insertUser.username,
      displayName: insertUser.displayName,
      email: insertUser.email || null,
      birthData: birthData || null,
      hdProfile: birthData ? calculateHumanDesignProfile(birthData) : null,
      interests: insertUser.interests || null,
      skills: insertUser.skills || null,
      resonanceScore: 50,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    this.currentUserId = id;
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Group methods
  async getGroup(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = randomUUID();
    const group: Group = {
      id,
      name: insertGroup.name,
      description: insertGroup.description || null,
      niche: insertGroup.niche,
      phase: insertGroup.phase || "discovery",
      resonanceScore: 50,
      dailyTarget: insertGroup.dailyTarget || 100,
      totalEarnings: 0,
      memberIds: insertGroup.memberIds || [],
      createdAt: new Date()
    };
    
    this.groups.set(id, group);
    return group;
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group | undefined> {
    const group = this.groups.get(id);
    if (!group) return undefined;
    
    const updated = { ...group, ...updates };
    this.groups.set(id, updated);
    return updated;
  }

  async deleteGroup(id: string): Promise<boolean> {
    return this.groups.delete(id);
  }

  // Membership methods
  async getMembership(id: string): Promise<Membership | undefined> {
    return this.memberships.get(id);
  }

  async getMembershipsByUser(userId: string): Promise<Membership[]> {
    return Array.from(this.memberships.values()).filter(m => m.userId === userId);
  }

  async getMembershipsByGroup(groupId: string): Promise<Membership[]> {
    return Array.from(this.memberships.values()).filter(m => m.groupId === groupId);
  }

  async createMembership(insertMembership: InsertMembership): Promise<Membership> {
    const id = randomUUID();
    const membership: Membership = {
      id,
      ...insertMembership,
      roleFitScore: insertMembership.roleFitScore || 0,
      contributionScore: insertMembership.contributionScore || 0,
      joinedAt: new Date()
    };
    
    this.memberships.set(id, membership);
    
    // Update group's memberIds
    const group = await this.getGroup(insertMembership.groupId);
    if (group) {
      const memberIds = group.memberIds || [];
      if (!memberIds.includes(insertMembership.userId)) {
        await this.updateGroup(insertMembership.groupId, {
          memberIds: [...memberIds, insertMembership.userId]
        });
      }
    }
    
    return membership;
  }

  // Casting methods
  async getCasting(id: string): Promise<Casting | undefined> {
    return this.castings.get(id);
  }

  async getCastingsByUser(userId: string): Promise<Casting[]> {
    return Array.from(this.castings.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAllCastings(): Promise<Casting[]> {
    return Array.from(this.castings.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createCasting(insertCasting: InsertCasting): Promise<Casting> {
    const id = randomUUID();
    const hexagram = generateHexagram();
    
    // Generate interpretation based on question and hexagram
    const interpretations = [
      `The energy of ${hexagram.name} suggests a time of ${hexagram.meaning.toLowerCase()}. ${hexagram.judgment}`,
      `This hexagram speaks to your current situation. ${hexagram.image}. Trust the process and allow things to unfold naturally.`,
      `${hexagram.name} (${hexagram.chineseName}) appears when we need to understand ${hexagram.meaning.toLowerCase()}. The path forward requires patience and alignment with natural rhythms.`
    ];
    
    const casting: Casting = {
      id,
      userId: insertCasting.userId || null,
      groupId: insertCasting.groupId || null,
      hexagram,
      question: insertCasting.question || null,
      interpretation: interpretations[Math.floor(Math.random() * interpretations.length)],
      createdAt: new Date()
    };
    
    this.castings.set(id, casting);
    return casting;
  }

  // Match methods
  async getMatch(id: string): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatchesByUser(userId: string): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(m => m.user1Id === userId || m.user2Id === userId)
      .sort((a, b) => b.resonanceScore - a.resonanceScore);
  }

  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values())
      .sort((a, b) => b.resonanceScore - a.resonanceScore);
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = randomUUID();
    const match: Match = {
      id,
      ...insertMatch,
      synergyFactors: insertMatch.synergyFactors || null,
      frictionFactors: insertMatch.frictionFactors || null,
      createdAt: new Date()
    };
    
    this.matches.set(id, match);
    return match;
  }

  async findMatchesForUser(userId: string): Promise<Match[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const allUsers = await this.getAllUsers();
    const newMatches: Match[] = [];

    for (const otherUser of allUsers) {
      if (otherUser.id === userId) continue;

      // Check if match already exists
      const existingMatch = Array.from(this.matches.values()).find(m =>
        (m.user1Id === userId && m.user2Id === otherUser.id) ||
        (m.user1Id === otherUser.id && m.user2Id === userId)
      );

      if (!existingMatch) {
        const { score, synergy, friction } = calculateResonance(user, otherUser);
        
        const match = await this.createMatch({
          user1Id: userId,
          user2Id: otherUser.id,
          resonanceScore: score,
          synergyFactors: synergy,
          frictionFactors: friction
        });
        
        newMatches.push(match);
      }
    }

    return this.getMatchesByUser(userId);
  }

  // Opportunity methods
  async getOpportunity(id: string): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getOpportunitiesByGroup(groupId: string): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values())
      .filter(o => o.groupId === groupId);
  }

  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const id = randomUUID();
    
    // Calculate synergy bonus based on group resonance
    const group = await this.getGroup(insertOpportunity.groupId);
    const synergyBonus = group ? (group.resonanceScore || 50) / 10 : 0;
    
    const opportunity: Opportunity = {
      id,
      ...insertOpportunity,
      currentAmount: 0,
      synergyBonus: Math.round(synergyBonus * 100) / 100,
      status: "active",
      createdAt: new Date()
    };
    
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity | undefined> {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return undefined;
    
    const updated = { ...opportunity, ...updates };
    
    // Check if completed
    if (updated.currentAmount && updated.currentAmount >= updated.targetAmount) {
      updated.status = "completed";
    }
    
    this.opportunities.set(id, updated);
    return updated;
  }

  // Stats
  async getStats(): Promise<{ totalUsers: number; activeGroups: number; totalEarnings: number; avgResonance: number }> {
    const users = await this.getAllUsers();
    const groups = await this.getAllGroups();
    const opportunities = await this.getAllOpportunities();

    const totalEarnings = opportunities.reduce((sum, o) => sum + (o.currentAmount || 0), 0);
    const avgResonance = users.length > 0
      ? Math.round(users.reduce((sum, u) => sum + (u.resonanceScore || 50), 0) / users.length)
      : 0;

    return {
      totalUsers: users.length,
      activeGroups: groups.length,
      totalEarnings,
      avgResonance
    };
  }
}

export const storage = new MemStorage();
