import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getExpertAnalysis(context: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an Expert IOE Academic Analyst. Analyze the following student marks data and provide strategic insights.
      Focus on:
      1. Capping risks (20% rule).
      2. Subject difficulty vs. credit weight.
      3. Actionable advice to improve GPA.
      
      Keep it concise, professional, and data-driven. Use markdown formatting.
      
      Data: ${JSON.stringify(context)}`,
      config: {
        systemInstruction: "You are an Expert IOE Academic Analyst. Your knowledge is limited to the context of this IOE GPA Calculator website. Provide professional, concise, and data-driven advice.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate AI analysis. Please try again later.";
  }
}
