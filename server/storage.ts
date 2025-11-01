import { 
  type User, 
  type InsertUser,
  type TokenLedger,
  type InsertTokenLedger,
  type IdeonSeed,
  type InsertIdeonSeed,
  type WorldManifestation,
  type InsertWorldManifestation,
  type StoredZip
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Token ledger
  getTokenLedger(userId: string, month: string): Promise<TokenLedger | undefined>;
  createTokenLedger(ledger: InsertTokenLedger): Promise<TokenLedger>;
  updateTokenLedger(id: string, updates: Partial<TokenLedger>): Promise<TokenLedger | undefined>;
  decrementToken(userId: string, month: string): Promise<boolean>;
  
  // Ideon seeds (semantic world inputs)
  getIdeonSeed(id: string): Promise<IdeonSeed | undefined>;
  getIdeonSeedsByUser(userId: string): Promise<IdeonSeed[]>;
  createIdeonSeed(seed: InsertIdeonSeed): Promise<IdeonSeed>;
  updateIdeonSeed(id: string, updates: Partial<IdeonSeed>): Promise<IdeonSeed | undefined>;
  
  // World manifestations (generated outputs)
  getWorldManifestation(id: string): Promise<WorldManifestation | undefined>;
  getWorldManifestationByIdeonId(ideonSeedId: string): Promise<WorldManifestation | undefined>;
  createWorldManifestation(manifestation: InsertWorldManifestation): Promise<WorldManifestation>;
  
  // ZIP archives (in-memory)
  getZip(id: string): Promise<StoredZip | undefined>;
  getAllZips(): Promise<StoredZip[]>;
  createZip(zip: Omit<StoredZip, 'id'>): Promise<StoredZip>;
  deleteZip(id: string): Promise<boolean>;
  getZipFileContent(zipId: string, filePath: string): Promise<string>;
  mergeZips(zipIds: string[], conflictResolutions: Record<string, 'first' | 'last' | 'rename'>): Promise<{ id: string; fileCount: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tokenLedgers: Map<string, TokenLedger>;
  private ideonSeeds: Map<string, IdeonSeed>;
  private worldManifestations: Map<string, WorldManifestation>;
  private zips: Map<string, StoredZip>;

  constructor() {
    this.users = new Map();
    this.tokenLedgers = new Map();
    this.ideonSeeds = new Map();
    this.worldManifestations = new Map();
    this.zips = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Token ledger methods
  async getTokenLedger(userId: string, month: string): Promise<TokenLedger | undefined> {
    return Array.from(this.tokenLedgers.values()).find(
      (ledger) => ledger.userId === userId && ledger.month === month
    );
  }

  async createTokenLedger(insertLedger: InsertTokenLedger): Promise<TokenLedger> {
    const id = randomUUID();
    const ledger: TokenLedger = {
      ...insertLedger,
      id,
      tokensRemaining: insertLedger.tokensRemaining ?? 5,
      tokensUsed: insertLedger.tokensUsed ?? 0,
      createdAt: new Date(),
    };
    this.tokenLedgers.set(id, ledger);
    return ledger;
  }

  async updateTokenLedger(id: string, updates: Partial<TokenLedger>): Promise<TokenLedger | undefined> {
    const ledger = this.tokenLedgers.get(id);
    if (!ledger) return undefined;
    
    const updated = { ...ledger, ...updates };
    this.tokenLedgers.set(id, updated);
    return updated;
  }

  async decrementToken(userId: string, month: string): Promise<boolean> {
    let ledger = await this.getTokenLedger(userId, month);
    
    if (!ledger) {
      // Create new ledger for this month
      ledger = await this.createTokenLedger({
        userId,
        month,
        tokensRemaining: 5,
        tokensUsed: 0,
      });
    }
    
    if (ledger.tokensRemaining <= 0) {
      return false;
    }
    
    await this.updateTokenLedger(ledger.id, {
      tokensRemaining: ledger.tokensRemaining - 1,
      tokensUsed: ledger.tokensUsed + 1,
    });
    
    return true;
  }

  // Ideon seed methods
  async getIdeonSeed(id: string): Promise<IdeonSeed | undefined> {
    return this.ideonSeeds.get(id);
  }

  async getIdeonSeedsByUser(userId: string): Promise<IdeonSeed[]> {
    return Array.from(this.ideonSeeds.values())
      .filter((seed) => seed.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createIdeonSeed(insertSeed: InsertIdeonSeed): Promise<IdeonSeed> {
    const id = randomUUID();
    const seed: IdeonSeed = {
      ...insertSeed,
      id,
      status: insertSeed.status ?? 'pending',
      createdAt: new Date(),
      completedAt: null,
    };
    this.ideonSeeds.set(id, seed);
    return seed;
  }

  async updateIdeonSeed(id: string, updates: Partial<IdeonSeed>): Promise<IdeonSeed | undefined> {
    const seed = this.ideonSeeds.get(id);
    if (!seed) return undefined;
    
    const updated = { ...seed, ...updates };
    this.ideonSeeds.set(id, updated);
    return updated;
  }

  // World manifestation methods
  async getWorldManifestation(id: string): Promise<WorldManifestation | undefined> {
    return this.worldManifestations.get(id);
  }

  async getWorldManifestationByIdeonId(ideonSeedId: string): Promise<WorldManifestation | undefined> {
    return Array.from(this.worldManifestations.values()).find(
      (manifestation) => manifestation.ideonSeedId === ideonSeedId
    );
  }

  async createWorldManifestation(insertManifestation: InsertWorldManifestation): Promise<WorldManifestation> {
    const id = randomUUID();
    const manifestation: WorldManifestation = {
      ...insertManifestation,
      id,
      createdAt: new Date(),
    };
    this.worldManifestations.set(id, manifestation);
    return manifestation;
  }

  // ZIP archive methods
  async getZip(id: string): Promise<StoredZip | undefined> {
    return this.zips.get(id);
  }

  async getAllZips(): Promise<StoredZip[]> {
    return Array.from(this.zips.values())
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }

  async createZip(zip: Omit<StoredZip, 'id'>): Promise<StoredZip> {
    const id = randomUUID();
    const storedZip: StoredZip = {
      ...zip,
      id,
    };
    this.zips.set(id, storedZip);
    return storedZip;
  }

  async deleteZip(id: string): Promise<boolean> {
    return this.zips.delete(id);
  }

  async getZipFileContent(zipId: string, filePath: string): Promise<string> {
    const zip = this.zips.get(zipId);
    if (!zip) {
      throw new Error('ZIP not found');
    }

    const entry = zip.structure.entries.find(e => e.path === filePath && e.type === 'file');
    if (!entry) {
      throw new Error('File not found in ZIP');
    }

    // For in-memory storage, we'll return a placeholder
    // In a real implementation, this would extract the file from the ZIP blob
    return `<!-- File: ${filePath} from ${zip.originalName} -->\n<p>File content would be loaded from ZIP archive</p>`;
  }

  async mergeZips(zipIds: string[], conflictResolutions: Record<string, 'first' | 'last' | 'rename'>): Promise<{ id: string; fileCount: number }> {
    const zips = zipIds.map(id => this.zips.get(id)).filter(z => z !== undefined) as StoredZip[];
    
    if (zips.length < 2) {
      throw new Error('Need at least 2 ZIPs to merge');
    }

    // Merge file structures
    const mergedEntries = new Map<string, any>();
    let totalSize = 0;
    let fileCount = 0;
    let directoryCount = 0;

    for (const zip of zips) {
      for (const entry of zip.structure.entries) {
        const path = entry.path;
        
        if (mergedEntries.has(path)) {
          const resolution = conflictResolutions[path] || 'last';
          if (resolution === 'last') {
            mergedEntries.set(path, entry);
          } else if (resolution === 'rename') {
            const newPath = `${path}.${zip.id.slice(0, 8)}`;
            mergedEntries.set(newPath, { ...entry, path: newPath });
          }
          // 'first' means skip, entry already exists
        } else {
          mergedEntries.set(path, entry);
        }

        if (entry.type === 'file') {
          fileCount++;
          totalSize += entry.size || 0;
        } else {
          directoryCount++;
        }
      }
    }

    // Create merged ZIP record
    const mergedZip = await this.createZip({
      filename: `merged_${Date.now()}.zip`,
      originalName: `Merged Archive (${zips.length} files)`,
      uploadDate: new Date().toISOString(),
      size: totalSize,
      objectPath: `merged/${randomUUID()}`,
      structure: {
        entries: Array.from(mergedEntries.values()),
        totalSize,
        fileCount,
        directoryCount,
      },
      analysis: {
        description: `Merged from ${zips.length} archives`,
        projectType: 'merged',
        technologies: [],
        confidence: 0.5,
      },
    });

    return { id: mergedZip.id, fileCount };
  }
}

export const storage = new MemStorage();
