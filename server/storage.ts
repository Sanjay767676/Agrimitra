import { type FarmerProfile, type InsertFarmerProfile, type ChatMessage, type InsertChatMessage, type WeatherAlert, type InsertWeatherAlert } from "@shared/schema";
import { randomUUID } from "crypto";

// Enhanced storage interface for Agrimitra
export interface IStorage {
  // Profile management
  createProfile(profile: InsertFarmerProfile): Promise<FarmerProfile>;
  getProfile(id: string): Promise<FarmerProfile | undefined>;
  updateProfile(id: string, profile: Partial<InsertFarmerProfile>): Promise<FarmerProfile | undefined>;
  deleteProfile(id: string): Promise<boolean>;
  
  // Chat message management
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessages(profileId: string): Promise<ChatMessage[]>;
  clearMessages(profileId: string): Promise<boolean>;
  
  // Weather alert management
  createAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;
  getAlerts(profileId: string): Promise<WeatherAlert[]>;
  markAlertAsRead(alertId: string): Promise<WeatherAlert | undefined>;
  deleteAlert(alertId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private profiles: Map<string, FarmerProfile>;
  private messages: Map<string, ChatMessage>;
  private alerts: Map<string, WeatherAlert>;

  constructor() {
    this.profiles = new Map();
    this.messages = new Map();
    this.alerts = new Map();
  }

  // Profile management
  async createProfile(insertProfile: InsertFarmerProfile): Promise<FarmerProfile> {
    const id = randomUUID();
    const now = new Date();
    const profile: FarmerProfile = {
      ...insertProfile,
      id,
      userId: insertProfile.userId ?? null,
      location: insertProfile.location ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.profiles.set(id, profile);
    return profile;
  }

  async getProfile(id: string): Promise<FarmerProfile | undefined> {
    return this.profiles.get(id);
  }

  async updateProfile(id: string, updates: Partial<InsertFarmerProfile>): Promise<FarmerProfile | undefined> {
    const existing = this.profiles.get(id);
    if (!existing) return undefined;

    const updated: FarmerProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.profiles.set(id, updated);
    return updated;
  }

  async deleteProfile(id: string): Promise<boolean> {
    const deleted = this.profiles.delete(id);
    if (deleted) {
      // Also delete associated messages and alerts
      await this.clearMessages(id);
      
      // Delete all alerts for this profile
      const profileAlerts = Array.from(this.alerts.values()).filter(alert => alert.profileId === id);
      for (const alert of profileAlerts) {
        this.alerts.delete(alert.id);
      }
    }
    return deleted;
  }

  // Chat message management
  async createMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      profileId: insertMessage.profileId ?? null,
      originalLanguage: insertMessage.originalLanguage ?? null,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(profileId: string): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(message => message.profileId === profileId)
      .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  }

  async clearMessages(profileId: string): Promise<boolean> {
    const profileMessages = Array.from(this.messages.entries())
      .filter(([_, message]) => message.profileId === profileId);
    
    for (const [id] of profileMessages) {
      this.messages.delete(id);
    }
    
    return true;
  }

  // Weather alert management
  async createAlert(insertAlert: InsertWeatherAlert): Promise<WeatherAlert> {
    const id = randomUUID();
    const alert: WeatherAlert = {
      ...insertAlert,
      id,
      profileId: insertAlert.profileId ?? null,
      isRead: insertAlert.isRead ?? null,
      createdAt: new Date(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async getAlerts(profileId: string): Promise<WeatherAlert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.profileId === profileId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async markAlertAsRead(alertId: string): Promise<WeatherAlert | undefined> {
    const alert = this.alerts.get(alertId);
    if (!alert) return undefined;

    const updated: WeatherAlert = {
      ...alert,
      isRead: true,
    };
    this.alerts.set(alertId, updated);
    return updated;
  }

  async deleteAlert(alertId: string): Promise<boolean> {
    return this.alerts.delete(alertId);
  }

  // Utility methods for debugging/admin
  getAllProfiles(): FarmerProfile[] {
    return Array.from(this.profiles.values());
  }

  getAllMessages(): ChatMessage[] {
    return Array.from(this.messages.values());
  }

  getAllAlerts(): WeatherAlert[] {
    return Array.from(this.alerts.values());
  }

  // Stats methods
  getStats() {
    return {
      totalProfiles: this.profiles.size,
      totalMessages: this.messages.size,
      totalAlerts: this.alerts.size,
      profilesWithMessages: new Set(Array.from(this.messages.values()).map(m => m.profileId)).size,
      profilesWithAlerts: new Set(Array.from(this.alerts.values()).map(a => a.profileId)).size,
    };
  }
}

export const storage = new MemStorage();
