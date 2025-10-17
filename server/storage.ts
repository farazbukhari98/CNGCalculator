import { users, type User, type InsertUser, savedStrategies, type SavedStrategy, type InsertSavedStrategy } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Saved strategies methods
  saveStrategy(strategy: InsertSavedStrategy): Promise<SavedStrategy>;
  getAllStrategies(): Promise<SavedStrategy[]>;
  getStrategy(id: string): Promise<SavedStrategy | undefined>;
  updateStrategyName(id: string, name: string): Promise<SavedStrategy | undefined>;
  deleteStrategy(id: string): Promise<void>;
}

export class HybridStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  // User methods (in-memory)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Saved strategies methods (database)
  async saveStrategy(strategy: InsertSavedStrategy): Promise<SavedStrategy> {
    const [saved] = await db
      .insert(savedStrategies)
      .values(strategy)
      .returning();
    return saved;
  }

  async getAllStrategies(): Promise<SavedStrategy[]> {
    return await db
      .select()
      .from(savedStrategies)
      .orderBy(desc(savedStrategies.createdAt));
  }

  async getStrategy(id: string): Promise<SavedStrategy | undefined> {
    const [strategy] = await db
      .select()
      .from(savedStrategies)
      .where(eq(savedStrategies.id, id));
    return strategy || undefined;
  }

  async updateStrategyName(id: string, name: string): Promise<SavedStrategy | undefined> {
    const [updated] = await db
      .update(savedStrategies)
      .set({ name })
      .where(eq(savedStrategies.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStrategy(id: string): Promise<void> {
    await db
      .delete(savedStrategies)
      .where(eq(savedStrategies.id, id));
  }
}

export const storage = new HybridStorage();
