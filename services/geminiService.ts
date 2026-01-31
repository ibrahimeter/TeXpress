
import { GoogleGenAI } from "@google/genai";

export const generateProductDescription = async (name: string, price: number, weight: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a compelling, short marketing description for a product named "${name}" that costs $${price} and weighs ${weight}kg. Keep it under 150 characters.`,
    });
    return response.text?.trim() || "Quality product from Texpress.";
  } catch (error) {
    console.error("Gemini description error:", error);
    return "Expertly crafted for your daily needs.";
  }
};
