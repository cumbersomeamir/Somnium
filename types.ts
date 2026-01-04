
export type ImageSize = '1K' | '2K' | '4K';

export interface Interpretation {
  coreTheme: string;
  archetypes: {
    name: string;
    description: string;
  }[];
  symbols: {
    object: string;
    meaning: string;
  }[];
  psychologicalContext: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface DreamEntry {
  id: string;
  timestamp: number;
  audioUrl?: string;
  transcription: string;
  imageUrl?: string;
  interpretation?: Interpretation;
  chatHistory: ChatMessage[];
  imageSize: ImageSize;
}
