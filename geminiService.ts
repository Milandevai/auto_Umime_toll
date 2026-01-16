
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "./types";

const SYSTEM_INSTRUCTION = `
Jsi asistent umauto.ai pro portál "Umíme to". Tvůj úkol:
1. Okamžitě najdi otázku a všechny dostupné možnosti (tlačítka/texty) na obrázku.
2. Identifikuj správnou odpověď.
3. Jako 'answer' uveď DOSLOVNÝ text, který je napsaný na daném tlačítku nebo v dané možnosti na obrazovce. 
   - Musí to být 1:1 shoda s tím, co uživatel vidí.
   - Neopravuj pravopis, nezkracuj text.
4. Vysvětlení napiš v JEDNÉ extrémně krátké větě.

Odpovídej VŽDY v JSONu. Přesnost textu v 'answer' je kritická pro funkci aplikace.
`;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeScreen = async (base64Image: string, retries = 2): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Vyřeš úkol. Vrať v JSONu doslovný text správné možnosti." }
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
      await delay(1000 * (3 - retries));
      return analyzeScreen(base64Image, retries - 1);
    }

    if (isQuota) throw new Error("QUOTA_EXHAUSTED");
    throw new Error("Chyba analýzy.");
  }
};
