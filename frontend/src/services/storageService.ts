import type { FarmerProfile, ChatMessage } from "../types/index";
import { getAccessToken } from "../hooks/useAuth";

// Maps a Supabase farmer_profiles row (snake_case) to the frontend shape.
function rowToProfile(row: any): FarmerProfile {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? undefined,
    cropType: row.crop_type,
    soilType: row.soil_type,
    landSize: row.land_size,
    landUnit: row.land_unit,
    irrigation: row.irrigation,
    websiteLanguage: row.website_language ?? "en",
    chatbotLanguage: row.chatbot_language ?? "en",
  };
}

function rowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    sender: row.sender,
    message: row.message,
    originalLanguage: row.original_language ?? undefined,
    timestamp: new Date(row.created_at),
  };
}

class StorageService {
  private readonly PROFILE_KEY = "agrimitra_profile";
  private readonly CHAT_HISTORY_KEY = "agrimitra_chat_history";

  private async authHeaders(): Promise<Record<string, string> | null> {
    const token = await getAccessToken();
    if (!token) return null;
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }

  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------
  async saveProfile(profile: FarmerProfile): Promise<void> {
    const headers = await this.authHeaders();

    // Signed in -> persist to Supabase via the backend.
    if (headers) {
      try {
        const resp = await fetch("/api/me/profile", {
          method: "PUT",
          headers,
          body: JSON.stringify(profile),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.profile) {
            localStorage.setItem(this.PROFILE_KEY, JSON.stringify(rowToProfile(data.profile)));
          }
          return;
        }
      } catch (error) {
        console.error("Error saving profile to server:", error);
      }
    }

    // Fallback: localStorage only.
    try {
      const profileWithId = { ...profile, id: profile.id || this.generateId() };
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profileWithId));
    } catch (error) {
      console.error("Error saving profile:", error);
      throw new Error("Failed to save profile");
    }
  }

  async getProfile(): Promise<FarmerProfile | null> {
    const headers = await this.authHeaders();

    if (headers) {
      try {
        const resp = await fetch("/api/me/profile", { headers });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.profile) {
            const profile = rowToProfile(data.profile);
            localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
            return profile;
          }
          return null; // signed in but no profile yet
        }
      } catch (error) {
        console.error("Error loading profile from server:", error);
      }
    }

    // Fallback: localStorage.
    try {
      const profileData = localStorage.getItem(this.PROFILE_KEY);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error("Error loading profile:", error);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Chat history
  // -------------------------------------------------------------------------
  async saveChatHistory(profileId: string, messages: ChatMessage[]): Promise<void> {
    // When signed in, individual messages are appended via appendMessage().
    // This method keeps the localStorage cache in sync for offline/fallback.
    try {
      const chatKey = `${this.CHAT_HISTORY_KEY}_${profileId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }

  async getChatHistory(profileId: string): Promise<ChatMessage[]> {
    const headers = await this.authHeaders();

    if (headers) {
      try {
        const resp = await fetch("/api/me/messages", { headers });
        if (resp.ok) {
          const data = await resp.json();
          return (data.messages || []).map(rowToMessage);
        }
      } catch (error) {
        console.error("Error loading messages from server:", error);
      }
    }

    // Fallback: localStorage.
    try {
      const chatKey = `${this.CHAT_HISTORY_KEY}_${profileId}`;
      const historyData = localStorage.getItem(chatKey);
      if (!historyData) return [];
      const messages = JSON.parse(historyData);
      return messages.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [];
    }
  }

  // Append a single message to Supabase (no-op when not signed in).
  async appendMessage(message: ChatMessage): Promise<void> {
    const headers = await this.authHeaders();
    if (!headers) return;
    try {
      await fetch("/api/me/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          sender: message.sender,
          message: message.message,
          originalLanguage: message.originalLanguage ?? null,
        }),
      });
    } catch (error) {
      console.error("Error appending message to server:", error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const storageService = new StorageService();
