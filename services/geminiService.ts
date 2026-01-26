
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateQuestion = async (topic: string, difficulty: string = 'intermediate') => {
  const ai = getClient();
  if (!ai) {
    return "API Key 未設定，無法使用 AI 功能。請在 .env 文件中設定 GEMINI_API_KEY。";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: `Generate a single, thought-provoking university-level question for a student about the topic: "${topic}". 
                 Difficulty level: ${difficulty}. 
                 The response should be concise and direct. Language: Chinese (Tw).`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating question:", error);
    return "無法生成問題，請稍後重試。";
  }
};
