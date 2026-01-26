
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateQuestion = async (topic: string, difficulty: string = 'intermediate') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a single, thought-provoking university-level question for a student about the topic: "${topic}". 
                 Difficulty level: ${difficulty}. 
                 The response should be concise and direct. Language: Chinese (Traditional or Simplified based on input).`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating question:", error);
    return "無法生成問題，請手動提問。";
  }
};
