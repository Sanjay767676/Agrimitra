export interface FarmerProfile {
  id?: string;
  name: string;
  location?: string;
  cropType: string;
  soilType: string;
  landSize: number;
  landUnit: string;
  irrigation: string;
  websiteLanguage: string;
  chatbotLanguage: string;
}

export interface ChatMessage {
  id: string;
  sender: 'farmer' | 'bot';
  message: string;
  timestamp: Date;
  originalLanguage?: string;
}

export interface WeatherData {
  tempC: number;
  humidity: number;
  condition: string;
  rainProb24h: number;
  wind: number;
  forecastArray: any[];
}

export interface Alert {
  id: string;
  type: 'weather' | 'pest' | 'market';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}
