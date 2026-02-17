import { GoogleGenAI } from "@google/genai";
import { RoboflowPrediction } from "../types";

export const getSkinCareInsights = async (predictions: RoboflowPrediction[], userApiKey?: string): Promise<string> => {
  // Use the key passed from App state (user settings) or fallback to env var
  const apiKey = userApiKey || process.env.API_KEY || "";

  if (!apiKey) {
    return "Please enter a valid Google Gemini API Key in the Settings menu to receive AI insights.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const types = Array.from(new Set(predictions.map(p => p.class))).join(", ");
  const counts = predictions.reduce((acc: any, p) => {
    acc[p.class] = (acc[p.class] || 0) + 1;
    return acc;
  }, {});

  const countStr = Object.entries(counts).map(([name, count]) => `${count} ${name}(s)`).join(", ");

  const prompt = `
    Based on a skin analysis, the following acne types were detected: ${countStr}.
    Total detected: ${predictions.length}.
    
    Provide a professional, brief analysis of what these findings mean and general skincare advice (e.g., ingredients like Salicylic Acid for blackheads/whiteheads or Benzoyl Peroxide for inflammatory acne). 
    
    IMPORTANT: Include a strong medical disclaimer that this is an AI analysis and not a professional medical diagnosis. Suggest consulting a dermatologist.
    Format your response in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate AI insights. Please check your API Key in Settings.";
  }
};