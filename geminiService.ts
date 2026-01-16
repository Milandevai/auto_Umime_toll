
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "./types";

const SYSTEM_INSTRUCTION = `
Jsi LITE asistent pro "Umíme to". Tvůj úkol:
1. Okamžitě najdi otázku.
2. Napiš JEN správnou odpověď.
3. Vysvětlení napiš v JEDNÉ extrémně krátké větě.

Odpovídej VŽDY v JSONu. Buď maximálně stručný.
`;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeScreen = async (base64Image: string, retries = 2): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      // Model gemini-flash-lite-latest má nejvyšší kvóty v bezplatném režimu
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Vyřeš. JSON." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "answer", "explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Prázdná odpověď.");
    
    return {
      ...JSON.parse(text),
      timestamp: Date.now()
    };
  } catch (error: any) {
    const errString = JSON.stringify(error);
    const isQuota = errString.includes('429') || errString.toLowerCase().includes('quota');

    if (isQuota && retries > 0) {
      console.log(`Limit detekován, zkouším znovu... Zbývá pokusů: ${retries}`);
      await delay(1500 * (3 - retries)); // Exponenciální čekání
      return analyzeScreen(base64Image, retries - 1);
    }

    if (isQuota) throw new Error("QUOTA_EXHAUSTED");
    throw new Error("Chyba analýzy.");
  }
};
