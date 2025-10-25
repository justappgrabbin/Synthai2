/**
 * User Creations Management
 * Tracks uploaded zip projects and custom creations
 */

export interface UserCreation {
  id: string;
  name: string;
  type: 'zip' | 'gan' | 'project';
  uploadedAt: string;
  fileCount: number;
  description?: string;
}

const STORAGE_KEY = 'youniverse_user_creations';

export class UserCreations {
  static getAll(): UserCreation[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static add(creation: Omit<UserCreation, 'id' | 'uploadedAt'>): UserCreation {
    const creations = this.getAll();
    const newCreation: UserCreation = {
      ...creation,
      id: `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date().toISOString()
    };
    
    creations.unshift(newCreation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));
    return newCreation;
  }

  static remove(id: string): void {
    const creations = this.getAll().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
