import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.PUBLIC_KEY_IOE_GPA_CALC;
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please set GEMINI_API_KEY or PUBLIC_KEY_IOE_GPA_CALC.");
    }
    genAI = new GoogleGenAI(apiKey);
  }
  return genAI;
}

export async function getExpertAnalysis(context: any) {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are an Expert IOE Academic Analyst. Your knowledge is limited to the context of this IOE GPA Calculator website. Provide professional, concise, and data-driven advice. User should not be allowed to send any other messages except for that context.",
    });

    const prompt = `Analyze the following student marks data and provide strategic insights.
      Focus on:
      1. Capping risks (20% rule).
      2. Subject difficulty vs. credit weight.
      3. Actionable advice to improve GPA.
      
      Keep it concise, professional, and data-driven. Use markdown formatting.
      
      Data: ${JSON.stringify(context)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    if (error instanceof Error && error.message.includes("API key")) {
      return "API Key Error: Please ensure the Gemini API key is correctly configured in the settings.";
    }
    return "Failed to generate AI analysis. Please try again later.";
  }
}
