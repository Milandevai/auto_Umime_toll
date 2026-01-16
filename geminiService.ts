
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "./types";

const SYSTEM_INSTRUCTION = `
Jsi bleskový asistent pro portál "Umíme to". Tvůj úkol:
1. Okamžitě najdi otázku.
2. Poskytni správnou odpověď.
3. Vysvětli ji extrémně stručně (max 2-3 věty).

Odpovídej VŽDY v JSONu. Buď věcný, šetři slovy pro maximální rychlost.
`;

export const analyzeScreen = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Vyřeš úkol z obrázku. JSON format." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        // Zakázání "thinking" pro maximální rychlost odezvy
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            }
          },
          required: ["question", "answer", "explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Žádná odpověď.");
    
    return {
      ...JSON.parse(text),
      timestamp: Date.now()
    };
  } catch (error: any) {
    console.error("Gemini speed analysis error:", error);
    throw new Error("Chyba rychlé analýzy.");
  }
};
