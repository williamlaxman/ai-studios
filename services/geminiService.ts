import { GoogleGenAI, Type } from "@google/genai";
import { RoboflowPrediction, PatientHistory, Clinic } from "../types";

export interface AIInsights {
  clinicalImpression: string;
  severity: "Mild" | "Moderate" | "Severe";
  acneType: string;
  objectiveFindings: string[];
  treatmentPlan: string[];
  ingredientRationale: { ingredient: string; rationale: string }[];
  disclaimer: string;
  recommendedIngredients: string[];
  recommendedProducts: { brand: string; name: string; type: 'Drug' | 'Cosmetic' }[];
}

export const findNearbyClinics = async (lat: number, lng: number, userApiKey?: string): Promise<Clinic[]> => {
  const apiKey = userApiKey || 
                 import.meta.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY || 
                 process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Missing Gemini API Key for Maps search.");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Find 5 highly-rated skin clinics or hospitals nearby that treat acne. If possible, prioritize clinics with PDS (Philippine Dermatological Society) board-certified dermatologists. Provide their details.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    // The grounding chunks contain the structured map data
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (!chunks || chunks.length === 0) {
      return [];
    }

    const clinics: Clinic[] = [];
    
    // We will try to extract from chunks first
    chunks.forEach((chunk: any, index: number) => {
      let lat: number | undefined;
      let lng: number | undefined;

      // Try to extract coordinates from URI if available
      // Format: /@14.555,121.000,15z
      const uri = chunk.web?.uri || chunk.maps?.uri;
      if (uri) {
        const match = uri.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        }
      }

      const reviews: any[] = [];
      // Extract review snippets if available
      // The structure can be deeply nested in placeAnswerSources
      /* 
         Note: The exact path to review snippets in the SDK response can vary.
         We check common paths.
      */
      const snippetSource = chunk.maps?.placeAnswerSources?.reviewSnippets || 
                            chunk.web?.placeAnswerSources?.reviewSnippets;

      if (snippetSource && Array.isArray(snippetSource)) {
        snippetSource.forEach((snippet: any, rIdx: number) => {
           reviews.push({
             id: `review-${index}-${rIdx}`,
             author: snippet.author || "Google User",
             rating: 5, // Snippets often don't have the numeric rating attached directly in this view
             text: snippet.content || snippet.text || "No review text available.",
             date: "Recent",
             source: 'Google'
           });
        });
      }

      if (chunk.web) {
        clinics.push({
          name: chunk.web.title || "Clinic",
          address: "View on Map",
          websiteUri: chunk.web.uri,
          googleMapsUri: chunk.web.uri, // Often web chunks from maps tool are maps links
          reviews: [], // Reviews text removed as per request
          rating: chunk.web.rating, // Extract rating if available
          userRatingCount: chunk.web.userRatingCount, // Extract count if available
          lat,
          lng
        });
      } else if (chunk.maps) {
        clinics.push({
          name: chunk.maps.title || "Clinic",
          address: "View on Map",
          websiteUri: chunk.maps.uri,
          googleMapsUri: chunk.maps.uri,
          reviews: [], // Reviews text removed as per request
          rating: chunk.maps.rating, // Extract rating if available
          userRatingCount: chunk.maps.userRatingCount, // Extract count if available
          lat,
          lng
        });
      }
    });

    return clinics;

  } catch (error: any) {
    console.error("Error finding clinics:", error);
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      throw new Error("API_QUOTA_EXCEEDED");
    }
    if (error.status === 403 || (error.message && error.message.includes("403")) || (error.message && error.message.toLowerCase().includes("forbidden"))) {
      throw new Error("API_PERMISSION_DENIED");
    }
    throw error;
  }
};

export const detectLesionsWithGemini = async (imageBase64: string, userApiKey?: string, classificationContext?: string): Promise<RoboflowPrediction[]> => {
  const apiKey = userApiKey || 
                 import.meta.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY || 
                 process.env.API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API Key");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analyze this image for acne lesions. 
    
    ${classificationContext ? `
    **STRICT CONSTRAINT:**
    A specialized classification model has diagnosed this image as: "${classificationContext}".
    You must **ONLY** detect and localize the specific lesion types that match this diagnosis.
    
    - If the diagnosis is "Pustule" or "Pustular", detect **ONLY Pustules**. Ignore everything else.
    - If the diagnosis is "Nodule" or "Nodular", detect **ONLY Nodules**. Ignore Pustules/Papules.
    - If the diagnosis is "Papule", detect **ONLY Papules**.
    - If the diagnosis is "Comedonal" or "Blackhead/Whitehead", detect **ONLY Blackheads and Whiteheads**.
    - If the diagnosis implies multiple types (e.g., "Papulopustular"), detect ONLY those specific types.
    
    Do NOT output bounding boxes for lesion types that are not present in the diagnosis "${classificationContext}".
    ` : 'Detect and localize all types of acne lesions present.'}
    
    Use these visual definitions for the allowed types:
    - **Pustule**: Red bump with a visible white or yellow center (pus).
    - **Papule**: Small (<5mm) red, raised bump WITHOUT a visible white/yellow center.
    - **Nodule**: Large (>5mm), deep, firm, red lump.
    - **Cyst**: Large, soft, fluid-filled lump.
    - **Blackhead**: Open pore with a dark center.
    - **Whitehead**: Small flesh-colored bump.
    - **Acne Scar**: Indented or raised scar tissue.

    Return a JSON object with a key "predictions" containing a list of detections.
    Each detection must have:
    - "class": The type of acne (String).
    - "confidence": A score between 0.5 and 1.0 (Float).
    - "box_2d": A bounding box [ymin, xmin, ymax, xmax] where coordinates are normalized to 0-1000 (Integer).
    
    Example:
    {
      "predictions": [
        { "class": "Pustule", "confidence": 0.95, "box_2d": [100, 200, 150, 250] }
      ]
    }
  `;

  const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/jpeg";
  const imageBytes = imageBase64.split(",")[1];

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ inlineData: { mimeType, data: imageBytes } }, { text: prompt }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  class: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  box_2d: { 
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER }
                  }
                }
              }
            }
          }
        }
      }
    });

    const responseText = result.text;
    if (!responseText) return [];
    
    const parsed = JSON.parse(responseText);

    if (!parsed.predictions || !Array.isArray(parsed.predictions)) {
      return [];
    }

    // Convert Gemini 0-1000 coordinates to Roboflow format (x, y, width, height - normalized 0-1? No, Roboflow usually returns absolute pixels, but here we need to match what the App expects)
    // The App's AnalyzedImage component expects absolute pixel coordinates if we look at how it scales.
    // Wait, AnalyzedImage.tsx says:
    // const scale = containerWidth / result.imageDimensions.width;
    // const x = (pred.x - pred.width / 2) * scale;
    // This implies pred.x/y/width/height are in ORIGINAL IMAGE PIXELS.

    // We don't have the original image dimensions here inside this function easily unless we load the image.
    // However, we can return normalized coordinates (0-1) and let the caller handle it, OR we can load the image to get dimensions.
    // Let's load the image dimensions to be safe and return absolute pixels, matching Roboflow's output format.

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        const predictions: RoboflowPrediction[] = parsed.predictions.map((p: any) => {
          const [ymin, xmin, ymax, xmax] = p.box_2d;
          
          // Convert 0-1000 to absolute pixels
          const absYMin = (ymin / 1000) * height;
          const absXMin = (xmin / 1000) * width;
          const absYMax = (ymax / 1000) * height;
          const absXMax = (xmax / 1000) * width;

          const boxWidth = absXMax - absXMin;
          const boxHeight = absYMax - absYMin;
          const x = absXMin + (boxWidth / 2);
          const y = absYMin + (boxHeight / 2);

          return {
            x,
            y,
            width: boxWidth,
            height: boxHeight,
            class: p.class,
            confidence: p.confidence
          };
        });
        resolve(predictions);
      };
      img.src = imageBase64;
    });

  } catch (error) {
    console.error("Gemini Detection Error:", error);
    return [];
  }
};

export const getSkinCareInsights = async (imageBase64: string, predictions?: RoboflowPrediction[], userApiKey?: string, patientHistory?: PatientHistory, classificationContext?: string): Promise<AIInsights> => {
  // Prioritize user-provided key, then environment variables
  const apiKey = userApiKey || 
                 import.meta.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY || 
                 process.env.API_KEY;

  if (!apiKey) {
    console.error("Missing Gemini API Key.");
    return {
      clinicalImpression: "Configuration Error",
      severity: "Moderate",
      acneType: "Unknown",
      objectiveFindings: ["The Google Gemini API Key is missing."],
      treatmentPlan: [
        "1. Go to your Vercel Project Settings.",
        "2. Add an Environment Variable named VITE_GEMINI_API_KEY.",
        "3. Paste your key from Google AI Studio.",
        "4. REDEPLOY your application."
      ],
      ingredientRationale: [],
      disclaimer: "System Error: Missing API Key",
      recommendedIngredients: [],
      recommendedProducts: []
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let countStr = "Not available";
  if (predictions) {
    const counts = predictions.reduce((acc: any, p) => {
      acc[p.class] = (acc[p.class] || 0) + 1;
      return acc;
    }, {});
    countStr = Object.entries(counts).map(([name, count]) => `${count} ${name}(s)`).join(", ");
  }

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
    You are an expert dermatologist AI. You are provided with an image of a patient's skin.
    ${predictions ? `A preliminary object detection model found: ${countStr} (Total: ${predictions.length}).` : ''}
    ${classificationContext ? `A specialized classification model has diagnosed this as: "${classificationContext}".` : ''}
    ${historyContext}
    
    **CRITICAL INSTRUCTION:**
    Visually analyze the image to determine the true severity and type of acne.
    - **Mild:** Mostly Comedones, or very few scattered inflammatory lesions.
    - **Moderate:** Distinct presence of multiple inflammatory lesions (Papules/Pustules).
    - **Severe:** Widespread inflammatory lesions, presence of Nodules/Cysts, or scarring.

    Provide a professional, structured clinical assessment mimicking how a dermatologist would write a patient chart.
    
    IMPORTANT GUIDELINES: 
    1. Recommend 3 specific skincare products available in the Philippines.
    2. Provide a strong medical disclaimer.
    3. Ensure recommendations align with your VISUAL assessment.
    4. TREATMENT PLAN: Create a concise AM/PM routine. Each item MUST be a full sentence starting with "AM: ", "PM: ", or "Note: ". Do NOT output single words.
    5. CLINICAL IMPRESSION: 1-2 sentences. State severity explicitly.
    6. **TIMELINE:** Include expected timeline for results.
    7. **SEVERITY & TYPE:** Explicitly categorize severity and dominant acne type.
    8. **OBJECTIVE FINDINGS:** Provide 3 brief observations (morphology + location).
    
    Return the response in JSON format with the following structure:
    {
      "clinicalImpression": "A concise clinical assessment.",
      "severity": "Mild" | "Moderate" | "Severe",
      "acneType": "Specific acne type",
      "objectiveFindings": ["Brief observation 1", "Brief observation 2", "Brief observation 3"],
      "treatmentPlan": ["AM: Step 1 description.", "PM: Step 1 description.", "Note: Important lifestyle advice."],
      "ingredientRationale": [
        {
          "ingredient": "Name of active ingredient",
          "rationale": "Specific reason for recommending this."
        }
      ],
      "disclaimer": "Strong medical disclaimer.",
      "recommendedIngredients": ["List of active ingredients"],
      "recommendedProducts": [
        {
          "brand": "Brand Name",
          "name": "Product Name",
          "type": "Drug" or "Cosmetic"
        }
      ]
    }
  `;

  try {
    // Parse base64 image
    const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/jpeg";
    const imageBytes = imageBase64.split(",")[1];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBytes
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clinicalImpression: { type: Type.STRING },
            severity: { type: Type.STRING, description: "Must be one of: Mild, Moderate, Severe" },
            acneType: { type: Type.STRING },
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
                  type: { type: Type.STRING, description: "Must be one of: Drug, Cosmetic" }
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

    // Force classification context if available and valid (ResNet Model Priority)
    if (classificationContext && classificationContext.trim() !== "") {
      parsedResult.acneType = classificationContext;
    }

    // Fallback for disclaimer if missing
    if (!parsedResult.disclaimer || parsedResult.disclaimer.trim() === "") {
      parsedResult.disclaimer = "This AI-generated analysis is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult with a board-certified dermatologist or qualified healthcare provider for any skin concerns. Do not disregard professional medical advice or delay seeking it because of something you have read on this platform.";
    }

    // Ensure arrays are initialized and filtered
    if (!Array.isArray(parsedResult.objectiveFindings)) {
      parsedResult.objectiveFindings = [];
    } else {
      // Relaxed filtering: allow strings or objects with text properties
      parsedResult.objectiveFindings = parsedResult.objectiveFindings.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
            return item.text || item.finding || item.description || null;
        }
        return null;
      }).filter((item: any) => {
          if (typeof item !== 'string') return false;
          const trimmed = item.trim();
          if (trimmed === '') return false;
          // Filter out single-word hallucinations
          if (trimmed.split(/\s+/).length < 3) return false;
          return true;
      }) as string[];
    }

    // Fallback for objective findings if empty
    if (parsedResult.objectiveFindings.length === 0) {
       parsedResult.objectiveFindings = [
         `Visual analysis indicates presence of ${parsedResult.acneType || "acne lesions"}.`,
         `Severity appears to be ${parsedResult.severity || "undetermined"}.`,
         "Please consult a dermatologist for a detailed physical examination."
       ];
    }

    if (!Array.isArray(parsedResult.treatmentPlan)) {
      parsedResult.treatmentPlan = [];
    } else {
      parsedResult.treatmentPlan = parsedResult.treatmentPlan.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
            return item.step || item.instruction || item.text || item.description || null;
        }
        return null;
      }).filter((item: any) => {
        if (typeof item !== 'string') return false;
        const trimmed = item.trim();
        if (trimmed === '') return false;
        
        // Filter out single-word hallucinations like "rationale", "ingredient"
        const lower = trimmed.toLowerCase();
        if (lower === 'rationale' || lower === 'ingredient' || lower === 'ingredients' || lower === 'note') return false;
        
        // If it's less than 3 words and doesn't start with AM/PM/Note, it's likely a hallucination
        const wordCount = trimmed.split(/\s+/).length;
        if (wordCount < 3 && !/^(am|pm|note):/i.test(trimmed)) {
            return false;
        }
        
        return true;
      }) as string[];
    }

    // Fallback for treatment plan if empty
    if (parsedResult.treatmentPlan.length === 0) {
      parsedResult.treatmentPlan = [
        "AM: Gentle Cleanser",
        "AM: Moisturizer with SPF 30+",
        "PM: Double Cleanse",
        "PM: Apply Spot Treatment (if needed)",
        "PM: Moisturizer",
        "Note: Consult a dermatologist for a personalized plan."
      ];
    }

    if (!Array.isArray(parsedResult.recommendedIngredients)) {
      parsedResult.recommendedIngredients = [];
    } else {
      parsedResult.recommendedIngredients = parsedResult.recommendedIngredients.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
            return item.name || item.ingredient || item.text || null;
        }
        return null;
      }).filter((item: any) => {
          if (typeof item !== 'string') return false;
          const trimmed = item.trim();
          if (trimmed === '') return false;
          // Reject keys that are obviously JSON keys
          const lower = trimmed.toLowerCase();
          if (lower === 'rationale' || lower === 'ingredient' || lower === 'ingredients' || lower === 'note') return false;
          return true;
      }) as string[];
    }

    if (!Array.isArray(parsedResult.recommendedProducts)) {
      parsedResult.recommendedProducts = [];
    } else {
      parsedResult.recommendedProducts = parsedResult.recommendedProducts.filter(item => item && typeof item === 'object' && item.brand && item.name);
    }

    if (!Array.isArray(parsedResult.ingredientRationale)) {
      parsedResult.ingredientRationale = [];
    } else {
      parsedResult.ingredientRationale = parsedResult.ingredientRationale.filter(item => item && typeof item === 'object' && item.ingredient && item.rationale);
    }

    // Fallback: If AI returns empty arrays for critical sections, populate with defaults based on detected classes
    if (parsedResult.recommendedIngredients.length === 0 || parsedResult.recommendedProducts.length === 0 || parsedResult.ingredientRationale.length === 0) {
      const defaultIngredients = ["Salicylic Acid", "Niacinamide", "Benzoyl Peroxide", "Retinol"];
      
      if (parsedResult.recommendedIngredients.length === 0) {
        parsedResult.recommendedIngredients = defaultIngredients;
      }

      if (parsedResult.ingredientRationale.length === 0) {
        parsedResult.ingredientRationale = [
          { ingredient: "Salicylic Acid", rationale: "Exfoliates pores and reduces inflammation, effective for most acne types." },
          { ingredient: "Niacinamide", rationale: "Controls oil production and reduces redness." },
          { ingredient: "Benzoyl Peroxide", rationale: "Kills acne-causing bacteria." },
          { ingredient: "Retinol", rationale: "Promotes cell turnover and prevents clogged pores." }
        ];
      }

      if (parsedResult.recommendedProducts.length === 0) {
        parsedResult.recommendedProducts = [
          { brand: "Celeteque", name: "Acne Solutions Cleanser", type: "Cosmetic" },
          { brand: "Luxe Organix", name: "Miracle Solutions Toner", type: "Cosmetic" },
          { brand: "Benzac", name: "Spots Treatment", type: "Drug" },
          { brand: "Human Nature", name: "Acne Defense Gel", type: "Cosmetic" }
        ];
      }
    }

    return parsedResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));

    // Check for 429 Resource Exhausted Error
    if (error.status === 429 || errorMessage.includes("429") || errorMessage.includes("quota")) {
      return {
        clinicalImpression: "Service Unavailable",
        severity: "Moderate",
        acneType: "Unknown",
        objectiveFindings: ["The AI service is currently experiencing high demand or quota limits."],
        treatmentPlan: ["Please try again in a few minutes.", "Check your Google AI Studio quota."],
        ingredientRationale: [],
        disclaimer: "System Error: Rate Limit Exceeded",
        recommendedIngredients: [],
        recommendedProducts: []
      };
    }

    return {
      clinicalImpression: "Analysis Failed",
      severity: "Moderate",
      acneType: "Unknown",
      objectiveFindings: [
        "Google Gemini API rejected the request.", 
        `Error Details: ${errorMessage}`
      ],
      treatmentPlan: [
        "1. Verify your API key is copied correctly (no missing characters).",
        "2. Ensure the Generative Language API is enabled in your Google Cloud Project.",
        "3. Check your browser's Developer Console (F12) for more details."
      ],
      ingredientRationale: [],
      disclaimer: "System Error: API Request Failed",
      recommendedIngredients: [],
      recommendedProducts: []
    };
  }
};
