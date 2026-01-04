
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ImageSize, Interpretation, ChatMessage } from "../types";

// Helper to ensure we have an API instance using the environment key directly
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          mimeType: 'audio/webm',
          data: base64Audio,
        },
      },
      { text: "Please transcribe this dream recording exactly. Only provide the text of the transcription." },
    ],
  });
  return response.text || "Transcription failed.";
};

export const interpretDream = async (transcription: string): Promise<Interpretation> => {
  const ai = getAI();
  // Switched to gemini-3-flash-preview for significantly faster processing
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this dream from a Jungian perspective. Focus on archetypes and symbols. Return a JSON object matching this structure:
    {
      "coreTheme": "string",
      "archetypes": [{"name": "string", "description": "string"}],
      "symbols": [{"object": "string", "meaning": "string"}],
      "psychologicalContext": "string"
    }
    
    Dream: ${transcription}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          coreTheme: { type: Type.STRING },
          archetypes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "description"]
            }
          },
          symbols: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                object: { type: Type.STRING },
                meaning: { type: Type.STRING },
              },
              required: ["object", "meaning"]
            }
          },
          psychologicalContext: { type: Type.STRING },
        },
        required: ["coreTheme", "archetypes", "symbols", "psychologicalContext"]
      }
    }
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse interpretation JSON", text);
    throw new Error("Invalid interpretation format returned from API");
  }
};

export const generateDreamImage = async (interpretation: Interpretation, size: ImageSize): Promise<string> => {
  const ai = getAI();
  // gemini-2.5-flash-image is highly optimized for speed at 1K resolution
  const model = size === '1K' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
  
  const prompt = `A surrealist masterpiece capturing the core theme: "${interpretation.coreTheme}". 
  Prominent symbols: ${interpretation.symbols.map(s => s.object).join(', ')}. 
  Art style: Ethereal atmospheric surrealism, cinematic lighting, high contrast, dream-like textures.`;

  const config: any = {
    imageConfig: {
      aspectRatio: "1:1"
    }
  };

  if (model === 'gemini-3-pro-image-preview') {
    config.imageConfig.imageSize = size;
  }

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }]
    },
    config
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const getDreamChatResponse = async (
  dreamContext: string,
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are an expert dream analyst. The user had a dream described as: "${dreamContext}". 
      Answer their questions about symbols and meanings using Jungian psychology. Keep responses insightful, mysterious yet helpful, and conversational.`
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "I'm sorry, I couldn't interpret that deep layer of your subconscious.";
};
