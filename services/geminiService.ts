import { GoogleGenAI } from "@google/genai";
import { RoboflowPrediction } from "../types";

export const getSkinCareInsights = async (predictions: RoboflowPrediction[]): Promise<string> => {
  // The API key must be obtained exclusively from the environment variable.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Missing API_KEY in environment variables.");
    return "## Configuration Error\n\nThe Google Gemini API Key is missing. Please configure the `API_KEY` environment variable in your Vercel project settings.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
    
    Return the response in clear Markdown format. Use bullet points and bold text where appropriate.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "## Analysis Failed\n\nCould not generate AI insights. Please check your API usage limits or configuration.";
  }
};