import type { FarmerProfile, ChatMessage } from "../types/index";

class StorageService {
  private readonly PROFILE_KEY = "agrimitra_profile";
  private readonly CHAT_HISTORY_KEY = "agrimitra_chat_history";

  // Profile management
  async saveProfile(profile: FarmerProfile): Promise<void> {
    try {
      const profileWithId = {
        ...profile,
        id: profile.id || this.generateId(),
      };
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profileWithId));
    } catch (error) {
      console.error("Error saving profile:", error);
      throw new Error("Failed to save profile");
    }
  }

  async getProfile(): Promise<FarmerProfile | null> {
    try {
      const profileData = localStorage.getItem(this.PROFILE_KEY);
      if (!profileData) return null;
      
      return JSON.parse(profileData);
    } catch (error) {
      console.error("Error loading profile:", error);
      return null;
    }
  }

  async deleteProfile(): Promise<void> {
    try {
      localStorage.removeItem(this.PROFILE_KEY);
      localStorage.removeItem(this.CHAT_HISTORY_KEY);
    } catch (error) {
      console.error("Error deleting profile:", error);
      throw new Error("Failed to delete profile");
    }
  }

  // Chat history management
  async saveChatHistory(profileId: string, messages: ChatMessage[]): Promise<void> {
    try {
      const chatKey = `${this.CHAT_HISTORY_KEY}_${profileId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat history:", error);
      throw new Error("Failed to save chat history");
    }
  }

  async getChatHistory(profileId: string): Promise<ChatMessage[]> {
    try {
      const chatKey = `${this.CHAT_HISTORY_KEY}_${profileId}`;
      const historyData = localStorage.getItem(chatKey);
      if (!historyData) return [];
      
      const messages = JSON.parse(historyData);
      // Convert timestamp strings back to Date objects
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [];
    }
  }

  async clearChatHistory(profileId: string): Promise<void> {
    try {
      const chatKey = `${this.CHAT_HISTORY_KEY}_${profileId}`;
      localStorage.removeItem(chatKey);
    } catch (error) {
      console.error("Error clearing chat history:", error);
      throw new Error("Failed to clear chat history");
    }
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Future: Firebase integration
  async syncWithFirebase(): Promise<void> {
    // Placeholder for Firebase sync when implemented
    console.log("Firebase sync not implemented yet");
  }

  async enableFirebaseSync(firebaseConfig: any): Promise<void> {
    // Placeholder for enabling Firebase
    console.log("Firebase sync setup not implemented yet");
  }
}

export const storageService = new StorageService();
