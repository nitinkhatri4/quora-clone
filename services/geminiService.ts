
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateAnswerWithGemini = async (questionTitle: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Gemini API key is not configured. Please ask the administrator to set it up.";
  }

  try {
    const systemInstruction = "You are a helpful and knowledgeable assistant. Your goal is to provide a clear, concise, and accurate answer to the user's question. Format your answer using markdown for readability.";
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: `Please provide a comprehensive answer to the following question: "${questionTitle}"`,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            topP: 1,
            topK: 32,
        },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error while trying to generate an answer. Please try again later.";
  }
};
