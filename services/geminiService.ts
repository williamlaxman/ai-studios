import { GoogleGenAI, Type } from "@google/genai";
import { RoboflowPrediction, PatientHistory } from "../types";

export interface AIInsights {
  clinicalImpression: string;
  objectiveFindings: string[];
  treatmentPlan: string[];
  ingredientRationale: { ingredient: string; rationale: string }[];
  disclaimer: string;
  recommendedIngredients: string[];
  recommendedProducts: { brand: string; name: string; type: 'Drug' | 'Cosmetic' }[];
}

export const getSkinCareInsights = async (predictions: RoboflowPrediction[], userApiKey?: string, patientHistory?: PatientHistory): Promise<AIInsights> => {
  // Prioritize user-provided key, then environment variables
  const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("Missing Gemini API Key.");
    return {
      clinicalImpression: "Configuration Error",
      objectiveFindings: ["The Google Gemini API Key is missing."],
      treatmentPlan: ["Please configure it in the settings menu or set the `GEMINI_API_KEY` environment variable."],
      ingredientRationale: [],
      disclaimer: "System Error",
      recommendedIngredients: [],
      recommendedProducts: []
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const counts = predictions.reduce((acc: any, p) => {
    acc[p.class] = (acc[p.class] || 0) + 1;
    return acc;
  }, {});

  const countStr = Object.entries(counts).map(([name, count]) => `${count} ${name}(s)`).join(", ");

  let historyContext = "";
  if (patientHistory) {
    historyContext = `
    Patient History:
    - Skin Type: ${patientHistory.skinType || "Not specified"}
    - Previous Treatments: ${patientHistory.previousTreatments || "None specified"}
    - Medical/Skin History: ${patientHistory.history || "None specified"}
    
    Incorporate this patient history into your assessment and recommendations.
    `;
  }

    const prompt = `
    Based on a skin analysis, the following acne types were detected: ${countStr}.
    Total detected: ${predictions.length}.
    ${historyContext}
    
    Provide a professional, structured clinical assessment mimicking how a dermatologist would write a patient chart, but use clear, accessible language.
    
    IMPORTANT: 
    1. Avoid complex medical jargon where possible. For example, do NOT use "erythematous" (use "red" or "inflamed" instead).
    2. You MUST recommend 3-5 specific skincare products that are widely available in the Philippines (including local brands like Celeteque, Belo, Luxe Organix, Human Nature, or popular international brands registered in PH).
    3. You MUST provide a strong medical disclaimer.
    4. You MUST list specific active ingredients recommended for this condition.
    5. ALL fields in the JSON must be filled. Do not return empty arrays or empty strings.
    6. CRITICAL: Ensure that the 'recommendedIngredients' and 'recommendedProducts' are DIRECTLY and LOGICALLY connected to the specific acne types detected (e.g., Salicylic Acid for blackheads, Benzoyl Peroxide for pustules) AND the patient's skin type/history if provided. Explain the connection in the 'ingredientRationale'.
    
    Return the response in JSON format with the following structure:
    {
      "clinicalImpression": "A formal clinical assessment of the skin condition.",
      "objectiveFindings": ["List of specific objective observations."],
      "treatmentPlan": ["Actionable clinical recommendations."],
      "ingredientRationale": [
        {
          "ingredient": "Name of active ingredient",
          "rationale": "Why this is recommended."
        }
      ],
      "disclaimer": "Strong medical disclaimer.",
      "recommendedIngredients": ["List of active ingredients"],
      "recommendedProducts": [
        {
          "brand": "Brand Name",
          "name": "Product Name",
          "type": "Drug" or "Cosmetic" (Use 'Drug' for strong actives like Tretinoin/Benzoyl Peroxide, 'Cosmetic' for cleansers/moisturizers)
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clinicalImpression: { type: Type.STRING },
            objectiveFindings: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            treatmentPlan: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            ingredientRationale: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ingredient: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                }
              }
            },
            disclaimer: { type: Type.STRING },
            recommendedIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedProducts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  brand: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Drug", "Cosmetic"] }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const parsedResult = JSON.parse(text) as AIInsights;

    // Fallback for disclaimer if missing
    if (!parsedResult.disclaimer || parsedResult.disclaimer.trim() === "") {
      parsedResult.disclaimer = "This AI-generated analysis is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult with a board-certified dermatologist or qualified healthcare provider for any skin concerns. Do not disregard professional medical advice or delay seeking it because of something you have read on this platform.";
    }

    // Ensure arrays are initialized
    if (!Array.isArray(parsedResult.recommendedIngredients)) {
      parsedResult.recommendedIngredients = [];
    }
    if (!Array.isArray(parsedResult.recommendedProducts)) {
      parsedResult.recommendedProducts = [];
    }

    return parsedResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);

    // Check for 429 Resource Exhausted Error
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      return {
        clinicalImpression: "Service Unavailable",
        objectiveFindings: ["The AI service is currently experiencing high demand."],
        treatmentPlan: ["Please try again in a few minutes.", "Check your API quota if using a personal key."],
        ingredientRationale: [],
        disclaimer: "System Error: Rate Limit Exceeded",
        recommendedIngredients: [],
        recommendedProducts: []
      };
    }

    return {
      clinicalImpression: "Analysis Failed",
      objectiveFindings: ["Could not generate AI insights."],
      treatmentPlan: ["Please check your API usage limits or configuration."],
      ingredientRationale: [],
      disclaimer: "System Error",
      recommendedIngredients: [],
      recommendedProducts: []
    };
  }
};
